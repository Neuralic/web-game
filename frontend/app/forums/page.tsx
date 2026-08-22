"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import UserAdBanner from "../components/UserAdBanner";
import { forumApi } from "@/lib/api";
import { timeAgo } from "@/lib/formatTime";

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  order: number;
  thread_count: number;
  reply_count: number;
  latest_thread_id: string | null;
  latest_thread_title: string | null;
  latest_activity_at: string | null;
  latest_author_username: string | null;
  latest_author_display_name: string | null;
}

const ForumsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await forumApi.getCategories();
        if (response.success && response.data) {
          setCategories((response.data.categories as ForumCategory[]) || []);
        }
      } catch (error) {
        console.error("Failed to fetch forum categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex justify-center gap-4 px-4 py-6">
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>

        <div className="max-w-[1000px] w-full">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">DevForum</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Discuss development, share creations, and get help from the AdventureBlox community.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No forum categories yet.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg divide-y divide-gray-200 dark:divide-[#2a2a2a] overflow-hidden">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/forums/${category.slug}`}
                  className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-3xl bg-gray-100 dark:bg-[#242424] rounded-lg">
                    {category.icon || "💬"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{category.name}</h2>
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{category.description}</p>
                    )}
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> {category.thread_count.toLocaleString()} threads
                    </span>
                    <span>{category.reply_count.toLocaleString()} replies</span>
                  </div>

                  <div className="hidden md:block w-56 flex-shrink-0 text-right">
                    {category.latest_thread_id ? (
                      <>
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {category.latest_thread_title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {category.latest_author_display_name || category.latest_author_username || "Unknown"}
                          {category.latest_activity_at && ` · ${timeAgo(category.latest_activity_at)}`}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No activity yet</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
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

export default ForumsPage;
