// Title / icon / place id of a game, looked up by game id. Presence only carries the id of the game a user is in, so the
// badges and "Playing ..." labels resolve the rest here. Requests are batched (one call for all the ids a page asks for in
// the same moment) and cached for the life of the page, so 30 friends in 6 games cost one request, once.

export interface GameSummary {
  id: string;
  title: string;
  iconUrl: string | null;
  thumbnailUrl: string | null;
  placeId: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const BATCH_DELAY_MS = 30;
const MAX_IDS_PER_REQUEST = 50; // the endpoint's limit
const RETRY_AFTER_FAILURE_MS = 30_000;

// undefined = not asked yet / loading, null = the game doesn't exist (or isn't published)
const cache = new Map<string, GameSummary | null>();
const failedAt = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();
let queued = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

const notify = (id: string) => listeners.get(id)?.forEach((fn) => fn());

async function flush() {
  timer = null;
  const ids = Array.from(queued);
  queued = new Set();
  for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
    const chunk = ids.slice(i, i + MAX_IDS_PER_REQUEST);
    try {
      const res = await fetch(`${API_BASE}/games/summaries?ids=${encodeURIComponent(chunk.join(","))}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("summaries request failed");
      const found = new Map<string, GameSummary>((data.data.games as GameSummary[]).map((g) => [g.id, g]));
      for (const id of chunk) {
        cache.set(id, found.get(id) ?? null);
        notify(id);
      }
    } catch {
      const now = Date.now();
      for (const id of chunk) failedAt.set(id, now); // try again later, not in a loop
    }
  }
}

/** The cached summary: undefined while unknown, null when the game doesn't exist. */
export function getCachedGameSummary(id: string): GameSummary | null | undefined {
  return cache.get(id);
}

/** Ask for a summary (no-op when cached, in flight, or failed less than 30 s ago). */
export function requestGameSummary(id: string): void {
  if (cache.has(id) || queued.has(id)) return;
  const failed = failedAt.get(id);
  if (failed !== undefined && Date.now() - failed < RETRY_AFTER_FAILURE_MS) return;
  queued.add(id);
  if (!timer) timer = setTimeout(flush, BATCH_DELAY_MS);
}

/** Call `fn` whenever the summary of `id` arrives. Returns the unsubscribe function. */
export function subscribeGameSummary(id: string, fn: () => void): () => void {
  let set = listeners.get(id);
  if (!set) listeners.set(id, (set = new Set()));
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) listeners.delete(id);
  };
}
