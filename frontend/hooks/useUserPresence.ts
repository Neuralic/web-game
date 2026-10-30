import { useMemo } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';

export interface UserPresence {
  presenceStatus: 'online' | 'offline' | 'in-game';
  currentGame?: string;
  lastOnline: string | null;
  isOnline: boolean;
}

// Visible tabs re-track every 60 s (RealtimeContext); an entry older than this is a stale/ghost one.
const PRESENCE_STALE_MS = 3 * 60 * 1000;

/**
 * Hook to get real-time presence for a specific user.
 * Always returns a value — offline if user is not in the presence map.
 */
export const useUserPresence = (userId: string | undefined): UserPresence => {
  const { presenceMap } = useRealtime();

  return useMemo(() => {
    if (!userId) {
      return { presenceStatus: 'offline', lastOnline: null, isOnline: false };
    }
    const p = presenceMap.get(userId);
    if (p) {
      const lastSeen = p.lastOnline ? Date.parse(p.lastOnline) : NaN;
      if (!Number.isNaN(lastSeen) && Date.now() - lastSeen > PRESENCE_STALE_MS) {
        return { presenceStatus: 'offline', lastOnline: p.lastOnline, isOnline: false };
      }
      return {
        presenceStatus: p.presenceStatus,
        currentGame: p.currentGame,
        lastOnline: p.lastOnline,
        isOnline: p.presenceStatus === 'online' || p.presenceStatus === 'in-game',
      };
    }
    return { presenceStatus: 'offline', lastOnline: null, isOnline: false };
  }, [userId, presenceMap]);
};
