"use client";

import PresenceBadge from "./PresenceBadge";
import { useUserPresence } from "@/hooks/useUserPresence";

/**
 * Presence badge for one user, read live from the shared presence map: blue person = online, and a user who is in a game
 * shows that game's icon. Render it inside a `relative` wrapper around the avatar (see PresenceBadge).
 */
export default function UserPresenceBadge({ userId, size = 24 }: { userId: string; size?: number }) {
  const presence = useUserPresence(userId);
  return <PresenceBadge status={presence.presenceStatus} size={size} gameId={presence.currentGameId} gameTitle={presence.currentGame} />;
}
