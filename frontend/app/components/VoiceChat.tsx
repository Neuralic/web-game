"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { voiceApi, storage, VoiceParticipant } from "@/lib/api";
import UserAvatar from "./UserAvatar";

// No TURN server configured — only a public STUN server. Peers behind
// symmetric NATs or restrictive corporate/school firewalls may fail to
// establish a direct connection to each other. Add a TURN server here if
// that turns out to be a real problem for real users.
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

const SIGNAL_POLL_MS = 3000;
const PARTICIPANT_POLL_MS = 3000;
const SPEAKING_CHECK_MS = 200;
const SPEAKING_THRESHOLD = 12; // 0-255 scale, rough average-frequency threshold

interface VoiceChatProps {
  groupId: string;
}

export default function VoiceChat({ groupId }: VoiceChatProps) {
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [speakingUserIds, setSpeakingUserIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const signalPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const participantPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = storage.getAccessToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserIdRef.current = payload.userId || null;
    } catch {
      // not logged in
    }
  }, []);

  const attachAnalyser = useCallback((userId: string, stream: MediaStream) => {
    if (!audioContextRef.current) return;
    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current.set(userId, analyser);
    } catch (err) {
      console.error("Failed to attach analyser for", userId, err);
    }
  }, []);

  const createPeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    const existing = peerConnectionsRef.current.get(remoteUserId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && roomIdRef.current) {
        voiceApi
          .sendSignal(roomIdRef.current, {
            toUserId: remoteUserId,
            signalType: "ice-candidate",
            payload: event.candidate.toJSON(),
          })
          .catch((err) => console.error("Failed to send ICE candidate:", err));
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      let audioEl = audioElsRef.current.get(remoteUserId);
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        audioElsRef.current.set(remoteUserId, audioEl);
      }
      audioEl.srcObject = remoteStream;
      attachAnalyser(remoteUserId, remoteStream);
    };

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  }, [attachAnalyser]);

  const initiateOfferTo = useCallback(
    async (remoteUserId: string) => {
      if (!roomIdRef.current) return;
      const pc = createPeerConnection(remoteUserId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await voiceApi.sendSignal(roomIdRef.current, {
          toUserId: remoteUserId,
          signalType: "offer",
          payload: { type: offer.type, sdp: offer.sdp },
        });
      } catch (err) {
        console.error("Failed to create/send offer to", remoteUserId, err);
      }
    },
    [createPeerConnection]
  );

  const closePeerConnection = useCallback((remoteUserId: string) => {
    const pc = peerConnectionsRef.current.get(remoteUserId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(remoteUserId);
    }
    const audioEl = audioElsRef.current.get(remoteUserId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioElsRef.current.delete(remoteUserId);
    }
    analysersRef.current.delete(remoteUserId);
  }, []);

  // Polling-based signaling: ICE candidates arriving before the matching
  // offer/answer has been applied will throw and get skipped (logged, not
  // fatal) — an inherent trade-off of 3s-polling instead of a real-time
  // channel. In practice trickle ICE keeps sending candidates, so a
  // dropped early one rarely prevents the connection from completing.
  const pollSignals = useCallback(async () => {
    if (!roomIdRef.current) return;
    try {
      const response = await voiceApi.getSignals(roomIdRef.current);
      if (!response.success || !response.data) return;

      for (const signal of response.data.signals) {
        const fromUserId = signal.from_user_id;

        if (signal.signal_type === "offer") {
          const pc = createPeerConnection(fromUserId);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await voiceApi.sendSignal(roomIdRef.current, {
              toUserId: fromUserId,
              signalType: "answer",
              payload: { type: answer.type, sdp: answer.sdp },
            });
          } catch (err) {
            console.error("Failed to handle offer from", fromUserId, err);
          }
        } else if (signal.signal_type === "answer") {
          const pc = peerConnectionsRef.current.get(fromUserId);
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            } catch (err) {
              console.error("Failed to apply answer from", fromUserId, err);
            }
          }
        } else if (signal.signal_type === "ice-candidate") {
          const pc = peerConnectionsRef.current.get(fromUserId) || createPeerConnection(fromUserId);
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
          } catch (err) {
            console.error("Failed to add ICE candidate from", fromUserId, err);
          }
        }
      }
    } catch (err) {
      console.error("Signal poll failed:", err);
    }
  }, [createPeerConnection]);

  // Detects joins/leaves since polling gives us no push notifications.
  // Initiator for each pair is decided deterministically (lower user ID
  // offers to the higher one) so both sides agree on who offers without
  // needing a central coordinator.
  const pollParticipants = useCallback(async () => {
    if (!groupId || !currentUserIdRef.current) return;
    try {
      const response = await voiceApi.getActiveRoom(groupId);
      if (!response.success || !response.data || !response.data.room) return;

      const freshParticipants = response.data.participants;
      setParticipants(freshParticipants);

      const myId = currentUserIdRef.current;
      const currentIds = new Set(freshParticipants.map((p) => p.user_id));

      for (const p of freshParticipants) {
        if (p.user_id === myId) continue;
        if (!peerConnectionsRef.current.has(p.user_id) && myId < p.user_id) {
          initiateOfferTo(p.user_id);
        }
      }

      for (const existingUserId of Array.from(peerConnectionsRef.current.keys())) {
        if (!currentIds.has(existingUserId)) {
          closePeerConnection(existingUserId);
        }
      }
    } catch (err) {
      console.error("Participant poll failed:", err);
    }
  }, [groupId, initiateOfferTo, closePeerConnection]);

  const checkSpeaking = useCallback(() => {
    const speaking = new Set<string>();

    analysersRef.current.forEach((analyser, userId) => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
      if (avg > SPEAKING_THRESHOLD) {
        speaking.add(userId);
      }
    });

    setSpeakingUserIds((prev) => {
      if (prev.size === speaking.size && Array.from(prev).every((id) => speaking.has(id))) {
        return prev;
      }
      return speaking;
    });
  }, []);

  const handleLeave = useCallback(async () => {
    if (signalPollIntervalRef.current) clearInterval(signalPollIntervalRef.current);
    if (participantPollIntervalRef.current) clearInterval(participantPollIntervalRef.current);
    if (speakingCheckIntervalRef.current) clearInterval(speakingCheckIntervalRef.current);
    signalPollIntervalRef.current = null;
    participantPollIntervalRef.current = null;
    speakingCheckIntervalRef.current = null;

    Array.from(peerConnectionsRef.current.keys()).forEach(closePeerConnection);

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analysersRef.current.clear();

    if (roomIdRef.current) {
      voiceApi.leaveRoom(roomIdRef.current).catch((err) => console.error("Failed to leave voice room:", err));
    }
    roomIdRef.current = null;

    setConnected(false);
    setParticipants([]);
    setSpeakingUserIds(new Set());
    setMuted(false);
  }, [closePeerConnection]);

  const handleJoin = async () => {
    if (!currentUserIdRef.current) {
      setError("You must be logged in to use voice chat.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser doesn't support voice chat.");
      return;
    }

    setJoining(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      attachAnalyser(currentUserIdRef.current, stream);

      const roomResponse = await voiceApi.createRoom(groupId);
      if (!roomResponse.success || !roomResponse.data) {
        throw new Error((roomResponse as any).message || "Failed to create voice room");
      }
      const roomId = roomResponse.data.roomId;
      roomIdRef.current = roomId;

      const joinResponse = await voiceApi.joinRoom(roomId);
      if (!joinResponse.success || !joinResponse.data) {
        throw new Error((joinResponse as any).message || "Failed to join voice room");
      }

      const existingParticipants = joinResponse.data.participants;
      setParticipants(existingParticipants);

      const myId = currentUserIdRef.current;
      for (const p of existingParticipants) {
        if (p.user_id === myId) continue;
        if (myId < p.user_id) {
          initiateOfferTo(p.user_id);
        }
      }

      signalPollIntervalRef.current = setInterval(pollSignals, SIGNAL_POLL_MS);
      participantPollIntervalRef.current = setInterval(pollParticipants, PARTICIPANT_POLL_MS);
      speakingCheckIntervalRef.current = setInterval(checkSpeaking, SPEAKING_CHECK_MS);

      setConnected(true);
      setExpanded(true);
    } catch (err: any) {
      console.error("Failed to join voice chat:", err);
      setError(
        err?.name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone access to use voice chat."
          : err?.message || "Failed to join voice chat."
      );
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    } finally {
      setJoining(false);
    }
  };

  const handleToggleMute = () => {
    if (!localStreamRef.current) return;
    const newMuted = !muted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !newMuted;
    });
    setMuted(newMuted);
  };

  // Leave on unmount — best-effort only, won't catch a hard tab close.
  useEffect(() => {
    return () => {
      if (roomIdRef.current) {
        handleLeave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-gray-900 dark:bg-[#1a1a1a] border border-gray-700 dark:border-[#2a2a2a] shadow-lg flex items-center justify-center hover:bg-gray-800 dark:hover:bg-[#242424] transition-colors"
        title="Voice Chat"
      >
        <Mic className={`w-5 h-5 ${connected ? "text-green-400" : "text-gray-400"}`} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Voice Chat</span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {!connected ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className="w-4 h-4" />
            {joining ? "Joining..." : "Join Voice"}
          </button>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              {participants.map((p) => {
                const isSpeaking = speakingUserIds.has(p.user_id);
                return (
                  <div key={p.user_id} className="flex flex-col items-center gap-1 w-14">
                    <div className={`rounded-full p-0.5 ${isSpeaking ? "ring-2 ring-green-500" : ""}`}>
                      <UserAvatar userId={p.user_id} username={p.display_name || p.username} size={40} />
                    </div>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate w-full text-center">
                      {p.display_name || p.username}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleToggleMute}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  muted
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "bg-gray-100 dark:bg-[#242424] text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {muted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={handleLeave}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                Leave
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
