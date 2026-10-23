"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import dynamic from "next/dynamic";
import { catalogApi, usersApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { TryOnResult } from "../../components/Avatar3DViewer";

const Avatar3DViewer = dynamic(() => import("../../components/Avatar3DViewer"), { ssr: false });

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  category: string;
  subcategory: string;
  itemType: string;
  thumbnailUrl: string;
  robloxAssetId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  tags: string[];
  favoriteCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function CatalogItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inInventory, setInInventory] = useState(false);
  const [isEquipped, setIsEquipped] = useState(false);
  const [adding, setAdding] = useState(false);
  const [equipping, setEquipping] = useState(false);

  // Try-on preview modal. Never touches the equip routes.
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnUserId, setTryOnUserId] = useState<string | null>(null);
  const [tryOnNeedsLogin, setTryOnNeedsLogin] = useState(false);
  const [tryOnUserError, setTryOnUserError] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
  const [tryOnView, setTryOnView] = useState<"3d" | "2d">("3d");
  const [tryOnSnapshot, setTryOnSnapshot] = useState<string | null>(null);

  useEffect(() => {
    const checkInventoryAndAvatar = async () => {
      try {
        const [inventoryRes, avatarRes] = await Promise.all([
          catalogApi.getUserInventory(),
          fetch(`${API_BASE}/avatar`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          }).then(r => r.json()),
        ]);

        if (inventoryRes.success && inventoryRes.data) {
          const items = (inventoryRes.data as any).items || [];
          if (items.some((i: any) => i.id === params.id)) setInInventory(true);
        }

        if (avatarRes.success && avatarRes.data) {
          const equipped = avatarRes.data.equippedItems || [];
          if (equipped.some((i: any) => i.id === params.id)) setIsEquipped(true);
        }
      } catch {}
    };
    if (params.id) checkInventoryAndAvatar();
  }, [params.id]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await catalogApi.getItemById(params.id as string);
        if (response.success && response.data) {
          setItem(response.data.item);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const handleGetItem = async () => {
    if (inInventory || !item) return;
    setAdding(true);
    try {
      const response = await catalogApi.addToInventory(item.id);
      if (response.success) {
        setInInventory(true);
      }
    } catch (error) {
      console.error('Failed to add to inventory:', error);
    } finally {
      setAdding(false);
    }
  };

  const closeTryOn = () => {
    setTryOnOpen(false);
    setTryOnResult(null);
    setTryOnSnapshot(null);
    setTryOnView("3d");
    setTryOnNeedsLogin(false);
    setTryOnUserError(false);
  };

  const handleTryOn = async () => {
    if (!item) return;
    setTryOnResult(null);
    setTryOnSnapshot(null);
    setTryOnView("3d");
    setTryOnUserError(false);
    setTryOnOpen(true);

    if (!isAuthenticated()) {
      setTryOnNeedsLogin(true);
      return;
    }
    setTryOnNeedsLogin(false);
    if (tryOnUserId) return;
    try {
      const response = await usersApi.getCurrentUser();
      const user = response.success ? (response.data?.user as { id?: string } | undefined) : undefined;
      if (user?.id) setTryOnUserId(user.id);
      else setTryOnUserError(true);
    } catch {
      setTryOnUserError(true);
    }
  };

  const handleEquip = async () => {
    if (!item) return;
    setEquipping(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const endpoint = isEquipped ? `/avatar/unequip/${item.id}` : `/avatar/equip/${item.id}`;
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsEquipped(!isEquipped);
      }
    } catch (err) {
      console.error("Failed to equip:", err);
    } finally {
      setEquipping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Item Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This item doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/catalog")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Catalog
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left - Item Image */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-100 dark:bg-[#242424]">
                <span className="text-6xl">🎨</span>
              </div>
            )}
          </div>

          {/* Right - Item Details */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {item.category}{item.subcategory ? ` › ${item.subcategory}` : ""}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {item.name}
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              By {item.creatorName}
            </p>

            {item.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                Free
              </span>
              {item.isFeatured && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-semibold rounded-full">
                  Featured
                </span>
              )}
              {!item.isAvailable && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-full">
                  Unavailable
                </span>
              )}
            </div>

            {/* Get Item Button */}
            <button
              onClick={handleGetItem}
              disabled={!item.isAvailable || inInventory}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors mb-3 ${
                inInventory
                  ? "bg-gray-200 dark:bg-[#242424] text-gray-700 dark:text-gray-300 cursor-default"
                  : item.isAvailable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-[#242424] text-gray-500 cursor-not-allowed"
              }`}
            >
              {inInventory ? "✔ In Inventory" : adding ? "Adding..." : item.isAvailable ? "Get Item" : "Unavailable"}
            </button>

            {/* Try On Button (preview only) */}
            <button
              onClick={handleTryOn}
              className="w-full py-3 rounded-xl font-bold text-sm transition-colors mb-3 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#3a3a3a] text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#242424]"
            >
              Try on
            </button>

            {/* Equip to Avatar Button */}
            {inInventory && (
              <button
                onClick={handleEquip}
                disabled={equipping}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors mb-3 ${
                  isEquipped
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                } disabled:opacity-50`}
              >
                {equipping ? "..." : isEquipped ? "✔ Equipped — Click to Unequip" : "Equip to Avatar"}
              </button>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.favoriteCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Favorites</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.salesCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sales</p>
              </div>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-[#242424] text-gray-600 dark:text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {tryOnOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeTryOn}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">Try on: {item.name}</h2>
              <button
                onClick={closeTryOn}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 text-xl leading-none px-2"
              >
                ×
              </button>
            </div>

            {tryOnNeedsLogin ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Log in to try this item on your avatar.</p>
                <button
                  onClick={() => router.push("/login")}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Log in
                </button>
              </div>
            ) : tryOnUserError ? (
              <p className="py-8 text-center text-sm text-gray-700 dark:text-gray-300">
                Couldn't preview this item. We couldn't load your avatar.
              </p>
            ) : !tryOnUserId ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {tryOnResult && !tryOnResult.ok && (
                  <div className="mb-3 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                    <p className="font-semibold">Couldn't preview this item</p>
                    {tryOnResult.reason && <p>{tryOnResult.reason}</p>}
                  </div>
                )}

                <div className="relative">
                  <Avatar3DViewer
                    userId={tryOnUserId}
                    tryOnItemId={item.id}
                    onSnapshot={setTryOnSnapshot}
                    onTryOnResult={setTryOnResult}
                    className="w-full h-[420px]"
                  />
                  {tryOnView === "2d" && tryOnSnapshot && (
                    <div className="absolute inset-0 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                      <img src={tryOnSnapshot} alt={`${item.name} preview`} className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Preview only, not equipped</p>
                  <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 dark:border-[#3a3a3a]">
                    {(["3d", "2d"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTryOnView(mode)}
                        disabled={mode === "2d" && !tryOnSnapshot}
                        className={`px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                          tryOnView === mode
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {mode === "3d" ? "3D" : "2D"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
