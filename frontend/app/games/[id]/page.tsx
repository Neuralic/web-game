"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, ThumbsUp, Users, Eye, Gamepad2 } from "lucide-react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import UserAvatar from "../../components/UserAvatar";
import VerifiedBadge from "../../components/VerifiedBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface GameDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  iconUrl: string | null;
  creatorId: string;
  groupId: string | null;
  genre: string | null;
  tags: string[] | null;
  ageRating: string | null;
  maxPlayers: number | null;
  isPublished: boolean;
  visits: number;
  likes: number;
  favorites: number;
  currentPlayers: number;
  is_sponsored?: boolean;
  sponsor_bid?: number;
  universeId?: string | number | null;
  placeId?: string | number | null;
  creator_username?: string;
  creator_display_name?: string;
  creator_is_verified?: boolean;
  createdAt: string;
  updatedAt: string;
}

const GameDetailPage = () => {
  const params = useParams();
  const gameId = params?.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Like/favorite are UI-only for now — there's no backend endpoint yet to
  // persist a toggle, so this just reflects the click locally.
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    const fetchGame = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`${API_BASE}/games/${gameId}`);
        const data = await res.json();
        if (data.success && data.data?.game) {
          setGame(data.data.game);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch game:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const creatorName = game?.creator_display_name || game?.creator_username || "Unknown Creator";
  const canPlay = !!game?.placeId;

  const likeCount = game ? game.likes + (liked ? 1 : 0) : 0;
  const favoriteCount = game ? game.favorites + (favorited ? 1 : 0) : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notFound || !game ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Game Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              This game doesn&apos;t exist or is no longer published.
            </p>
            <Link href="/games" className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              Back to Games
            </Link>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-[21/9] mb-4 relative">
              {game.thumbnailUrl ? (
                <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <span className="text-white font-bold text-4xl">AB</span>
                </div>
              )}
              {game.is_sponsored && (
                <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Sponsored
                </div>
              )}
            </div>

            {/* Title row */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                {game.iconUrl ? (
                  <img src={game.iconUrl} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <Gamepad2 className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{game.title}</h1>
                {game.creator_username ? (
                  <Link
                    href={`/profile/${game.creator_username}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    By {creatorName}
                    {game.creator_is_verified && <VerifiedBadge size="sm" />}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">By {creatorName}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                {canPlay ? (
                  <a
                    href={`roblox://experiences/start?placeId=${game.placeId}`}
                    className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Play
                  </a>
                ) : (
                  <button
                    disabled
                    title="This game isn't linked to a playable Roblox place yet"
                    className="px-8 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold rounded-lg cursor-not-allowed"
                  >
                    Game not available
                  </button>
                )}
              </div>
            </div>

            {/* Like / Favorite */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setLiked((prev) => !prev)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  liked
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <ThumbsUp className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
                {likeCount.toLocaleString()}
              </button>
              <button
                onClick={() => setFavorited((prev) => !prev)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  favorited
                    ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Heart className="w-4 h-4" fill={favorited ? "currentColor" : "none"} />
                {favoriteCount.toLocaleString()}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <Eye className="w-4 h-4 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{game.visits?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visits</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <Heart className="w-4 h-4 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{favoriteCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Favorites</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <Users className="w-4 h-4 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{game.maxPlayers ?? "—"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Max Players</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <Gamepad2 className="w-4 h-4 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{game.genre || "All"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Genre</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* About */}
              <div className="flex-1 min-w-0">
                <div className="border-b border-gray-200 dark:border-gray-800 mb-4">
                  <div className="pb-3 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100 inline-block">
                    About
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {game.description || "No description provided."}
                </p>

                {game.tags && game.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {game.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Creator info */}
              <div className="lg:w-64 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Created By</h3>
                <Link
                  href={game.creator_username ? `/profile/${game.creator_username}` : "#"}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <UserAvatar userId={game.creatorId} username={creatorName} size={48} headshot />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
                      {creatorName}
                      {game.creator_is_verified && <VerifiedBadge size="sm" />}
                    </p>
                    {game.creator_username && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{game.creator_username}</p>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default GameDetailPage;
