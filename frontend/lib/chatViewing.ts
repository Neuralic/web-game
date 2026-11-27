// Which chat conversations are open on screen right now. Split out of chatUnread.ts so the notification provider (which sits in
// the root layout and needs to know "is this chat being read?") does not pull the whole Supabase/realtime stack into every page,
// including for visitors who are not logged in. chatUnread.ts imports and re-exports these; nothing else changes.

/** Open conversations, by the other user's id (a count, because a chat window and the Messages page can both show one). */
export const viewing = new Map<string, number>();

export const isTabActive = () =>
  typeof document !== "undefined" && document.visibilityState === "visible" && document.hasFocus();

/** True while a chat window / thread with this user is open and the tab is in front. */
export const isConversationViewed = (otherUserId: string | null | undefined): boolean =>
  !!otherUserId && (viewing.get(otherUserId) ?? 0) > 0 && isTabActive();
