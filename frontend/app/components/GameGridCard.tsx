"use client";

import Link from "next/link";
import PlayButton from "./PlayButton";

export interface GameGridCardData {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  visits?: number | null;
  placeId?: string | number | null;
}

/**
 * Game card for grids (profile Favorite Games / Recently Played, Continue, Favorites): thumbnail, title, visits and the
 * green Play button. The thumbnail and title open the game page; the button launches the game.
 */
export default function GameGridCard({ game }: { game: GameGridCardData }) {
  return (
    <div>
      <Link href={`/games/${game.id}`} className="cursor-pointer group block">
        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
          {game.thumbnailUrl ? (
            <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-blue-200 to-green-200 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">ADVENTUREBLOX</span>
            </div>
          )}
        </div>
        <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{game.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{game.visits?.toLocaleString() || 0} visits</p>
      </Link>
      <PlayButton game={game} className="mt-2" />
    </div>
  );
}
