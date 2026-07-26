"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Game {
  id: string;
  title: string;
  thumbnailUrl?: string;
  iconUrl?: string;
  visits: number;
}

interface GamesSectionProps {
  groupId?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function GamesSection({ groupId }: GamesSectionProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      if (!groupId) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/games/group/${groupId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setGames((data.data.games as Game[]) || []);
        }
      } catch (err) {
        console.error("Error fetching games:", err);
        setError("Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [groupId]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Games
        </h3>

        {games.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page 1</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {games.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group block flex-shrink-0"
              >
                <div className="w-[150px] h-[150px] border border-gray-200 dark:border-gray-700 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                  <img
                    src={
                      game.thumbnailUrl ||
                      game.iconUrl ||
                      `https://robohash.org/${game.id}?set=set4`
                    }
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <div className="mt-2 w-[150px]">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {game.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {game.visits?.toLocaleString() || 0} visits
                  </p>
                </div>
              </Link>
            ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No games yet.
          </p>
        </div>
      )}
    </div>
  );
}
