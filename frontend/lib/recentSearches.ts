// Recent searches, kept in this browser only (nothing is sent to the server). Every access is wrapped: storage can be blocked
// (private window, cleared site data) and search must work without it.

const KEY = "ab_recent_searches";
const MAX_ENTRIES = 8;
const MAX_LENGTH = 64;

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string" && entry.length > 0).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function write(entries: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* storage unavailable: recents just do not persist */
  }
}

export function getRecentSearches(): string[] {
  return read();
}

/** Moves `query` to the top (one entry per text, case-insensitive). */
export function addRecentSearch(query: string): string[] {
  const text = query.trim().replace(/\s+/g, " ").slice(0, MAX_LENGTH);
  if (!text) return read();
  const rest = read().filter((entry) => entry.toLowerCase() !== text.toLowerCase());
  const next = [text, ...rest].slice(0, MAX_ENTRIES);
  write(next);
  return next;
}

export function removeRecentSearch(query: string): string[] {
  const next = read().filter((entry) => entry !== query);
  write(next);
  return next;
}

export function clearRecentSearches(): string[] {
  write([]);
  return [];
}
