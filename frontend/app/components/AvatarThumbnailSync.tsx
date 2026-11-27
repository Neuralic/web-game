"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { invalidateAvatarRender, setLocalAvatarImages, subscribeAvatarChanged } from "./useAvatarRender";
import { waitForAvatarData } from "./avatarDataBus";
import { AVATAR_SCENE_VERSION } from "./avatar3d/sceneVersion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Keeps the signed-in user's 2D avatar images (full body + head/bust, used for headshots, profile pictures, friend lists...)
// in step with their outfit. The images are rendered HERE, from the same 3D scene the avatar editor shows, because Roblox's
// own renderer cannot draw the long-id items. They are uploaded to the backend (lib/avatarThumbnails.ts), which stores them
// and serves them from GET /avatar/render/:userId; the Roblox render stays as the fallback until the first upload.
//
// "Stale" is decided by the server (the stored image's outfit hash no longer matches the current outfit), so this covers the
// editor, an equip from any other page, and everyone who simply comes back after the feature shipped (the backfill). Checked
// on load, on route changes, and right after the editor announces an outfit change. It costs one small status request when
// nothing changed; the 3D data and the WebGL work only happen when the image really is out of date.

const MIN_GAP_MS = 30_000; // between the passive checks (load / navigation); outfit-change checks ignore it
const MAX_TRIES_PER_HASH = 3; // a failing upload is not retried forever
const FIRST_CHECK_DELAY_MS = 4_000;
const AFTER_CHANGE_DELAY_MS = 300;
const PREVIEW_WAIT_MS = 8_000; // how long the editor's viewer gets to deliver the new outfit for the instant preview

function readUserId(): { token: string; userId: string } | null {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const userId = JSON.parse(atob(token.split(".")[1])).userId;
    return typeof userId === "string" ? { token, userId } : null;
  } catch {
    return null;
  }
}

function tooManyTries(userId: string, hash: string): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(`ab_thumb_tries:${userId}`) || "null");
    return saved?.hash === hash && saved.n >= MAX_TRIES_PER_HASH && Date.now() - saved.at < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function noteTry(userId: string, hash: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(`ab_thumb_tries:${userId}`) || "null");
    const n = saved?.hash === hash ? saved.n + 1 : 1;
    localStorage.setItem(`ab_thumb_tries:${userId}`, JSON.stringify({ hash, n, at: Date.now() }));
  } catch {
    /* storage blocked: the per-session guard below still applies */
  }
}

let running = false;
let lastRun = 0;
let ignoreChangesUntil = 0;
let previewToken = 0;

/**
 * The outfit just changed in this browser (editor): draw the new 2D head from the 3D data the viewer is loading anyway and show
 * it everywhere at once, before the normal path below has checked the server, uploaded and had the picture served back.
 * Nothing is stored from here; the upload still comes from sync(), with the server's own copy of the outfit.
 */
async function previewFromViewer(userId: string, since: number): Promise<void> {
  const token = ++previewToken;
  try {
    const data = await waitForAvatarData(userId, since, PREVIEW_WAIT_MS);
    if (!data || token !== previewToken) return;
    const { captureAvatarImages } = await import("./avatar3d/avatarSnapshots");
    const images = await captureAvatarImages(data);
    if (token !== previewToken) return; // changed again while drawing: that change draws its own
    setLocalAvatarImages(userId, images);
  } catch (error) {
    console.warn("Avatar preview skipped:", error);
  }
}

async function sync(force: boolean): Promise<void> {
  if (running) return;
  if (!force && Date.now() - lastRun < MIN_GAP_MS) return;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
  running = true;
  lastRun = Date.now();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const who = readUserId();
      if (!who) return;
      const headers = { Authorization: `Bearer ${who.token}` };

      const statusRes = await fetch(`${API_BASE}/avatar/thumbnails/status`, { headers, cache: "no-store" });
      if (!statusRes.ok) return;
      const status = (await statusRes.json())?.data;
      if (!status?.supported || !status.hasOutfit || status.current) return;
      // The server expects images of a different scene version: this page's bundle is out of date (or the server is). The
      // upload would be refused, so don't render; a reload picks up the current bundle.
      if (status.version !== undefined && status.version !== AVATAR_SCENE_VERSION) return;
      if (tooManyTries(who.userId, status.outfitHash)) return;
      noteTry(who.userId, status.outfitHash);

      // fresh=1: skip the server's short-lived outfit cache, so this is the outfit the hash was computed from
      const dataRes = await fetch(`${API_BASE}/avatar/3d-custom-v2/${who.userId}?packed=1&fresh=1`, { cache: "no-store" });
      if (!dataRes.ok) return;
      const data = await dataRes.json();
      if (!data?.success) return;

      const { captureAvatarImages } = await import("./avatar3d/avatarSnapshots"); // three.js only loads when needed
      const images = await captureAvatarImages(data);
      setLocalAvatarImages(who.userId, images); // visible now; the upload below makes it permanent

      const form = new FormData();
      form.append("outfitHash", status.outfitHash);
      form.append("sceneVersion", String(AVATAR_SCENE_VERSION));
      form.append("full", images.full, images.full.type === "image/webp" ? "full.webp" : "full.png");
      form.append("head", images.head, images.head.type === "image/webp" ? "head.webp" : "head.png");
      const upload = await fetch(`${API_BASE}/avatar/thumbnails`, { method: "POST", headers, body: form });
      if (upload.status === 409) continue; // the outfit changed while rendering: look again, once
      if (!upload.ok) return;

      // Everything showing this user's avatar (here and in other tabs) fetches the new images. That announces a "change"
      // to this very component too, so ignore it for a moment instead of checking again.
      ignoreChangesUntil = Date.now() + 5_000;
      invalidateAvatarRender(who.userId);
      return;
    }
  } catch (error) {
    console.warn("Avatar picture update skipped:", error);
  } finally {
    running = false;
  }
}

export default function AvatarThumbnailSync() {
  const pathname = usePathname();

  // On load, and after the outfit changed in the editor (or in another tab).
  useEffect(() => {
    const first = setTimeout(() => void sync(true), FIRST_CHECK_DELAY_MS);
    const who = readUserId();
    let unsubscribe: (() => void) | undefined;
    let afterChange: ReturnType<typeof setTimeout> | undefined;
    if (who) {
      unsubscribe = subscribeAvatarChanged(who.userId, (changedAt) => {
        if (Date.now() < ignoreChangesUntil) return;
        void previewFromViewer(who.userId, changedAt);
        clearTimeout(afterChange);
        afterChange = setTimeout(() => void sync(true), AFTER_CHANGE_DELAY_MS);
      });
    }
    return () => {
      clearTimeout(first);
      clearTimeout(afterChange);
      unsubscribe?.();
    };
  }, []);

  // An outfit can also change on a page that has no 3D viewer (equip from the catalog): check on navigation, rate limited.
  useEffect(() => {
    const timer = setTimeout(() => void sync(false), 2_000);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
