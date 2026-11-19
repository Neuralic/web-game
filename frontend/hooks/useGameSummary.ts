import { useEffect, useState } from 'react';
import { getCachedGameSummary, requestGameSummary, subscribeGameSummary, type GameSummary } from '@/lib/gameSummaries';

/**
 * Title / icon of a game by id (batched + cached, see lib/gameSummaries.ts).
 * undefined while it loads, null if the game doesn't exist, and undefined when no id is given.
 */
export const useGameSummary = (gameId: string | undefined | null): GameSummary | null | undefined => {
  const [, rerender] = useState(0);

  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = subscribeGameSummary(gameId, () => rerender((n) => n + 1));
    requestGameSummary(gameId);
    return unsubscribe;
  }, [gameId]);

  return gameId ? getCachedGameSummary(gameId) : undefined;
};
