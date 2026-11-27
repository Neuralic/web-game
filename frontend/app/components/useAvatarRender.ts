"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Shared by every component that shows a 2D avatar render (UserAvatar, ProfileHeadshot).
//  - one request per user at a time, however many components or React dev double-effects ask
//  - a success is reused for a while; a null (Roblox rate limit, no avatar) is remembered briefly so a
//    list of 50 avatars doesn't re-ask, then retried at most ONCE per user, after a delay
//  - an image that is not the user's current one (the Roblox fallback, or our image of an earlier outfit) is only reused for
//    STALE_TTL_MS and re-checked a few times while a component stays mounted, so a head that gets generated later (by the
//    owner's browser or the backfill) shows up without a reload
const SUCCESS_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 60 * 1000;
const NULL_TTL_MS = 45 * 1000;
export const AVATAR_RETRY_DELAY_MS = 45 * 1000;
const STALE_RECHECK_MS = 90 * 1000;
const STALE_RECHECKS = 3;
const LOCAL_TTL_MS = 10 * 60 * 1000;

// `headUrl` is our own head/bust image (made from the 3D scene); only present when the backend serves our images.
// `fresh`: the image shows the user's current outfit (our own image with a matching outfit hash).
const results = new Map<string, { url: string | null; headUrl: string | null; at: number; fresh: boolean }>();
const inflight = new Map<string, Promise<string | null>>();
const retried = new Set<string>();
// Images this browser just rendered for the signed-in user (blob: URLs). Shown at once, before they are uploaded and served by
// the backend, and kept in front of any server answer that is still about an earlier outfit.
const localImages = new Map<string, { url: string; headUrl: string; at: number }>();

const ttlOf = (hit: { url: string | null; fresh: boolean }) => (hit.url ? (hit.fresh ? SUCCESS_TTL_MS : STALE_TTL_MS) : NULL_TTL_MS);

function peek(userId: string): string | null {
  const hit = results.get(userId);
  return hit?.url && Date.now() - hit.at < ttlOf(hit) ? hit.url : null;
}

export function fetchAvatarRender(userId: string): Promise<string | null> {
  const hit = results.get(userId);
  if (hit && Date.now() - hit.at < ttlOf(hit)) return Promise.resolve(hit.url);
  let pending = inflight.get(userId);
  if (!pending) {
    pending = fetch(`${API_BASE}/avatar/render/${userId}`)
      .then((r) => r.json())
      .then((d) => ({
        url: (d?.imageUrl as string | undefined) || null,
        headUrl: (d?.headUrl as string | undefined) || null,
        fresh: d?.source === "adventureblox" && d?.fresh === true,
      }))
      .catch(() => ({ url: null as string | null, headUrl: null as string | null, fresh: false }))
      .then(({ url, headUrl, fresh }) => {
        const local = localImages.get(userId);
        if (local && Date.now() - local.at < LOCAL_TTL_MS) {
          if (fresh) {
            dropLocalImages(userId); // the server now has the image of the current outfit: use it
          } else {
            // Still the old outfit on the server (the upload is on its way): keep showing what was rendered here.
            url = local.url;
            headUrl = local.headUrl;
            fresh = true;
          }
        }
        results.set(userId, { url, headUrl: url ? headUrl : null, at: Date.now(), fresh: !!url && fresh });
        inflight.delete(userId);
        return url;
      });
    inflight.set(userId, pending);
  }
  return pending;
}

function dropLocalImages(userId: string) {
  const local = localImages.get(userId);
  localImages.delete(userId);
  // Components may still be showing it for a moment (until they take the server's URL), so release it a little later.
  if (local) setTimeout(() => { URL.revokeObjectURL(local.url); URL.revokeObjectURL(local.headUrl); }, 30_000);
}

/**
 * Show images this browser just rendered for `userId` (blob: URLs) right away, in every mounted component and without
 * waiting for the upload. The server's answer replaces them once it has the image of the current outfit.
 */
export function setLocalAvatarImages(userId: string, images: { full: Blob; head: Blob }) {
  dropLocalImages(userId);
  const local = { url: URL.createObjectURL(images.full), headUrl: URL.createObjectURL(images.head), at: Date.now() };
  localImages.set(userId, local);
  results.set(userId, { url: local.url, headUrl: local.headUrl, at: Date.now(), fresh: true });
  retried.delete(userId);
  listeners.get(userId)?.forEach((refetch) => refetch());
}

const listeners = new Map<string, Set<() => void>>();
const changeSubscribers = new Map<string, Set<(changedAt: number) => void>>();
const notifyTimers = new Map<string, ReturnType<typeof setTimeout>>();
const changeTimers = new Map<string, { since: number; timer: ReturnType<typeof setTimeout> }>();
const REFETCH_DEBOUNCE_MS = 1500;
// Whoever reacts to an outfit change itself (the thumbnail sync, the profile's wearing tiles) is told sooner than the
// components that just refetch the server's picture, which cannot be new before the sync has uploaded it.
const CHANGE_DEBOUNCE_MS = 250;

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
  dropLocalImages(userId); // they show the outfit from before this change

  const pending = notifyTimers.get(userId);
  if (pending) clearTimeout(pending);
  notifyTimers.set(userId, setTimeout(() => {
    notifyTimers.delete(userId);
    listeners.get(userId)?.forEach((refetch) => refetch());
  }, REFETCH_DEBOUNCE_MS));

  // changedAt: when the first of a burst of changes happened (what the sync waits for the viewer's data to be newer than)
  const waiting = changeTimers.get(userId);
  if (waiting) clearTimeout(waiting.timer);
  const since = waiting?.since ?? Date.now();
  changeTimers.set(userId, {
    since,
    timer: setTimeout(() => {
      changeTimers.delete(userId);
      changeSubscribers.get(userId)?.forEach((onChange) => onChange(since));
    }, CHANGE_DEBOUNCE_MS),
  });
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
 * Call `onChange` (after a short debounce) whenever this user's outfit changed, here or in another tab; it gets the time the
 * change happened. For things that load their own data, such as the profile's Currently Wearing tiles. Returns an unsubscribe.
 */
export function subscribeAvatarChanged(userId: string, onChange: (changedAt: number) => void): () => void {
  let set = changeSubscribers.get(userId);
  if (!set) changeSubscribers.set(userId, (set = new Set()));
  set.add(onChange);
  return () => { changeSubscribers.get(userId)?.delete(onChange); };
}

/** The user's 2D avatar render URL, or null (callers show their initial-letter fallback). */
export function useAvatarRender(userId: string): string | null {
  return useAvatarRenderState(userId).imageUrl;
}

function peekHead(userId: string): string | null {
  const hit = results.get(userId);
  return hit?.url && hit.headUrl && Date.now() - hit.at < ttlOf(hit) ? hit.headUrl : null;
}

/**
 * Same as useAvatarRender, plus `loading` (true until the first request for this user settles) and `headUrl`: our own
 * head/bust image when there is one (headshots use it as is; otherwise they zoom into the full-body image).
 */
export function useAvatarRenderState(userId: string): { imageUrl: string | null; headUrl: string | null; loading: boolean } {
  const [imageUrl, setImageUrl] = useState<string | null>(() => (userId ? peek(userId) : null));
  const [headUrl, setHeadUrl] = useState<string | null>(() => (userId ? peekHead(userId) : null));
  const [loading, setLoading] = useState<boolean>(() => !!userId && !peek(userId));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let staleTimer: ReturnType<typeof setTimeout> | undefined;

    // An image that is not the user's current outfit (the Roblox fallback, or our image of an earlier outfit) is looked at
    // again a few times while this component stays mounted: the owner's browser or the backfill may have made the real one.
    const watchStale = (rechecks: number) => {
      if (staleTimer) clearTimeout(staleTimer);
      if (cancelled || rechecks >= STALE_RECHECKS || !results.get(userId)?.url || results.get(userId)?.fresh) return;
      staleTimer = setTimeout(() => {
        fetchAvatarRender(userId).then((url) => {
          if (cancelled) return;
          if (url) {
            setImageUrl(url);
            setHeadUrl(peekHead(userId));
          }
          watchStale(rechecks + 1);
        });
      }, STALE_RECHECK_MS);
    };

    // Refetch requested by invalidateAvatarRender (outfit changed).
    const refetch = () => {
      fetchAvatarRender(userId).then((url) => {
        if (!cancelled && url) {
          setImageUrl(url);
          setHeadUrl(peekHead(userId));
          watchStale(0);
        }
      });
    };
    let set = listeners.get(userId);
    if (!set) listeners.set(userId, (set = new Set()));
    set.add(refetch);

    fetchAvatarRender(userId).then((url) => {
      if (cancelled) return;
      setImageUrl(url);
      setHeadUrl(peekHead(userId));
      setLoading(false);
      if (url) {
        watchStale(0);
        return;
      }
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
        next.then((retryUrl) => {
          if (!cancelled && retryUrl) {
            setImageUrl(retryUrl);
            setHeadUrl(peekHead(userId));
          }
        });
      }, AVATAR_RETRY_DELAY_MS);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (staleTimer) clearTimeout(staleTimer);
      listeners.get(userId)?.delete(refetch);
    };
  }, [userId]);

  return { imageUrl, headUrl, loading };
}
