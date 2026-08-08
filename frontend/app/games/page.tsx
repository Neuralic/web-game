"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import UserAdBanner from "../components/UserAdBanner";

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  creatorId: string;
  visits: number;
  likes: number;
  dislikes: number;
  favorites: number;
  currentPlayers: number;
  is_sponsored?: boolean;
  sponsor_bid?: number;
  createdAt: string;
}

const GamesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [sponsoredGames, setSponsoredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/games?page=1&limit=50`);
      const data = await res.json();
      if (data.success) {
        setGames(data.data.games);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSponsoredGames = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/games/sponsored`);
      const data = await res.json();
      if (data.success) {
        setSponsoredGames(data.data.games || []);
      }
    } catch (error) {
      console.error("Failed to fetch sponsored games:", error);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchSponsoredGames();
  }, []);

  const likePercentage = (game: Game) => {
    const total = (game.likes || 0) + (game.dislikes || 0);
    if (total === 0) return null;
    return Math.round((game.likes / total) * 100);
  };

  const GameCard = ({ game, isSponsored = false }: { game: Game; isSponsored?: boolean }) => {
    const likePct = likePercentage(game);
    return (
      <div className="group cursor-pointer flex-shrink-0 w-[260px]">
        <Link href={`/games/${game.id}`} className="block">
          <div className="rounded-lg overflow-hidden bg-gray-200 dark:bg-[#242424] aspect-video mb-1.5 relative">
            {game.thumbnailUrl ? (
              <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-white font-bold text-2xl">AB</span>
              </div>
            )}
            {isSponsored && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Sponsored</div>
            )}
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{game.title}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
            <span className="flex items-center gap-1">👍 {likePct !== null ? `${likePct}%` : "N/A"}</span>
            <span className="flex items-center gap-1">👥 {game.currentPlayers?.toLocaleString() || 0} playing</span>
          </div>
        </Link>

        <a href={`roblox://experiences/start?placeId=${game.id}`} className="block text-center bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 rounded-lg transition-colors">Play</a>
      </div>
    );
  };

  const GameRow = ({ title, icon, games }: { title: string; icon: string; games: Game[] }) => {
    if (games.length === 0) return null;
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>{icon}</span>{title}
          </h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {games.map((game) => (
            <GameCard key={game.id} game={game} isSponsored={game.is_sponsored} />
          ))}
        </div>
      </section>
    );
  };

  const popularGames = [...games].sort((a, b) => b.visits - a.visits);
  const newGames = [...games].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const topRated = [...games].sort((a, b) => b.favorites - a.favorites);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex justify-center gap-4 px-4 py-6">
        {/* Left Skyscraper Ad */}
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>

        <div className="max-w-[1400px] w-full px-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Games</h1>

        {/* Sponsored Games */}
        {sponsoredGames.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="text-yellow-500">★</span> Sponsored
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {sponsoredGames.map((game) => (
                <GameCard key={game.id} game={game} isSponsored={true} />
              ))}
            </div>
            <div className="border-b border-gray-200 dark:border-[#2a2a2a] mt-6" />
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Games Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">Games will appear here once they are published. Check back soon!</p>
          </div>
        ) : (
          <>
            <GameRow title="Popular Games" icon="🔥" games={popularGames} />
            <GameRow title="New & Trending" icon="🆕" games={newGames} />
            <GameRow title="Top Rated" icon="⭐" games={topRated} />
            <GameRow title="All Games" icon="🎮" games={games} />
          </>
        )}
        </div>

        {/* Right Skyscraper Ad */}
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GamesPage;
