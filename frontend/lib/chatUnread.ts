// One source of truth for unread chat messages, shared by the chat widget, the Messages page and the header bell.
// Before this, the widget and the Messages page each kept their own count and neither knew when the other had read a chat.
//
// - Counts are per sender (the other user of a conversation) and always numbers (the API sends real integers).
// - A single Realtime listener sees every incoming message: if that conversation is open AND the tab is focused it is
//   marked read right away, otherwise it counts as unread and plays the notification sound.
// - The server is the truth: counts are re-read on reconnect, when the tab regains focus and when messages are marked
//   read from another tab, so a stale badge heals itself.

import { useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { messagesApi } from "@/lib/api";
import { markMessagesAsRead } from "@/lib/realtime";
import { canPlayChatSound, initChatSound, playChatSound } from "@/lib/chatSound";

interface UnreadSnapshot {
  counts: Record<string, number>;
  total: number;
}

const EMPTY: UnreadSnapshot = { counts: {}, total: 0 };
const CLAIM_KEY = "ab_chat_last_handled"; // lets only one browser tab ring for a given message

let snapshot: UnreadSnapshot = EMPTY;
let version = 0; // bumped by every local change, so a slow server response can't overwrite a newer local count
const listeners = new Set<() => void>();

let meId: string | null = null;
let channel: RealtimeChannel | null = null;
let teardownTabListeners: (() => void) | null = null;
let updateRefreshTimer: ReturnType<typeof setTimeout> | null = null;
const seenMessageIds: string[] = [];
const viewing = new Map<string, number>();

const emit = () => listeners.forEach((l) => l());

const setCounts = (counts: Record<string, number>) => {
  version++;
  let total = 0;
  for (const id of Object.keys(counts)) {
    if (counts[id] > 0) total += counts[id];
    else delete counts[id];
  }
  snapshot = { counts, total };
  emit();
};

const adjust = (senderId: string, delta: number) => {
  const next = { ...snapshot.counts };
  next[senderId] = Math.max(0, (next[senderId] || 0) + delta);
  setCounts(next);
};

const isTabActive = () =>
  typeof document !== "undefined" && document.visibilityState === "visible" && document.hasFocus();

/** True while a chat window / thread with this user is open and the tab is in front. */
export const isConversationViewed = (otherUserId: string | null | undefined): boolean =>
  !!otherUserId && (viewing.get(otherUserId) ?? 0) > 0 && isTabActive();

/** Clears the badge at once and tells the server (which also clears the matching bell notifications). */
export const markConversationRead = async (otherUserId: string): Promise<void> => {
  if (snapshot.counts[otherUserId]) {
    const next = { ...snapshot.counts };
    delete next[otherUserId];
    setCounts(next);
  }
  const ok = await markMessagesAsRead(otherUserId);
  if (!ok) {
    void refreshChatUnread(); // the server still has them unread: show the truth again
    return;
  }
  // header bell reloads its own count (the read messages' notifications were just cleared server-side)
  window.dispatchEvent(new Event("ab:chat-read"));
};

/** Re-reads the per-conversation counts from the server. */
export const refreshChatUnread = async (): Promise<void> => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const startedAt = version;
    const response = await messagesApi.getUnreadCounts();
    if (!response.success || !response.data) return;
    if (version !== startedAt) continue; // something changed locally while the request was out: ask again

    const counts: Record<string, number> = {};
    const toMark: string[] = [];
    for (const row of response.data.counts) {
      const n = Number(row.count) || 0;
      if (n <= 0 || row.sender_id === meId) continue;
      if (isConversationViewed(row.sender_id)) toMark.push(row.sender_id); // being read right now
      else counts[row.sender_id] = n;
    }
    setCounts(counts);
    toMark.forEach((id) => void markConversationRead(id));
    return;
  }
};

/**
 * Registers that a conversation is open on screen (chat window, or the thread on the Messages page).
 * Returns the function that unregisters it. Opening it clears its unread count.
 */
export const registerConversationViewing = (otherUserId: string): (() => void) => {
  viewing.set(otherUserId, (viewing.get(otherUserId) ?? 0) + 1);
  if (isTabActive() && snapshot.counts[otherUserId]) void markConversationRead(otherUserId);
  return () => {
    const n = (viewing.get(otherUserId) ?? 1) - 1;
    if (n <= 0) viewing.delete(otherUserId);
    else viewing.set(otherUserId, n);
  };
};

const claimMessage = (messageId: string): boolean => {
  try {
    if (localStorage.getItem(CLAIM_KEY) === messageId) return false;
    localStorage.setItem(CLAIM_KEY, messageId);
  } catch {
    // storage blocked: every tab rings, which is acceptable
  }
  return true;
};

interface IncomingRow {
  id?: string;
  senderId?: string;
  content?: string;
  createdAt?: string;
}

const onIncomingMessage = (msg: IncomingRow) => {
  const senderId = msg?.senderId;
  if (!senderId || senderId === meId) return; // never for your own messages

  if (msg.id) {
    if (seenMessageIds.includes(msg.id)) return; // Realtime can redeliver after a reconnect
    seenMessageIds.push(msg.id);
    if (seenMessageIds.length > 200) seenMessageIds.shift();
  }

  // lets the chat widget update its conversation preview / order (unread numbers come from this store)
  window.dispatchEvent(
    new CustomEvent("ab:chat-incoming", {
      detail: { senderId, content: msg.content ?? "", createdAt: msg.createdAt ?? new Date().toISOString() },
    })
  );

  if (isConversationViewed(senderId)) {
    // you are looking at this chat: it is read as it arrives, no badge and no sound
    if (msg.id) claimMessage(msg.id);
    void markConversationRead(senderId);
    return;
  }

  adjust(senderId, 1);

  if (canPlayChatSound() && (!msg.id || claimMessage(msg.id))) playChatSound();
};

const attachTabListeners = () => {
  const onActive = () => {
    if (!isTabActive()) return;
    // came back to the tab: whatever is open on screen is now read, and counts may have changed in another tab
    for (const id of viewing.keys()) {
      if (snapshot.counts[id]) void markConversationRead(id);
    }
    void refreshChatUnread();
  };
  window.addEventListener("focus", onActive);
  document.addEventListener("visibilitychange", onActive);
  return () => {
    window.removeEventListener("focus", onActive);
    document.removeEventListener("visibilitychange", onActive);
  };
};

export const stopChatUnread = () => {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
  teardownTabListeners?.();
  teardownTabListeners = null;
  if (updateRefreshTimer) clearTimeout(updateRefreshTimer);
  updateRefreshTimer = null;
  meId = null;
  snapshot = EMPTY;
  version++;
  emit();
};

/** Starts the live listener for the signed-in user (safe to call again; it only restarts when the user changes). */
export const startChatUnread = () => {
  let userId: string | null = null;
  try {
    const token = localStorage.getItem("accessToken");
    if (token) userId = JSON.parse(atob(token.split(".")[1])).userId ?? null;
  } catch {
    userId = null;
  }
  if (!userId) return;
  if (meId === userId && channel) return;
  if (meId) stopChatUnread();

  meId = userId;
  initChatSound();
  teardownTabListeners = attachTabListeners();

  channel = supabase
    .channel(`chat-unread:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `receiverId=eq.${userId}` },
      (event: { new: IncomingRow }) => onIncomingMessage(event.new)
    )
    // messages marked read (from another tab or device): re-read the counts
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `receiverId=eq.${userId}` },
      () => {
        if (updateRefreshTimer) clearTimeout(updateRefreshTimer);
        updateRefreshTimer = setTimeout(() => void refreshChatUnread(), 400);
      }
    )
    .subscribe((status: string) => {
      if (status === "SUBSCRIBED") void refreshChatUnread(); // first load, and after any reconnect
    });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Current counts outside React (the hook below is the live version). */
export const getChatUnread = (): UnreadSnapshot => snapshot;

/** { counts: unread per user id, total } — live. */
export const useChatUnread = (): UnreadSnapshot =>
  useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY
  );
