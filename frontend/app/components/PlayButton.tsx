"use client";

import { useRouter } from "next/navigation";
import { isMobileBrowser, onGameLaunched, robloxLaunchUrl } from "@/lib/gameLaunch";

interface PlayButtonProps {
  game: { id: string; title: string; placeId?: string | number | null };
  className?: string;
}

const BASE = "block text-center text-sm font-bold py-2 rounded-lg transition-colors";

/**
 * The green Play button on game cards (home, profile, groups, games list). Same launch as the Play button on the game page:
 * desktop opens the Roblox app on the game's place, records the play (Recently Played) and shows the user as in-game.
 * On mobile it opens the game page, which has the "open the Roblox app" instructions. A game with no Roblox place linked
 * gets a disabled button, as on the game page. Put it next to the card's link, not inside it (no nested links).
 */
export default function PlayButton({ game, className = "" }: PlayButtonProps) {
  const router = useRouter();

  if (!game.placeId) {
    return (
      <span
        className={`${BASE} bg-gray-300 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 cursor-not-allowed ${className}`}
        title="This game isn't linked to a playable Roblox place yet"
      >
        Play
      </span>
    );
  }

  return (
    <a
      href={robloxLaunchUrl(game.placeId)}
      onClick={(e) => {
        if (isMobileBrowser()) {
          e.preventDefault();
          router.push(`/games/${game.id}`);
          return;
        }
        onGameLaunched({ id: game.id, title: game.title });
      }}
      className={`${BASE} bg-green-500 hover:bg-green-600 text-white ${className}`}
    >
      Play
    </a>
  );
}
