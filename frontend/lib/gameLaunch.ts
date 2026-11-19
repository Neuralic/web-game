// Launching a game, shared by every Play button (game page, cards on home / profile / groups / games list).
import { storage } from './api';
import { startPlayingGame } from './realtime';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const isMobileBrowser = (): boolean =>
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/** The roblox:// link that starts the experience (optionally a specific server). */
export const robloxLaunchUrl = (placeId: string | number, gameInstanceId?: string): string =>
  `roblox://experiences/start?placeId=${placeId}${gameInstanceId ? `&gameInstanceId=${gameInstanceId}` : ''}`;

/**
 * Call when a Play link is clicked on desktop: records the play (feeds "Recently Played") and shows the user as in-game
 * (with this game's icon) to their friends, followers and group members. Never throws.
 */
export function onGameLaunched(game: { id: string; title: string }): void {
  const token = storage.getAccessToken();
  if (!token || !game.id) return;
  fetch(`${API_BASE}/games/${game.id}/play`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch((error) => console.error('Failed to record game play:', error));
  startPlayingGame({ id: game.id, title: game.title }).catch(() => {});
}
