"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { usersApi } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const ContinuePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyPlayed = async () => {
      setLoading(true);
      try {
        const userResponse = await usersApi.getCurrentUser();
        if (!userResponse.success || !userResponse.data?.user) return;
        const userId = (userResponse.data.user as any).id;
        const res = await fetch(`${API_BASE}/games/recently-played/${userId}`);
        const data = await res.json();
        if (data.success && data.data?.games) {
          setRecentlyPlayed(data.data.games);
        }
      } catch (error) {
        console.error("Error fetching recently played games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyPlayed();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Continue
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recentlyPlayed.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No Recently Played Games
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Games you play will appear here so you can quickly jump back in.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {recentlyPlayed.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`} className="cursor-pointer group block">
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
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Sidebar Overlay */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};

export default ContinuePage;
