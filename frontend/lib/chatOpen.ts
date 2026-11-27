// "Open a chat with this user" for buttons elsewhere on the site (notification dropdown, profile page). The chat widget registers
// the real handler while it is mounted. Kept in its own tiny module so those buttons do not import the chat widget itself, which
// would pull the Supabase/realtime code into every page that has a header.

type OpenChatHandler = (userId: string, username: string, displayName?: string, avatarUrl?: string) => void;

let handler: OpenChatHandler | null = null;

/** Called by the chat widget: registers (or, with null, removes) the handler. */
export const setOpenChatHandler = (next: OpenChatHandler | null) => {
  handler = next;
};

export const openChatWithUser: OpenChatHandler = (userId, username, displayName, avatarUrl) => {
  if (handler) handler(userId, username, displayName, avatarUrl);
};
