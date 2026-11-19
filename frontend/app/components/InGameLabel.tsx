"use client";

import Link from "next/link";
import { useGameSummary } from "@/hooks/useGameSummary";

interface InGameLabelProps {
  /** games.id of the game the user is in (from presence). */
  gameId?: string | null;
  /** Title from the presence data, shown until the game's own title has loaded (or when there is no id). */
  fallbackTitle?: string | null;
  className?: string;
}

/** "Playing <game>" for a user who is in a game; the game name links to the game's page when its id is known. */
export default function InGameLabel({ gameId, fallbackTitle, className = "" }: InGameLabelProps) {
  const game = useGameSummary(gameId);
  const title = game?.title || fallbackTitle || "";

  return (
    <span className={`block truncate ${className}`}>
      Playing{" "}
      {gameId && title ? (
        <Link href={`/games/${gameId}`} className="font-semibold hover:underline" title={title}>
          {title}
        </Link>
      ) : (
        title
      )}
    </span>
  );
}
