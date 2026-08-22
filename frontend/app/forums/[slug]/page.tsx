"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MessageSquare, Eye, Pin, Lock, Plus } from "lucide-react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import UserAdBanner from "../../components/UserAdBanner";
import UserAvatar from "../../components/UserAvatar";
import VerifiedBadge from "../../components/VerifiedBadge";
import { forumApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { timeAgo } from "@/lib/formatTime";

interface ForumCategoryInfo {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
}

interface ForumThread {
  id: string;
  title: string;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  author_username: string | null;
  author_display_name: string | null;
  author_is_verified: boolean;
  reply_count: number;
  last_activity_at: string;
}

const CategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [category, setCategory] = useState<ForumCategoryInfo | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loggedIn = isAuthenticated();

  const fetchThreads = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await forumApi.getCategoryThreads(slug, { page, limit: 20 });
      if (response.success && response.data) {
        setCategory(response.data.category as ForumCategoryInfo);
        setThreads((response.data.threads as ForumThread[]) || []);
        const pagination = response.data.pagination as { page: number; totalPages: number };
        setCurrentPage(pagination.page);
        setTotalPages(pagination.totalPages);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Failed to fetch category threads:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchThreads(1);
  }, [slug, fetchThreads]);

  const handleCreateThread = async () => {
    setCreateError(null);
    if (!category) return;

    const trimmedTitle = newTitle.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      setCreateError("Title must be 3-200 characters");
      return;
    }
    if (!newContent.trim()) {
      setCreateError("Content is required");
      return;
    }

    setCreating(true);
    try {
      const response = await forumApi.createThread({
        categoryId: category.id,
        title: trimmedTitle,
        content: newContent.trim(),
      });
      if (response.success && response.data) {
        const thread = response.data.thread as { id: string };
        router.push(`/forums/thread/${thread.id}`);
      } else {
        setCreateError(response.message || response.error || "Failed to create thread");
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
      setCreateError("Failed to create thread");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex justify-center gap-4 px-4 py-6">
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>

        <div className="max-w-[1000px] w-full">
          {loading && !category ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : notFound || !category ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Category not found.</p>
              <Link href="/forums" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                Back to DevForum
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-3xl bg-gray-100 dark:bg-[#242424] rounded-lg">
                    {category.icon || "💬"}
                  </div>
                  <div>
                    <Link href="/forums" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      ← DevForum
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{category.name}</h1>
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                    )}
                  </div>
                </div>

                {loggedIn && (
                  <button
                    onClick={() => setShowNewThreadForm((v) => !v)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New Thread
                  </button>
                )}
              </div>

              {!loggedIn && (
                <div className="mb-6 bg-gray-50 dark:bg-[#242424] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Log in</Link> to start a thread.
                </div>
              )}

              {showNewThreadForm && (
                <div className="mb-6 bg-gray-50 dark:bg-[#242424] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Thread title"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={5}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreateThread}
                      disabled={creating}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded transition-colors flex items-center gap-2"
                    >
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Post Thread
                    </button>
                    <button
                      onClick={() => { setShowNewThreadForm(false); setCreateError(null); }}
                      className="px-4 py-2 bg-gray-200 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 font-medium text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : threads.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No threads in this category yet. Be the first to post!</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg divide-y divide-gray-200 dark:divide-[#2a2a2a] overflow-hidden">
                  {threads.map((thread) => (
                    <Link
                      key={thread.id}
                      href={`/forums/thread/${thread.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <UserAvatar
                        userId={thread.author_id || ""}
                        username={thread.author_username || undefined}
                        size={40}
                        headshot
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {thread.is_pinned && <Pin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                          {thread.is_locked && <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {thread.title}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {thread.author_display_name || thread.author_username || "Unknown"}
                          {thread.author_is_verified && <VerifiedBadge size="sm" />}
                          <span>· {timeAgo(thread.created_at)}</span>
                        </p>
                      </div>

                      <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> {thread.reply_count.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {thread.views.toLocaleString()}
                        </span>
                      </div>

                      <div className="hidden md:block w-24 flex-shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">
                        {timeAgo(thread.last_activity_at)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => fetchThreads(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => fetchThreads(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
