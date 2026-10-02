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

/** The user's 2D avatar render URL, or null (callers show their initial-letter fallback). */
export function useAvatarRender(userId: string): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(() => (userId ? peek(userId) : null));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    fetchAvatarRender(userId).then((url) => {
      if (cancelled) return;
      setImageUrl(url);
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
    };
  }, [userId]);

  return imageUrl;
}
