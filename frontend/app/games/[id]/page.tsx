"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, ThumbsUp, ThumbsDown, Bell, BellOff, Users, Eye, Gamepad2 } from "lucide-react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import UserAvatar from "../../components/UserAvatar";
import VerifiedBadge from "../../components/VerifiedBadge";
import UserAdBanner from "../../components/UserAdBanner";
import { storage } from "@/lib/api";

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
  dislikes: number;
  favorites: number;
  currentPlayers: number;
  userLiked?: boolean;
  userDisliked?: boolean;
  userFavorited?: boolean;
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

interface GameCommentReply {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_username: string;
  author_display_name?: string;
  author_is_verified?: boolean;
}

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

interface GameServer {
  id: string;
  playing: number;
  maxPlayers: number;
  fps?: number;
  ping?: number;
}

interface GameComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_username: string;
  author_display_name?: string;
  author_is_verified?: boolean;
  replies: GameCommentReply[];
}

const GameDetailPage = () => {
  const params = useParams();
  const gameId = params?.id as string;
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = searchParams?.get("tab");
    return (TABS as readonly string[]).includes(tabParam || "") ? (tabParam as Tab) : "About";
  });

  // Notify has no backend endpoint yet, so it just reflects the click locally.
  // Like/Dislike/Favorite are persisted — see game.userLiked/userDisliked/userFavorited.
  const [notifyOn, setNotifyOn] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);

  const [comments, setComments] = useState<GameComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [postingReply, setPostingReply] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [passes, setPasses] = useState<GamePass[]>([]);
  const [loadingPasses, setLoadingPasses] = useState(true);
  const [showAddPassForm, setShowAddPassForm] = useState(false);
  const [newPassName, setNewPassName] = useState("");
  const [newPassDescription, setNewPassDescription] = useState("");
  const [newPassPrice, setNewPassPrice] = useState("0");
  const [submittingPass, setSubmittingPass] = useState(false);
  const [passError, setPassError] = useState("");

  const [servers, setServers] = useState<GameServer[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);

  useEffect(() => {
    const token = storage.getAccessToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId || null);
    } catch {
      // not logged in
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const fetchGame = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const token = storage.getAccessToken();
        const res = await fetch(`${API_BASE}/games/${gameId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
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

  const handlePlayClick = () => {
    if (!gameId) return;
    const token = storage.getAccessToken();
    if (!token) return;

    fetch(`${API_BASE}/games/${gameId}/play`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch((error) => console.error("Failed to record game play:", error));
  };

  useEffect(() => {
    if (!game?.groupId) {
      setGroupName(null);
      return;
    }

    const fetchGroup = async () => {
      try {
        const res = await fetch(`${API_BASE}/groups/${game.groupId}`);
        const data = await res.json();
        if (data.success && data.data?.group) {
          setGroupName(data.data.group.name);
        }
      } catch (error) {
        console.error("Failed to fetch group:", error);
      }
    };

    fetchGroup();
  }, [game?.groupId]);

  useEffect(() => {
    if (!gameId) return;

    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_BASE}/games/${gameId}/comments`);
        const data = await res.json();
        if (data.success && data.data?.comments) {
          setComments(data.data.comments);
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    };

    fetchComments();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const fetchPasses = async () => {
      setLoadingPasses(true);
      try {
        const res = await fetch(`${API_BASE}/games/${gameId}/passes`);
        const data = await res.json();
        if (data.success && data.data?.passes) {
          setPasses(data.data.passes);
        }
      } catch (error) {
        console.error("Failed to fetch game passes:", error);
      } finally {
        setLoadingPasses(false);
      }
    };

    fetchPasses();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const fetchServers = async () => {
      setLoadingServers(true);
      try {
        const res = await fetch(`${API_BASE}/games/${gameId}/servers`);
        const data = await res.json();
        if (data.success && data.data?.servers) {
          setServers(data.data.servers);
        }
      } catch (error) {
        console.error("Failed to fetch game servers:", error);
      } finally {
        setLoadingServers(false);
      }
    };

    fetchServers();
  }, [gameId]);

  const handleAddPass = async () => {
    if (!gameId) return;
    if (!newPassName.trim()) { setPassError("Pass name is required"); return; }

    setSubmittingPass(true);
    setPassError("");
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/passes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storage.getAccessToken()}`,
        },
        body: JSON.stringify({
          name: newPassName.trim(),
          description: newPassDescription.trim(),
          price: parseInt(newPassPrice) || 0,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.pass) {
        setPasses([data.data.pass, ...passes]);
        setNewPassName("");
        setNewPassDescription("");
        setNewPassPrice("0");
        setShowAddPassForm(false);
      } else {
        setPassError(data.message || "Failed to create game pass");
      }
    } catch (error) {
      console.error("Failed to create game pass:", error);
      setPassError("Failed to create game pass");
    } finally {
      setSubmittingPass(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !gameId) return;
    setPostingComment(true);
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storage.getAccessToken()}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data?.comment) {
        setComments([data.data.comment, ...comments]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setPostingComment(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplySubmit = async (commentId: string) => {
    const content = replyText[commentId];
    if (!content?.trim() || !gameId) return;
    setPostingReply({ ...postingReply, [commentId]: true });
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/comments/${commentId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storage.getAccessToken()}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data?.reply) {
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, replies: [...c.replies, data.data.reply] } : c
          )
        );
        setReplyText({ ...replyText, [commentId]: "" });
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setPostingReply({ ...postingReply, [commentId]: false });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${storage.getAccessToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/comments/${commentId}/replies/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${storage.getAccessToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) } : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to delete reply:", error);
    }
  };

  const creatorName = game?.creator_display_name || game?.creator_username || "Unknown Creator";
  const canPlay = !!game?.placeId;

  const likeCount = game?.likes || 0;
  const favoriteCount = game?.favorites || 0;

  const handleLike = async () => {
    if (!game) return;
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${storage.getAccessToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setGame({
          ...game,
          likes: data.data.likes,
          dislikes: data.data.dislikes,
          userLiked: data.data.userLiked,
          userDisliked: data.data.userDisliked,
        });
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleDislike = async () => {
    if (!game) return;
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/dislike`, {
        method: "POST",
        headers: { Authorization: `Bearer ${storage.getAccessToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setGame({
          ...game,
          likes: data.data.likes,
          dislikes: data.data.dislikes,
          userLiked: data.data.userLiked,
          userDisliked: data.data.userDisliked,
        });
      }
    } catch (error) {
      console.error("Failed to toggle dislike:", error);
    }
  };

  const handleFavorite = async () => {
    if (!game) return;
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/favorite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${storage.getAccessToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setGame({
          ...game,
          favorites: data.data.favorites,
          userFavorited: data.data.userFavorited,
        });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex justify-center gap-4 px-4 py-6">
        {/* Left Skyscraper Ad */}
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>

        <div className="max-w-[1100px] w-full px-2">
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
                    {game.groupId && groupName ? (
                      <Link
                        href={`/groups/${game.groupId}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        By {groupName}
                      </Link>
                    ) : game.creator_username ? (
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
                    onClick={handlePlayClick}
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleFavorite}
                    title="Favorite"
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-bold border transition-colors ${
                      game.userFavorited
                        ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Heart className="w-5 h-5" fill={game.userFavorited ? "currentColor" : "none"} />
                    {favoriteCount.toLocaleString()}
                  </button>

                  <button
                    onClick={() => setNotifyOn((prev) => !prev)}
                    title={notifyOn ? "Turn off notifications" : "Notify me"}
                    className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                      notifyOn
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600 dark:text-blue-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {notifyOn ? <Bell className="w-5 h-5" fill="currentColor" /> : <BellOff className="w-5 h-5" />}
                  </button>

                  <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <button
                      onClick={handleLike}
                      title="Like"
                      className={`flex items-center gap-2 px-4 py-3 text-base font-bold transition-colors ${
                        game.userLiked
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <ThumbsUp className="w-5 h-5" fill={game.userLiked ? "currentColor" : "none"} />
                      {likeCount.toLocaleString()}
                    </button>
                    <div className="w-px self-stretch bg-gray-300 dark:bg-gray-600" />
                    <button
                      onClick={handleDislike}
                      title="Dislike"
                      className={`flex items-center px-4 py-3 transition-colors ${
                        game.userDisliked
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <ThumbsDown className="w-5 h-5" fill={game.userDisliked ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs row */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-4">
              <div className="flex gap-10">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-5 text-xl font-extrabold transition-colors border-b-4 ${
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
              <div className="py-6">
                {game && currentUserId && game.creatorId === currentUserId && (
                  <div className="mb-6">
                    <button
                      onClick={() => { setShowAddPassForm(!showAddPassForm); setPassError(""); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors"
                    >
                      {showAddPassForm ? "Cancel" : "Add Game Pass"}
                    </button>

                    {showAddPassForm && (
                      <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 max-w-md">
                        {passError && (
                          <p className="text-sm text-red-500">{passError}</p>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                          <input
                            type="text"
                            value={newPassName}
                            onChange={(e) => setNewPassName(e.target.value)}
                            placeholder="e.g. VIP Access"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <textarea
                            value={newPassDescription}
                            onChange={(e) => setNewPassDescription(e.target.value)}
                            placeholder="What does this pass unlock?"
                            rows={3}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Price (AdventureBux)</label>
                          <input
                            type="number"
                            min="0"
                            value={newPassPrice}
                            onChange={(e) => setNewPassPrice(e.target.value)}
                            className="w-32 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                          />
                        </div>
                        <button
                          onClick={handleAddPass}
                          disabled={submittingPass}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingPass ? "Creating..." : "Create Pass"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {loadingPasses ? (
                  <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </div>
                ) : passes.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                    No items for sale yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {passes.map((pass) => (
                      <div key={pass.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col">
                        {pass.image_url && (
                          <img src={pass.image_url} alt={pass.name} className="w-full h-32 object-cover rounded mb-3" />
                        )}
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pass.name}</p>
                        {pass.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex-1">{pass.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{pass.price} AdventureBux</span>
                          <button
                            onClick={() => alert("Purchasing is not yet available.")}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Servers" && (
              <div className="py-6">
                {loadingServers ? (
                  <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </div>
                ) : !game?.placeId || servers.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                    No public servers available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {servers.map((server) => (
                      <div key={server.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-2">
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate" title={server.id}>
                          Server {server.id.slice(0, 8)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {server.playing}/{server.maxPlayers} players
                        </p>
                        <a
                          href={`roblox://experiences/start?placeId=${game.placeId}&gameInstanceId=${server.id}`}
                          className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors text-center"
                        >
                          Join
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-6 mt-8">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                Comments
              </h2>

              <div className="mb-4">
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Say something..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || postingComment}
                    className="px-4 py-2 h-fit bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {postingComment ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      {/* Comment Header */}
                      <div className="flex gap-3 mb-3">
                        <UserAvatar
                          userId={comment.author_id}
                          username={comment.author_display_name || comment.author_username}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${comment.author_username}`}
                              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {comment.author_display_name || comment.author_username}
                            </Link>
                            {comment.author_is_verified && <VerifiedBadge size="sm" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} | {new Date(comment.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Comment Content */}
                      {comment.content && (
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-3 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      )}

                      {/* Comment Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        {comment.replies.length > 0 ? (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                          >
                            {showReplies[comment.id] ? "Hide" : "View"} Replies ({comment.replies.length})
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">No replies yet</span>
                        )}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (!showReplies[comment.id]) {
                                toggleReplies(comment.id);
                              }
                              setTimeout(() => {
                                const input = document.querySelector(`input[data-comment-id="${comment.id}"]`) as HTMLInputElement;
                                input?.focus();
                              }, 100);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            Reply
                          </button>
                          {comment.author_id === currentUserId && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Replies Section */}
                      {showReplies[comment.id] && (
                        <div className="mt-4 space-y-3">
                          {/* Reply Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              data-comment-id={comment.id}
                              value={replyText[comment.id] || ""}
                              onChange={(e) =>
                                setReplyText({ ...replyText, [comment.id]: e.target.value })
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReplySubmit(comment.id);
                                }
                              }}
                              placeholder="Write a reply..."
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              disabled={!replyText[comment.id]?.trim() || postingReply[comment.id]}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {postingReply[comment.id] ? "..." : "Reply"}
                            </button>
                          </div>

                          {/* Replies List */}
                          {comment.replies.length > 0 && (
                            <div className="space-y-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-2">
                                  <UserAvatar
                                    userId={reply.author_id}
                                    username={reply.author_display_name || reply.author_username}
                                    size={32}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Link
                                        href={`/profile/${reply.author_username}`}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {reply.author_display_name || reply.author_username}
                                      </Link>
                                      {reply.author_is_verified && <VerifiedBadge size="sm" />}
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(reply.created_at).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-900 dark:text-gray-100 mt-0.5 break-words">
                                      {reply.content}
                                    </p>
                                  </div>
                                  {reply.author_id === currentUserId && (
                                    <button
                                      onClick={() => handleDeleteReply(comment.id, reply.id)}
                                      className="text-xs text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No comments yet. Be the first to post!
                  </p>
                </div>
              )}
            </div>
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

export default GameDetailPage;
