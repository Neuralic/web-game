// Notification sound for new chat messages. The sound is synthesised with the Web Audio API (two soft notes), so there is
// no audio file and nothing is loaded from another host. Browsers only let a page make sound after the user has interacted
// with it, so the audio context is created/resumed on the first click, key press or touch; until then playChatSound() is a
// silent no-op instead of throwing.

import { useSyncExternalStore } from "react";

const MUTE_KEY = "ab_chat_sound_muted";
const MIN_GAP_MS = 800; // a burst of messages makes one sound, not a rattle

let audioContext: AudioContext | null = null;
let lastPlayedAt = 0;
let unlockListenersAdded = false;

// ── mute setting (remembered in localStorage, shared by every component and every tab) ──────────────────────────

const muteListeners = new Set<() => void>();

const readMuted = (): boolean => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
};

export const isChatSoundMuted = readMuted;

export const setChatSoundMuted = (muted: boolean) => {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // storage blocked: the setting then only lasts until reload
  }
  muteListeners.forEach((l) => l());
};

const subscribeMuted = (listener: () => void) => {
  muteListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === MUTE_KEY) listener(); // another tab changed it
  };
  window.addEventListener("storage", onStorage);
  return () => {
    muteListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

export const useChatSoundMuted = (): boolean =>
  useSyncExternalStore(subscribeMuted, readMuted, () => false);

// ── audio ────────────────────────────────────────────────────────────────────────────────────────────────────────

const getContext = (): AudioContext | null => {
  if (audioContext) return audioContext;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioContext = new Ctor();
  } catch {
    return null;
  }
  return audioContext;
};

/** Call once; the first user gesture then creates/resumes the audio context so later messages are allowed to ring. */
export const initChatSound = () => {
  if (unlockListenersAdded || typeof window === "undefined") return;
  unlockListenersAdded = true;

  const unlock = () => {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    if (ctx.state === "running") {
      events.forEach((e) => window.removeEventListener(e, unlock, true));
    }
  };
  const events = ["pointerdown", "keydown", "touchend"] as const;
  events.forEach((e) => window.addEventListener(e, unlock, true));
};

/** True when the browser currently allows this page to make sound. */
export const canPlayChatSound = (): boolean => audioContext?.state === "running";

const playNote = (ctx: AudioContext, frequency: number, start: number, length: number, peak: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
};

const ding = (ctx: AudioContext) => {
  const t = ctx.currentTime + 0.01;
  playNote(ctx, 659.25, t, 0.22, 0.16); // E5
  playNote(ctx, 880.0, t + 0.1, 0.34, 0.14); // A5
};

/**
 * Plays the short two-note "ding". Does nothing if muted, rate-limited, or the browser has not allowed audio yet.
 * `preview` is for a click on the mute button: it ignores the mute setting and may wait for the browser to resume audio.
 */
export const playChatSound = (options: { preview?: boolean } = {}): boolean => {
  if (typeof window === "undefined") return false;
  if (!options.preview && isChatSoundMuted()) return false;

  const now = Date.now();
  if (now - lastPlayedAt < MIN_GAP_MS) return false;

  const ctx = getContext();
  if (!ctx) return false;

  if (ctx.state === "suspended" && options.preview) {
    // inside a click: the browser lets audio start, but resume() is asynchronous (Safari)
    lastPlayedAt = now;
    void ctx.resume().then(() => { if (ctx.state === "running") ding(ctx); }).catch(() => {});
    return true;
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  if (ctx.state !== "running") return false; // no user gesture yet: stay silent rather than error

  lastPlayedAt = now;
  ding(ctx);
  return true;
};
