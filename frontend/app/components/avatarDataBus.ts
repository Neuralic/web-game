import type { CustomAvatarData } from "./avatar3d/avatarScene"; // type only: no three.js is loaded through this file

// The 3D viewer fetches the signed-in user's outfit again every time it changes (editor equip). AvatarThumbnailSync waits for
// that data to draw the new 2D head straight away, instead of fetching the same outfit a second time. Only the latest data
// per user is kept, and only the user's own outfit is ever published (never a try-on preview).
type Entry = { data: CustomAvatarData; at: number };

const latest = new Map<string, Entry>();
const waiters = new Map<string, Set<(entry: Entry) => void>>();

export function publishAvatarData(userId: string, data: CustomAvatarData) {
  const entry = { data, at: Date.now() };
  latest.clear(); // one slot: the viewer shows other people's avatars too, and their data is not kept around
  latest.set(userId, entry);
  const waiting = waiters.get(userId);
  waiters.delete(userId);
  waiting?.forEach((resolve) => resolve(entry));
}

/** The outfit data the viewer loaded after `since` (a timestamp), waiting up to `timeoutMs` for it; null when none came. */
export function waitForAvatarData(userId: string, since: number, timeoutMs: number): Promise<CustomAvatarData | null> {
  const have = latest.get(userId);
  if (have && have.at >= since) return Promise.resolve(have.data);
  return new Promise((resolve) => {
    const onData = (entry: Entry) => {
      clearTimeout(timer);
      resolve(entry.at >= since ? entry.data : null);
    };
    const timer = setTimeout(() => {
      waiters.get(userId)?.delete(onData);
      resolve(null);
    }, timeoutMs);
    let set = waiters.get(userId);
    if (!set) waiters.set(userId, (set = new Set()));
    set.add(onData);
  });
}
