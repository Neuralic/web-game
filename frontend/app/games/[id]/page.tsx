"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, ThumbsUp, ThumbsDown, Bell, BellOff, Users, Eye, Gamepad2 } from "lucide-react";
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

const TABS = ["About", "Store", "Servers"] as const;
type Tab = (typeof TABS)[number];

const GameDetailPage = () => {
  const params = useParams();
  const gameId = params?.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("About");

  // Favorite/Notify/Like/Dislike are UI-only for now — there's no backend
  // endpoint yet to persist a toggle, so these just reflect the click locally.
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [notifyOn, setNotifyOn] = useState(false);

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

  const handleLike = () => {
    setLiked((prev) => !prev);
    if (!liked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked((prev) => !prev);
    if (!disliked) setLiked(false);
  };

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
            {/* Top section: media left, info panel right */}
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {/* Left ~60% — thumbnail/media */}
              <div className="lg:w-[60%] flex-shrink-0">
                <div className="rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-video relative">
                  {game.thumbnailUrl ? (
                    <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <span className="text-white font-bold text-4xl">AB</span>
                    </div>
                  )}
                  {/* Bottom gradient — obscures the "ROBLOX" watermark baked into the thumbnail */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
                  {game.is_sponsored && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Sponsored
                    </div>
                  )}
                </div>
              </div>

              {/* Right ~40% — game info panel */}
              <div className="lg:w-[40%] min-w-0 flex flex-col">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                    {game.iconUrl ? (
                      <img src={game.iconUrl} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{game.title}</h1>
                    {game.creator_username ? (
                      <Link
                        href={`/profile/${game.creator_username}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        By {creatorName}
                        {game.creator_is_verified && <VerifiedBadge size="sm" />}
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">By {creatorName}</p>
                    )}
                  </div>
                </div>

                {/* Maturity rating badge */}
                <div className="mb-6">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                    Maturity: {game.ageRating || "All Ages"}
                  </span>
                </div>

                {/* Play button */}
                {canPlay ? (
                  <a
                    href={`roblox://experiences/start?placeId=${game.placeId}`}
                    className="block text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors mb-4"
                  >
                    Play
                  </a>
                ) : (
                  <button
                    disabled
                    title="This game isn't linked to a playable Roblox place yet"
                    className="py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold text-lg rounded-lg cursor-not-allowed mb-4"
                  >
                    Game not available
                  </button>
                )}

                {/* Favorite / Notify / Like / Dislike */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFavorited((prev) => !prev)}
                    title="Favorite"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      favorited
                        ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Heart className="w-4 h-4" fill={favorited ? "currentColor" : "none"} />
                    {favoriteCount.toLocaleString()}
                  </button>

                  <button
                    onClick={() => setNotifyOn((prev) => !prev)}
                    title={notifyOn ? "Turn off notifications" : "Notify me"}
                    className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
                      notifyOn
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600 dark:text-blue-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {notifyOn ? <Bell className="w-4 h-4" fill="currentColor" /> : <BellOff className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <button
                      onClick={handleLike}
                      title="Like"
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${
                        liked
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
                      {likeCount.toLocaleString()}
                    </button>
                    <div className="w-px self-stretch bg-gray-300 dark:bg-gray-600" />
                    <button
                      onClick={handleDislike}
                      title="Dislike"
                      className={`flex items-center px-3 py-2 transition-colors ${
                        disliked
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" fill={disliked ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs row */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-4">
              <div className="flex gap-6">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                      activeTab === tab
                        ? "text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100"
                        : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row — small inline stats below the tabs */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> {game.visits?.toLocaleString() || 0} visits
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" /> {favoriteCount.toLocaleString()} favorites
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Max {game.maxPlayers ?? "—"} players
              </span>
              <span className="flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4" /> {game.genre || "All"}
              </span>
            </div>

            {activeTab === "About" && (
              <div>
                {/* Events */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Events</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No events yet.</p>
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

                {/* Created By */}
                <div className="mt-6 max-w-sm">
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
            )}

            {activeTab === "Store" && (
              <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                No items for sale yet.
              </div>
            )}

            {activeTab === "Servers" && (
              <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                No public servers available.
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default GameDetailPage;
