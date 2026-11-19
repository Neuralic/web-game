import { useMemo } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import type { PresenceData } from '@/lib/realtime';

export interface UserPresence {
  presenceStatus: 'online' | 'offline' | 'in-game';
  currentGame?: string;
  /** games.id of the game the user is in (only when presenceStatus is 'in-game'). */
  currentGameId?: string;
  lastOnline: string | null;
  isOnline: boolean;
}

// Visible tabs re-track every 60 s (RealtimeContext); an entry older than this is a stale/ghost one.
const PRESENCE_STALE_MS = 3 * 60 * 1000;

const OFFLINE: UserPresence = { presenceStatus: 'offline', lastOnline: null, isOnline: false };

/**
 * Presence of one user out of the presence map, with the staleness rule applied. Not a hook: list pages use it per row
 * at render time, so a presence change updates the badges without refetching the list.
 */
export const resolvePresence = (presenceMap: Map<string, PresenceData>, userId: string | undefined): UserPresence => {
  if (!userId) return OFFLINE;
  const p = presenceMap.get(userId);
  if (!p) return OFFLINE;
  const lastSeen = p.lastOnline ? Date.parse(p.lastOnline) : NaN;
  if (!Number.isNaN(lastSeen) && Date.now() - lastSeen > PRESENCE_STALE_MS) {
    return { presenceStatus: 'offline', lastOnline: p.lastOnline, isOnline: false };
  }
  const inGame = p.presenceStatus === 'in-game';
  return {
    presenceStatus: p.presenceStatus,
    currentGame: p.currentGame,
    currentGameId: inGame ? p.currentGameId : undefined,
    lastOnline: p.lastOnline,
    isOnline: p.presenceStatus === 'online' || inGame,
  };
};

/**
 * Hook to get real-time presence for a specific user.
 * Always returns a value — offline if user is not in the presence map.
 */
export const useUserPresence = (userId: string | undefined): UserPresence => {
  const { presenceMap } = useRealtime();
  return useMemo(() => resolvePresence(presenceMap, userId), [userId, presenceMap]);
};
