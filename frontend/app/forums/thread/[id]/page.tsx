"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, Pin, Lock, Trash2 } from "lucide-react";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import UserAdBanner from "../../../components/UserAdBanner";
import UserAvatar from "../../../components/UserAvatar";
import VerifiedBadge from "../../../components/VerifiedBadge";
import { forumApi, usersApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { timeAgo } from "@/lib/formatTime";

interface ForumThreadDetail {
  id: string;
  title: string;
  content: string;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  author_id: string | null;
  author_username: string | null;
  author_display_name: string | null;
  author_is_verified: boolean;
  category_id: string;
  category_name: string;
  category_slug: string;
}

interface ForumReply {
  id: string;
  content: string;
  created_at: string;
  author_id: string | null;
  author_username: string | null;
  author_display_name: string | null;
  author_is_verified: boolean;
}

const ThreadPage = () => {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [thread, setThread] = useState<ForumThreadDetail | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const loggedIn = isAuthenticated();

  const fetchThread = useCallback(async () => {
    setLoading(true);
    try {
      const response = await forumApi.getThread(threadId);
      if (response.success && response.data) {
        setThread(response.data.thread as ForumThreadDetail);
        setReplies((response.data.replies as ForumReply[]) || []);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Failed to fetch thread:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (threadId) fetchThread();
  }, [threadId, fetchThread]);

  useEffect(() => {
    if (!loggedIn) return;
    usersApi.getCurrentUser().then((response) => {
      if (response.success && response.data) {
        const user = response.data.user as { id: string; is_admin?: boolean };
        setCurrentUserId(user.id);
        setIsAdmin(!!user.is_admin);
      }
    });
  }, [loggedIn]);

  const handleDeleteThread = async () => {
    if (!thread || !confirm("Delete this thread? This cannot be undone.")) return;
    const response = await forumApi.deleteThread(thread.id);
    if (response.success) {
      router.push(`/forums/${thread.category_slug}`);
    } else {
      alert(response.message || response.error || "Failed to delete thread");
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Delete this reply? This cannot be undone.")) return;
    const response = await forumApi.deleteReply(replyId);
    if (response.success) {
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
    } else {
      alert(response.message || response.error || "Failed to delete reply");
    }
  };

  const handleSendReply = async () => {
    setReplyError(null);
    if (!replyContent.trim()) {
      setReplyError("Reply cannot be empty");
      return;
    }

    setSendingReply(true);
    try {
      const response = await forumApi.createReply(threadId, replyContent.trim());
      if (response.success && response.data) {
        setReplies((prev) => [...prev, response.data!.reply as ForumReply]);
        setReplyContent("");
      } else {
        setReplyError(response.message || response.error || "Failed to post reply");
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
      setReplyError("Failed to post reply");
    } finally {
      setSendingReply(false);
    }
  };

  const canDelete = (authorId: string | null) =>
    !!currentUserId && (currentUserId === authorId || isAdmin);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex justify-center gap-4 px-4 py-6">
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>

        <div className="max-w-[900px] w-full">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : notFound || !thread ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Thread not found.</p>
              <Link href="/forums" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                Back to DevForum
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                <Link href="/forums" className="hover:underline text-blue-600 dark:text-blue-400">DevForum</Link>
                {" › "}
                <Link href={`/forums/${thread.category_slug}`} className="hover:underline text-blue-600 dark:text-blue-400">
                  {thread.category_name}
                </Link>
              </div>

              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {thread.is_pinned && <Pin className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                  {thread.is_locked && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{thread.title}</h1>
                </div>
                {canDelete(thread.author_id) && (
                  <button
                    onClick={handleDeleteThread}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Thread
                  </button>
                )}
              </div>

              {/* Original post */}
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-5 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar userId={thread.author_id || ""} username={thread.author_username || undefined} size={48} headshot />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      {thread.author_display_name || thread.author_username || "Unknown"}
                      {thread.author_is_verified && <VerifiedBadge size="sm" />}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>{timeAgo(thread.created_at)}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {thread.views.toLocaleString()} views</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{thread.content}</p>
              </div>

              {/* Replies */}
              <div className="space-y-3 mb-6">
                {replies.map((reply) => (
                  <div key={reply.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar userId={reply.author_id || ""} username={reply.author_username || undefined} size={36} headshot />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                            {reply.author_display_name || reply.author_username || "Unknown"}
                            {reply.author_is_verified && <VerifiedBadge size="sm" />}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(reply.created_at)}</p>
                        </div>
                      </div>
                      {canDelete(reply.author_id) && (
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete reply"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap mt-3">{reply.content}</p>
                  </div>
                ))}
              </div>

              {/* Reply input */}
              {thread.is_locked ? (
                <div className="bg-gray-50 dark:bg-[#242424] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> This thread is locked. No new replies can be posted.
                </div>
              ) : !loggedIn ? (
                <div className="bg-gray-50 dark:bg-[#242424] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Log in</Link> to reply to this thread.
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-[#242424] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {replyError && <p className="text-sm text-red-600 dark:text-red-400">{replyError}</p>}
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded transition-colors flex items-center gap-2"
                  >
                    {sendingReply && <Loader2 className="w-4 h-4 animate-spin" />}
                    Post Reply
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

export default ThreadPage;
