"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
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

const CATEGORY_COLORS = [
  "bg-blue-500",
  "bg-red-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-teal-500",
];

const ForumsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "latest" | "hot">("categories");

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

      <div className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-[1100px] flex gap-6">

          {/* Left Sidebar */}
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-0.5 mb-4">
              <Link href="/forums/latest" className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                Latest Topics
              </Link>
              <Link href="/forums" className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
                Categories
              </Link>
              <Link href="/forums/users" className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                Users
              </Link>
              <Link href="/forums/guidelines" className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                Guidelines
              </Link>
            </nav>

            <div className="border-t border-gray-200 dark:border-[#2a2a2a] my-3" />

            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2">
              Categories
            </p>
            <nav className="space-y-0.5">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/forums/${cat.slug}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} />
                  <span className="truncate">{cat.name}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 dark:border-[#2a2a2a] mb-4">
              {(["categories", "latest", "hot"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {tab === "categories" ? "Categories" : tab === "latest" ? "Latest" : "Hot"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No forum categories yet.</p>
              </div>
            ) : activeTab === "categories" ? (
              <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_80px_200px] gap-4 px-4 py-2 bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-[#2a2a2a]">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Category</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider text-center">Topics</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider text-right">Latest Post</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                  {categories.map((category, i) => {
                    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                    return (
                      <div key={category.id} className="grid grid-cols-[1fr_80px_200px] gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors items-center">
                        {/* Category name + description */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex-shrink-0 ${color} flex items-center justify-center text-white text-lg font-bold`}>
                            {category.icon || category.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/forums/${category.slug}`}
                              className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {category.name}
                            </Link>
                            {category.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{category.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Topics count */}
                        <div className="text-center">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{category.thread_count.toLocaleString()}</span>
                        </div>

                        {/* Latest post */}
                        <div className="text-right min-w-0">
                          {category.latest_thread_id ? (
                            <>
                              <Link
                                href={`/forums/${category.slug}/${category.latest_thread_id}`}
                                className="text-xs text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1 transition-colors block"
                              >
                                {category.latest_thread_title}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                {category.latest_author_display_name || category.latest_author_username || "Unknown"}
                                {category.latest_activity_at && ` · ${timeAgo(category.latest_activity_at)}`}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-600">No posts yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Coming soon.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForumsPage;
