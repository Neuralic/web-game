'use client';

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import Footer from "../components/Footer";
import GameGridCard from "../components/GameGridCard";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { usersApi } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const FavoritesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const userResponse = await usersApi.getCurrentUser();
        if (!userResponse.success || !userResponse.data?.user) return;
        const userId = (userResponse.data.user as any).id;
        const res = await fetch(`${API_BASE}/games/favorites/${userId}`);
        const data = await res.json();
        if (data.success && data.data?.games) setGames(data.data.games);
      } catch (error) {
        console.error("Error fetching favorite games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" />
          Favorite Games
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No Favorites Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Games you favorite will appear here. Start exploring and add some!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {games.map((game) => (
              <GameGridCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FavoritesPage;
