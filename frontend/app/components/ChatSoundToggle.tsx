"use client";

import { Volume2, VolumeX } from "lucide-react";
import { initChatSound, playChatSound, setChatSoundMuted, useChatSoundMuted } from "@/lib/chatSound";

/**
 * Mute / unmute button for the chat notification sound. The choice is remembered (localStorage) and shared by every
 * place that shows this button. Unmuting plays the sound once as a preview, which also lets the browser allow audio.
 */
export default function ChatSoundToggle({ className = "" }: { className?: string }) {
  const muted = useChatSoundMuted();

  const toggle = () => {
    const nextMuted = !muted;
    setChatSoundMuted(nextMuted);
    if (!nextMuted) {
      initChatSound();
      playChatSound({ preview: true });
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? "Message sound is off. Click to turn on" : "Message sound is on. Click to mute"}
      aria-label={muted ? "Turn message sound on" : "Mute message sound"}
      aria-pressed={muted}
      className={`p-1 rounded transition-colors ${className}`}
    >
      {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
    </button>
  );
}
