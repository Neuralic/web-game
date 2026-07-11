"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProtectedRoute from "../components/ProtectedRoute";
import { storage } from "@/lib/api";
import UserAdBanner from "../components/UserAdBanner";
import { Plus, Trash2, ExternalLink, Gamepad2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface Game {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  genre?: string;
  maxPlayers?: number;
  isPublished: boolean;
  visits: number;
  favorites: number;
  currentPlayers: number;
  createdAt: string;
}

export default function CreatePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMethod, setCreateMethod] = useState<"manual" | "roblox">("roblox");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    genre: "All",
    maxPlayers: "10",
    universeId: "",
  });

  const fetchMyGames = async () => {
    const token = storage.getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/games/my-games`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setGames(data.data.games || []);
    } catch (err) {
      console.error("Failed to fetch games:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyGames(); }, []);

  const handleCreate = async () => {
    const token = storage.getAccessToken();
    if (!token) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      let res;
      if (createMethod === "roblox") {
        if (!form.universeId.trim()) { setErrorMsg("Universe ID is required"); setSubmitting(false); return; }
        res = await fetch(`${API_BASE}/games/publish-by-place-id`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ universeId: form.universeId.trim(), genre: form.genre, maxPlayers: parseInt(form.maxPlayers) }),
        });
      } else {
        if (!form.title.trim()) { setErrorMsg("Title is required"); setSubmitting(false); return; }
        res = await fetch(`${API_BASE}/games/publish`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            thumbnailUrl: form.thumbnailUrl.trim() || undefined,
            genre: form.genre,
            maxPlayers: parseInt(form.maxPlayers),
          }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Game published successfully!");
        setShowCreateModal(false);
        setForm({ title: "", description: "", thumbnailUrl: "", genre: "All", maxPlayers: "10", universeId: "" });
        fetchMyGames();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.message || "Failed to publish game");
      }
    } catch (err) {
      setErrorMsg("Failed to publish game");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;
    const token = storage.getAccessToken();
    if (!token) return;

    setDeletingId(gameId);
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setGames(games.filter(g => g.id !== gameId));
        setSuccessMsg("Game deleted successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.message || "Failed to delete game");
      }
    } catch (err) {
      setErrorMsg("Failed to delete game");
    } finally {
      setDeletingId(null);
    }
  };

  const genres = ["All", "Adventure", "RPG", "Simulator", "Obby", "Tycoon", "Fighting", "Horror", "Racing", "Sports", "Other"];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

        <div className="flex justify-center gap-4 px-6 py-8">
          {/* Left Skyscraper Ad */}
          <div className="hidden xl:block flex-shrink-0">
            <UserAdBanner format="160x600" />
          </div>

          <main className="max-w-5xl w-full">
        <div className="flex justify-center mb-6">
          <UserAdBanner format="728x90" />
        </div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Creations</h1>
            <button
              onClick={() => { setShowCreateModal(true); setErrorMsg(""); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New
            </button>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200 text-sm">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Games Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Publish your first game to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Publish a Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <div key={game.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                    {game.thumbnailUrl ? (
                      <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">AB</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">{game.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span>{game.visits?.toLocaleString() || 0} visits</span>
                      <span>{game.favorites || 0} favorites</span>
                      <span>{game.currentPlayers || 0} playing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/games?highlight=${game.id}`}
  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
>
  <ExternalLink className="w-3.5 h-3.5" />
  View
</a>
                      <button
                        onClick={() => handleDelete(game.id)}
                        disabled={deletingId === game.id}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </main>

          {/* Right Skyscraper Ad */}
          <div className="hidden xl:block flex-shrink-0">
            <UserAdBanner format="160x600" />
          </div>
        </div>

        <Footer />

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Publish a Game</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Method toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setCreateMethod("roblox")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${createMethod === "roblox" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                >
                  Import from Roblox
                </button>
                <button
                  onClick={() => setCreateMethod("manual")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${createMethod === "manual" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                >
                  Manual
                </button>
              </div>

              {createMethod === "roblox" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Roblox Universe ID</label>
                    <input
                      type="text"
                      value={form.universeId}
                      onChange={(e) => setForm({ ...form, universeId: e.target.value })}
                      placeholder="e.g. 1818"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Find this in Roblox Studio under Game Settings</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Genre</label>
                    <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700">
                      {genres.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Game title"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe your game..."
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Thumbnail URL</label>
                    <input
                      type="text"
                      value={form.thumbnailUrl}
                      onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Genre</label>
                      <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700">
                        {genres.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Max Players</label>
                      <input
                        type="number"
                        value={form.maxPlayers}
                        onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
                        min="1"
                        max="100"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Game"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
