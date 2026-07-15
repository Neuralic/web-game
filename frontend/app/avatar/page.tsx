"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, Loader2, Link2, Unlink } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import UserAdBanner from "../components/UserAdBanner";
import { catalogApi, storage } from "@/lib/api";
import dynamic from "next/dynamic";

const RobloxAvatar3D = dynamic(() => import("../components/RobloxAvatar3D"), {
  ssr: false,
});

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  itemType: string;
  thumbnailUrl: string;
  robloxAssetId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  favoriteCount: number;
}

interface AvatarState {
  hair_item_id: string | null;
  face_item_id: string | null;
  head_item_id: string | null;
  hat_item_id: string | null;
  body_item_id: string | null;
  shirt_item_id: string | null;
  pants_item_id: string | null;
  accessory_item_id: string | null;
  roblox_user_id: string | null;
  hair_thumbnail: string | null;
  face_thumbnail: string | null;
  head_thumbnail: string | null;
  hat_thumbnail: string | null;
  body_thumbnail: string | null;
  shirt_thumbnail: string | null;
  pants_thumbnail: string | null;
  accessory_thumbnail: string | null;
  hair_asset_id: string | null;
  face_asset_id: string | null;
  head_asset_id: string | null;
  hat_asset_id: string | null;
  body_asset_id: string | null;
  shirt_asset_id: string | null;
  pants_asset_id: string | null;
  accessory_asset_id: string | null;
  accessory_2_asset_id: string | null;
  accessory_3_asset_id: string | null;
  skin_color: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Preset Roblox BrickColor skin tones — id is saved to avatar_state.skin_color
const SKIN_TONES: { id: string; label: string; hex: string }[] = [
  { id: "1", label: "Yellow", hex: "#F5C842" },
  { id: "1003", label: "Light", hex: "#F5D0C5" },
  { id: "36", label: "Light yellowish orange", hex: "#F3CF9B" },
  { id: "1004", label: "Medium", hex: "#D5A66D" },
  { id: "1005", label: "Dark", hex: "#A9744F" },
  { id: "1006", label: "Darker", hex: "#7C4B2A" },
  { id: "1007", label: "Darkest", hex: "#4A2C17" },
];

const TAB_TO_CATEGORY: Record<string, { category?: string; subcategory?: string }> = {
  "Recently Added": { category: undefined, subcategory: undefined },
  "Recently Worn": { category: undefined, subcategory: undefined },
  "Accessories": { category: "Accessories", subcategory: undefined },
  "Clothing": { category: "Clothing", subcategory: undefined },
  "Body Parts": { category: "Body", subcategory: undefined },
  "Animations": { category: undefined, subcategory: undefined },
  "Characters": { category: "Body", subcategory: "Full Bodies" },
  "Pets": { category: undefined, subcategory: undefined },
  "Outerwear": { category: "Clothing", subcategory: undefined },
  "Classic": { category: "Clothing", subcategory: undefined },
  "Neck": { category: "Accessories", subcategory: "Neck" },
  "Hair": { category: "Body", subcategory: "Hair" },
  "Classic Heads": { category: "Body", subcategory: "Classic Heads" },
  "Classic Faces": { category: "Body", subcategory: "Classic Faces" },
  "Full Bodies": { category: "Body", subcategory: "Full Bodies" },
};

const AvatarPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Recent");
  const [activeSubTab, setActiveSubTab] = useState("Recently Added");
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [equippedItems, setEquippedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [robloxUsername, setRobloxUsername] = useState("");
  const [showRobloxLink, setShowRobloxLink] = useState(false);
  const [robloxLinking, setRobloxLinking] = useState(false);
  const [robloxThumbnail, setRobloxThumbnail] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [renderingCustom, setRenderingCustom] = useState(false);
  const [updatingSkinColor, setUpdatingSkinColor] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsOffsetRef = useRef<number>(0);

  const mainTabs = ["Recent", "Characters", "Clothing", "Accessories", "Head & Body", "Animations", "Pets"];

  const subTabs: { [key: string]: string[] } = {
    Recent: ["Recently Added", "Recently Worn", "Accessories", "Clothing", "Body Parts", "Animations", "Characters", "Pets"],
    Characters: ["Full Bodies"],
    Clothing: ["Outerwear", "Classic"],
    Accessories: ["Neck"],
    "Head & Body": ["Hair", "Classic Heads", "Classic Faces"],
    Animations: ["Emotes"],
    Pets: ["All Pets"],
  };

  const renderCustomAvatar = async (state: AvatarState) => {
    const token = storage.getAccessToken();
    if (!token) return;

    // Collect all equipped asset IDs
    const assetIds = [
      state.hair_asset_id,
      state.face_asset_id,
      state.head_asset_id,
      state.hat_asset_id,
      state.body_asset_id,
      state.shirt_asset_id,
      state.pants_asset_id,
      state.accessory_asset_id,
      state.accessory_2_asset_id,
      state.accessory_3_asset_id,
    ].filter(Boolean).map(id => parseInt(id!));

    // null/"1" means no explicit skin tone was chosen — omit bodyColors so Roblox
    // falls back to its own default skin instead of forcing a hardcoded tone.
    const hasCustomSkinTone = !!state.skin_color && state.skin_color !== "1";
    const skinTone = hasCustomSkinTone ? SKIN_TONES.find(t => t.id === state.skin_color) : undefined;
    // Roblox's render API takes BrickColor integer IDs, not hex strings — SKIN_TONES.id
    // already holds the BrickColor ID, so just convert it to a number.
    const brickColorId = skinTone ? Number(skinTone.id) : undefined;
    const bodyColors = brickColorId ? {
      headColorId: brickColorId,
      torsoColorId: brickColorId,
      leftArmColorId: brickColorId,
      rightArmColorId: brickColorId,
      leftLegColorId: brickColorId,
      rightLegColorId: brickColorId,
    } : undefined;

    // Always render — empty array gives default R15 character

    setRenderingCustom(true);
    try {
      const res = await fetch(`${API_BASE}/avatar/render-custom`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyColors ? { assetIds, bodyColors } : { assetIds }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setCustomAvatarUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("Failed to render custom avatar:", err);
    } finally {
      setRenderingCustom(false);
    }
  };

  const fetchAvatarState = useCallback(async () => {
    const token = storage.getAccessToken();
    if (!token) { setAvatarLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const state = data.data.avatarState;
        setAvatarState(state);
        const equipped = new Set<string>(
          data.data.equippedItems.map((i: CatalogItem) => i.id)
        );
        setEquippedItems(equipped);
        if (state?.roblox_user_id) {
          setRobloxThumbnail(state.roblox_user_id);
        }
        // Render custom avatar with equipped items
        if (state) {
          renderCustomAvatar(state);
        }
      }
    } catch (err) {
      console.error("Failed to fetch avatar state:", err);
    } finally {
      setAvatarLoading(false);
    }

    // Fetch gender from profile
    try {
      const token = storage.getAccessToken();
      if (token) {
        const profileRes = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data?.user?.gender) {
          setUserGender(profileData.data.user.gender);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchAvatarState();
  }, [fetchAvatarState]);

  const fetchItems = useCallback(async (subTab: string, page: number = 1) => {
    setLoading(true);
    try {
      const mapping = TAB_TO_CATEGORY[subTab];
      if (!mapping || (!mapping.category && subTab !== "Recently Added")) {
        setItems([]);
        setLoading(false);
        return;
      }
      const response = await catalogApi.getItems({
        category: mapping.category,
        subcategory: mapping.subcategory,
        sort: subTab === "Recently Added" ? "recent" : "relevance",
        page,
        limit: 24,
        available: "true",
      });
      if (response.success && response.data) {
        setItems(response.data.items as CatalogItem[]);
        setTotalPages(response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.page);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(activeSubTab, 1);
  }, [activeSubTab, fetchItems]);

  const toggleEquip = async (item: CatalogItem) => {
    const token = storage.getAccessToken();
    if (!token) return;

    const isEquipped = equippedItems.has(item.id);

    if (isEquipped) {
      try {
        const res = await fetch(`${API_BASE}/avatar/unequip/${item.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setEquippedItems(prev => { const next = new Set(prev); next.delete(item.id); return next; });
          fetchAvatarState();
        }
      } catch (err) {
        console.error("Failed to unequip:", err);
      }
      return;
    }

    let itemId = item.id;
    const isRobloxItem = /^\d+$/.test(item.id);

    if (isRobloxItem) {
      try {
        const importRes = await fetch(`${API_BASE}/catalog/roblox/import/${item.robloxAssetId || item.id}`, {
          method: "POST",
        });
        const importData = await importRes.json();
        if (importData.success && importData.data?.id) {
          itemId = importData.data.id;
        } else {
          console.error("Failed to import Roblox item");
          return;
        }
      } catch (err) {
        console.error("Failed to import Roblox item:", err);
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/avatar/equip/${itemId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEquippedItems(prev => { const next = new Set(prev); next.add(item.id); return next; });
        fetchAvatarState();
      }
    } catch (err) {
      console.error("Failed to equip:", err);
    }
  };

  const linkRobloxAccount = async () => {
    if (!robloxUsername.trim()) return;
    setRobloxLinking(true);
    const token = storage.getAccessToken();
    if (!token) return;
    try {
      const lookupRes = await fetch(`${API_BASE}/avatar/roblox-lookup/${robloxUsername}`);
      const lookupJson = await lookupRes.json();
      if (!lookupJson.success || !lookupJson.data?.Id) {
        alert("Roblox username not found");
        return;
      }
      const res = await fetch(`${API_BASE}/avatar/roblox-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ robloxUserId: lookupJson.data.Id.toString() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRobloxLink(false);
        setRobloxUsername("");
        fetchAvatarState();
      }
    } catch (err) {
      console.error("Failed to link Roblox account:", err);
    } finally {
      setRobloxLinking(false);
    }
  };

  const handleSelectSkinColor = async (skinColor: string) => {
    const token = storage.getAccessToken();
    if (!token || updatingSkinColor) return;
    setUpdatingSkinColor(true);
    try {
      const res = await fetch(`${API_BASE}/avatar/skin-color`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ skinColor }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAvatarState();
      }
    } catch (err) {
      console.error("Failed to update skin color:", err);
    } finally {
      setUpdatingSkinColor(false);
    }
  };

  useEffect(() => {
    if (tabsRef.current) {
      tabsOffsetRef.current = tabsRef.current.offsetTop;
    }
    const handleScroll = () => {
      if (tabsOffsetRef.current > 0) {
        setIsTabsSticky(window.scrollY > tabsOffsetRef.current - 70);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isFemale = userGender === "female";

  // Determine what to show in avatar preview
  const showCustomRender = customAvatarUrl && !robloxThumbnail;
  const showRobloxAvatar = !!robloxThumbnail;
  const showDefault = !showCustomRender && !showRobloxAvatar;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex justify-center gap-4 px-4 py-6">
        {/* Left Skyscraper Ad */}
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>

        <div className="max-w-[1400px] w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Avatar Editor</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Explore the catalog to find more clothes!</span>
              <Link href="/catalog">
                <button className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded transition-colors">
                  Get More
                </button>
              </Link>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Left - Avatar Preview */}
            <div className="w-[300px] flex-shrink-0 sticky top-24 self-start">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg aspect-[3/4] flex items-end justify-center p-6 relative overflow-hidden">
                {avatarLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : showRobloxAvatar ? (
                  <RobloxAvatar3D
                    robloxUserId={avatarState?.roblox_user_id || ""}
                    onError={() => setRobloxThumbnail(null)}
                  />
                ) : showCustomRender ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {renderingCustom ? (
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    ) : (
                      <img
                        src={customAvatarUrl}
                        alt="Your Avatar"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {renderingCustom ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rendering avatar...</p>
                      </div>
                    ) : (
                      <div className="relative" style={{ width: 180, height: 270 }}>
                        <svg width="180" height="270" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Legs */}
                          <rect x="32" y="108" width="25" height="70" rx="4" fill="#8B4513" />
                          <rect x="63" y="108" width="25" height="70" rx="4" fill="#8B4513" />
                          {/* Body */}
                          <rect x="30" y="55" width="60" height="50" rx="4" fill={isFemale ? "#C4679A" : "#4A90A4"} />
                          <rect x="30" y="65" width="60" height="6" fill={isFemale ? "#D4889B" : "#6BA8BC"} />
                          <rect x="30" y="77" width="60" height="6" fill={isFemale ? "#D4889B" : "#6BA8BC"} />
                          <rect x="30" y="89" width="60" height="6" fill={isFemale ? "#D4889B" : "#6BA8BC"} />
                          {/* Arms */}
                          <rect x="10" y="55" width="18" height="45" rx="4" fill="#F5D0C5" />
                          <rect x="92" y="55" width="18" height="45" rx="4" fill="#F5D0C5" />
                          {/* Head */}
                          <rect x="35" y="2" width="50" height="50" rx="8" fill="#F5D0C5" />
                          {/* Default hair */}
                          {isFemale ? (
                            <>
                              <ellipse cx="60" cy="12" rx="28" ry="18" fill="#8B4513" />
                              <rect x="32" y="10" width="10" height="40" rx="5" fill="#8B4513" />
                              <rect x="78" y="10" width="10" height="40" rx="5" fill="#8B4513" />
                              <ellipse cx="60" cy="3" rx="22" ry="14" fill="#8B4513" />
                            </>
                          ) : (
                            <>
                              <ellipse cx="60" cy="15" rx="30" ry="20" fill="#B85C38" />
                              <ellipse cx="60" cy="5" rx="20" ry="12" fill="#B85C38" />
                              <circle cx="75" cy="8" r="12" fill="#B85C38" />
                            </>
                          )}
                          {/* Default face */}
                          <circle cx="48" cy="30" r="3" fill="#393939" />
                          <circle cx="72" cy="30" r="3" fill="#393939" />
                          <path d="M52 40 Q60 48 68 40" stroke="#393939" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded font-semibold text-sm text-gray-900 dark:text-gray-100 z-20">
                  {showRobloxAvatar ? "Roblox" : showCustomRender ? "R15" : "2D"}
                </div>
              </div>

              {/* Body Type Slider */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Body Type</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">0%</span>
                </div>
                <input type="range" min="0" max="100" defaultValue="0" className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              </div>

              {/* Skin Tone */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-3">Skin Tone</span>
                <div className="flex gap-2.5">
                  {SKIN_TONES.map((tone) => {
                    const isSelected = (avatarState?.skin_color || "1") === tone.id;
                    return (
                      <button
                        key={tone.id}
                        onClick={() => handleSelectSkinColor(tone.id)}
                        disabled={updatingSkinColor}
                        title={tone.label}
                        aria-label={tone.label}
                        className={`w-8 h-8 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isSelected
                            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-800"
                            : "ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-gray-400 dark:hover:ring-gray-500"
                        }`}
                        style={{ backgroundColor: tone.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Roblox Link */}
              <div className="mt-4">
                {avatarState?.roblox_user_id ? (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400 font-medium">Roblox linked</span>
                    </div>
                    <button
                      onClick={() => {
                        setAvatarState(prev => prev ? { ...prev, roblox_user_id: null } : null);
                        setRobloxThumbnail(null);
                      }}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Unlink className="w-3 h-3" /> Unlink
                    </button>
                  </div>
                ) : showRobloxLink ? (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Enter your Roblox username to show your avatar</p>
                    <input
                      type="text"
                      value={robloxUsername}
                      onChange={e => setRobloxUsername(e.target.value)}
                      placeholder="Roblox username"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={linkRobloxAccount}
                        disabled={robloxLinking}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
                      >
                        {robloxLinking ? "Linking..." : "Link Account"}
                      </button>
                      <button
                        onClick={() => setShowRobloxLink(false)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRobloxLink(true)}
                    className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Link2 className="w-4 h-4" /> Link Roblox Account
                  </button>
                )}
              </div>

              <div className="mt-3 text-center">
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Avatar isn&apos;t loading correctly?</button>
                <Link href="/avatar" className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-2">Redraw</Link>
              </div>

              {equippedItems.size > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    {equippedItems.size} item{equippedItems.size > 1 ? "s" : ""} equipped
                  </p>
                </div>
              )}
            </div>

            {/* Right - Items Grid */}
            <div className="flex-1">
              <div ref={tabsRef} className={`${isTabsSticky ? "fixed top-[70px] left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4" : ""}`}>
                <div className={`${isTabsSticky ? "max-w-[1400px] mx-auto" : ""} flex gap-6 border-b border-gray-200 dark:border-gray-800`}>
                  {mainTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        if (subTabs[tab]) setActiveSubTab(subTabs[tab][0]);
                      }}
                      className={`pb-3 text-sm font-semibold transition-colors relative group ${activeTab === tab ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
                    >
                      {tab}
                      <ChevronDown className={`w-4 h-4 inline ml-1 ${activeTab === tab ? "" : "opacity-50"}`} />
                      {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-gray-100" />}
                      {activeTab !== tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-400 dark:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                  ))}
                </div>

                {subTabs[activeTab] && (
                  <div className="flex gap-4 mt-4">
                    {subTabs[activeTab].map((subTab) => (
                      <button
                        key={subTab}
                        onClick={() => setActiveSubTab(subTab)}
                        className={`text-sm transition-colors ${activeSubTab === subTab ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
                      >
                        {subTab}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isTabsSticky && <div className="h-24"></div>}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No items available for this category.</p>
                  <Link href="/catalog" className="mt-3 text-blue-600 dark:text-blue-400 text-sm hover:underline">Browse Catalog</Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleEquip(item)}
                        className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
                      >
                        {equippedItems.has(item.id) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-gray-700 rounded flex items-center justify-center z-10 border border-gray-300 dark:border-gray-600">
                            <svg className="w-4 h-4 text-gray-900 dark:text-gray-100" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${equippedItems.has(item.id) ? "border-blue-500" : "border-gray-200 dark:border-gray-700"} bg-gray-100 dark:bg-gray-800`}>
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-3xl">🎨</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.subcategory || item.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button onClick={() => fetchItems(activeSubTab, currentPage - 1)} disabled={currentPage <= 1} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50">Previous</button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                      <button onClick={() => fetchItems(activeSubTab, currentPage + 1)} disabled={currentPage >= totalPages} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50">Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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

export default AvatarPage;
