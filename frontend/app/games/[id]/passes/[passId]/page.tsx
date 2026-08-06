"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import Header from "../../../../components/Header";
import Sidebar from "../../../../components/Sidebar";
import Footer from "../../../../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface GamePass {
  id: string;
  game_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GameSummary {
  id: string;
  title: string;
  iconUrl: string | null;
}

const GamePassDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;
  const passId = params?.passId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pass, setPass] = useState<GamePass | null>(null);
  const [game, setGame] = useState<GameSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!gameId || !passId) return;

    const fetchData = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const [passesRes, gameRes] = await Promise.all([
          fetch(`${API_BASE}/games/${gameId}/passes`),
          fetch(`${API_BASE}/games/${gameId}`),
        ]);

        const passesData = await passesRes.json();
        const foundPass = passesData.success
          ? (passesData.data?.passes || []).find((p: GamePass) => p.id === passId)
          : null;

        if (!foundPass) {
          setNotFound(true);
          return;
        }
        setPass(foundPass);

        const gameData = await gameRes.json();
        if (gameData.success && gameData.data?.game) {
          setGame(gameData.data.game);
        }
      } catch (error) {
        console.error("Failed to fetch game pass:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, passId]);

  const handleBuy = () => {
    alert("Purchasing is not yet available.");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex justify-center px-4 py-6">
        <div className="max-w-[700px] w-full px-2">
          <button
            onClick={() => router.push(`/games/${gameId}?tab=Store`)}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </button>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notFound || !pass ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Game Pass Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                This game pass doesn&apos;t exist or is no longer available.
              </p>
              <Link href={`/games/${gameId}`} className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Back to Game
              </Link>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {pass.image_url ? (
                  <img src={pass.image_url} alt={pass.name} className="w-full h-full object-cover" />
                ) : (
                  <Gamepad2 className="w-16 h-16 text-gray-400" />
                )}
              </div>

              <div className="p-6">
                {game && (
                  <Link
                    href={`/games/${game.id}`}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 w-fit"
                  >
                    {game.iconUrl ? (
                      <img src={game.iconUrl} alt={game.title} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                    ) : (
                      <Gamepad2 className="w-4 h-4 flex-shrink-0" />
                    )}
                    {game.title}
                  </Link>
                )}

                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{pass.name}</h1>

                {pass.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-wrap">{pass.description}</p>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-5">
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{pass.price} AdventureBux</span>
                  <button
                    onClick={handleBuy}
                    className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-lg transition-colors"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GamePassDetailPage;
