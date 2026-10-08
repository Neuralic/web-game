"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Shared by every component that shows a 2D avatar render (UserAvatar, ProfileHeadshot).
//  - one request per user at a time, however many components or React dev double-effects ask
//  - a success is reused for a while; a null (Roblox rate limit, no avatar) is remembered briefly so a
//    list of 50 avatars doesn't re-ask, then retried at most ONCE per user, after a delay
const SUCCESS_TTL_MS = 10 * 60 * 1000;
const NULL_TTL_MS = 45 * 1000;
export const AVATAR_RETRY_DELAY_MS = 45 * 1000;

const results = new Map<string, { url: string | null; at: number }>();
const inflight = new Map<string, Promise<string | null>>();
const retried = new Set<string>();

function peek(userId: string): string | null {
  const hit = results.get(userId);
  return hit?.url && Date.now() - hit.at < SUCCESS_TTL_MS ? hit.url : null;
}

export function fetchAvatarRender(userId: string): Promise<string | null> {
  const hit = results.get(userId);
  if (hit) {
    const age = Date.now() - hit.at;
    if (hit.url ? age < SUCCESS_TTL_MS : age < NULL_TTL_MS) return Promise.resolve(hit.url);
  }
  let pending = inflight.get(userId);
  if (!pending) {
    pending = fetch(`${API_BASE}/avatar/render/${userId}`)
      .then((r) => r.json())
      .then((d) => (d?.imageUrl as string | undefined) || null)
      .catch(() => null)
      .then((url) => {
        results.set(userId, { url, at: Date.now() });
        inflight.delete(userId);
        return url;
      });
    inflight.set(userId, pending);
  }
  return pending;
}

const listeners = new Map<string, Set<() => void>>();
const changeSubscribers = new Map<string, Set<() => void>>();
const notifyTimers = new Map<string, ReturnType<typeof setTimeout>>();
const REFETCH_DEBOUNCE_MS = 1500;

// Tell the other tabs of this browser. A message only ever triggers a LOCAL invalidation (no re-broadcast),
// so tabs can't ping-pong.
const CHANNEL_NAME = "avatar-render";
let channel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent) => {
      const userId = event.data?.userId;
      if (typeof userId === "string" && userId) invalidateLocal(userId);
    };
  } catch { /* unsupported or blocked: single-tab behaviour only */ }
}

function invalidateLocal(userId: string) {
  results.delete(userId);
  retried.delete(userId);

  const pending = notifyTimers.get(userId);
  if (pending) clearTimeout(pending);
  notifyTimers.set(userId, setTimeout(() => {
    notifyTimers.delete(userId);
    listeners.get(userId)?.forEach((refetch) => refetch());
    changeSubscribers.get(userId)?.forEach((onChange) => onChange());
  }, REFETCH_DEBOUNCE_MS));
}

/**
 * Forget the cached render for a user (call after their outfit changed) and, after a short debounce,
 * make every mounted useAvatarRender/useAvatarRenderState for that user refetch. They keep showing the
 * previous image until the new one arrives, and keep it if the refetch fails.
 * Other open tabs of this browser are told too (pass broadcast: false when reacting to a notification).
 */
export function invalidateAvatarRender(userId: string, options: { broadcast?: boolean } = {}) {
  invalidateLocal(userId);
  if (options.broadcast !== false) {
    try { channel?.postMessage({ userId }); } catch { /* ignore */ }
  }
}

/** Drop the cached render for a user without notifying anyone (their next fetch is fresh). */
export function forgetAvatarRender(userId: string) {
  results.delete(userId);
  retried.delete(userId);
}

/**
 * Call `onChange` (after the same debounce) whenever this user's outfit changed, here or in another tab.
 * For things that load their own data, such as the profile's Currently Wearing tiles. Returns an unsubscribe.
 */
export function subscribeAvatarChanged(userId: string, onChange: () => void): () => void {
  let set = changeSubscribers.get(userId);
  if (!set) changeSubscribers.set(userId, (set = new Set()));
  set.add(onChange);
  return () => { changeSubscribers.get(userId)?.delete(onChange); };
}

/** The user's 2D avatar render URL, or null (callers show their initial-letter fallback). */
export function useAvatarRender(userId: string): string | null {
  return useAvatarRenderState(userId).imageUrl;
}

/** Same as useAvatarRender, plus `loading` (true until the first request for this user settles). */
export function useAvatarRenderState(userId: string): { imageUrl: string | null; loading: boolean } {
  const [imageUrl, setImageUrl] = useState<string | null>(() => (userId ? peek(userId) : null));
  const [loading, setLoading] = useState<boolean>(() => !!userId && !peek(userId));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Refetch requested by invalidateAvatarRender (outfit changed).
    const refetch = () => {
      fetchAvatarRender(userId).then((url) => {
        if (!cancelled && url) setImageUrl(url);
      });
    };
    let set = listeners.get(userId);
    if (!set) listeners.set(userId, (set = new Set()));
    set.add(refetch);

    fetchAvatarRender(userId).then((url) => {
      if (cancelled) return;
      setImageUrl(url);
      setLoading(false);
      if (url) return;
      // One delayed retry per user (shared across components). Marked used only when it actually fires,
      // so a dev double-effect that clears its timer doesn't consume it.
      timer = setTimeout(() => {
        let next: Promise<string | null>;
        if (!retried.has(userId)) {
          retried.add(userId);
          results.delete(userId);
          next = fetchAvatarRender(userId);
        } else {
          // another component already used this user's retry: just adopt its (in-flight or finished) result
          next = inflight.get(userId) ?? Promise.resolve(peek(userId));
        }
        next.then((retryUrl) => { if (!cancelled && retryUrl) setImageUrl(retryUrl); });
      }, AVATAR_RETRY_DELAY_MS);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      listeners.get(userId)?.delete(refetch);
    };
  }, [userId]);

  return { imageUrl, loading };
}
