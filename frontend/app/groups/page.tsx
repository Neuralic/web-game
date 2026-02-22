"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { groupsApi } from "@/lib/api";

interface Group {
  id: string;
  group_number?: number;
  name: string;
  description?: string;
  icon_url?: string;
  cover_photo_url?: string;
  owner_id: string;
  member_count: number;
  is_verified: boolean;
  created_at: string;
  owner_username?: string;
  owner_display_name?: string;
}

const groupSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const groupHref = (group: Group) =>
  group.group_number
    ? `/groups/${group.group_number}/${groupSlug(group.name)}`
    : `/groups/${group.id}`;

const GroupsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user's groups and all groups
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError("");

      try {
        // Check if user intentionally navigated here (via See All button)
        const urlParams = new URLSearchParams(window.location.search);
        const isIntentional = urlParams.get('discover') === 'true';

        // Fetch user's groups (groups they own or are a member of)
        const userGroupsResponse = await groupsApi.getUserGroups();
        if (userGroupsResponse.success && userGroupsResponse.data) {
          const groups = (userGroupsResponse.data.groups as Group[]) || [];
          setUserGroups(groups);
          
          // Only redirect if user has groups AND didn't intentionally come to discover page
          if (groups.length > 0 && !isIntentional) {
            const g = groups[0];
            const href = g.group_number
              ? `/groups/${g.group_number}/${groupSlug(g.name)}`
              : `/groups/${g.id}`;
            router.push(href);
            return;
          }
        }

        // Fetch all groups for discovery mode
        const allGroupsResponse = await groupsApi.getAllGroups({
          page: 1,
          limit: 20,
        });
        if (allGroupsResponse.success && allGroupsResponse.data) {
          setAllGroups((allGroupsResponse.data.groups as Group[]) || []);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
        setError("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="w-full px-4 py-8">
        {/* Top Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Search Groups
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Info Text */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          Join a group to connect with people like you! Groups exist for all
          types of communities - fan clubs, help communities, hobbies,
          corporations, and more. Groups have their own walls and shared places.
        </p>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading groups...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Your Groups */}
        {!loading && userGroups.length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Your Groups
              </h2>
              <Link
                href="/groups/my-groups"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
              >
                See All →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {userGroups.slice(0, 6).map((group) => (
                <Link
                  key={group.id}
                  href={groupHref(group)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-blue-500 transition-all relative">
                    {group.icon_url ? (
                      <Image
                        src={group.icon_url}
                        alt={group.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <span className="text-4xl">🎮</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {group.name}
                    </h3>
                    {group.is_verified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {group.member_count?.toLocaleString() || 0} Members
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Groups / Discover Groups */}
        {!loading && allGroups.length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Discover Groups
              </h2>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                See All →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allGroups.slice(0, 12).map((group) => (
                <Link
                  key={group.id}
                  href={groupHref(group)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-blue-500 transition-all relative">
                    {group.icon_url ? (
                      <Image
                        src={group.icon_url}
                        alt={group.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <span className="text-4xl">🎮</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {group.name}
                    </h3>
                    {group.is_verified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {group.member_count?.toLocaleString() || 0} Members
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    by{" "}
                    {group.owner_display_name ||
                      group.owner_username ||
                      "Unknown"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Job Roleplay Groups */}
        {!loading && allGroups.filter(g => g.name.toLowerCase().includes('role') || g.name.toLowerCase().includes('job')).length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Job Roleplay</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allGroups.filter(g => g.name.toLowerCase().includes('role') || g.name.toLowerCase().includes('job')).slice(0, 6).map((group) => (
                <Link key={group.id} href={groupHref(group)} className="group cursor-pointer">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-blue-500 transition-all relative">
                    {group.icon_url ? <Image src={group.icon_url} alt={group.name} fill className="object-cover" sizes="16vw" /> : <span className="text-4xl">🎭</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{group.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{group.member_count?.toLocaleString() || 0} Members</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Studios Groups */}
        {!loading && allGroups.filter(g => g.name.toLowerCase().includes('studio')).length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Studios</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allGroups.filter(g => g.name.toLowerCase().includes('studio')).slice(0, 6).map((group) => (
                <Link key={group.id} href={groupHref(group)} className="group cursor-pointer">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-blue-500 transition-all relative">
                    {group.icon_url ? <Image src={group.icon_url} alt={group.name} fill className="object-cover" sizes="16vw" /> : <span className="text-4xl">🎬</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{group.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{group.member_count?.toLocaleString() || 0} Members</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Fan Groups */}
        {!loading && allGroups.filter(g => g.name.toLowerCase().includes('fan') || g.name.toLowerCase().includes('build')).length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Fan</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allGroups.filter(g => g.name.toLowerCase().includes('fan') || g.name.toLowerCase().includes('build')).slice(0, 6).map((group) => (
                <Link key={group.id} href={groupHref(group)} className="group cursor-pointer">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-blue-500 transition-all relative">
                    {group.icon_url ? <Image src={group.icon_url} alt={group.name} fill className="object-cover" sizes="16vw" /> : <span className="text-4xl">⭐</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{group.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{group.member_count?.toLocaleString() || 0} Members</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default GroupsPage;
