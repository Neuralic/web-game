"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, UserPlus, MessageSquare, MoreHorizontal } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import VerifiedBadge from "../components/VerifiedBadge";
import { friendsApi } from "@/lib/api";

interface BestFriend {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_verified?: boolean;
  presence_status?: string;
  current_game?: string;
}

export default function BestFriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bestFriends, setBestFriends] = useState<BestFriend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<BestFriend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchBestFriends();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFriends(bestFriends);
    } else {
      const filtered = bestFriends.filter(
        (friend) =>
          friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, bestFriends]);

  const fetchBestFriends = async () => {
    setIsLoading(true);
    try {
      const response = await friendsApi.getBestFriends();
      if (response.success && response.data) {
        const friendsData = (response.data.bestFriends || []).map((friend: any) => ({
          id: friend.id,
          username: friend.username,
          display_name: friend.display_name,
          avatar_url: friend.avatar_url || `https://robohash.org/${friend.username}?set=set3`,
          is_verified: friend.is_verified,
          presence_status: friend.presence_status || 'offline',
          current_game: friend.current_game,
        }));
        setBestFriends(friendsData);
        setFilteredFriends(friendsData);
      }
    } catch (error) {
      console.error("Error fetching best friends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBestFriend = async (friendId: string) => {
    if (!window.confirm("Remove this user from your best friends?")) return;
    
    try {
      const response = await friendsApi.removeBestFriend(friendId);
      if (response.success) {
        setBestFriends(prev => prev.filter(f => f.id !== friendId));
      }
    } catch (error) {
      console.error("Error removing best friend:", error);
    }
  };

  const getPresenceColor = (status: string) => {
    if (status === 'online') return 'bg-blue-500';
    if (status === 'in-game') return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getPresenceText = (friend: BestFriend) => {
    if (friend.presence_status === 'online') return 'Online';
    if (friend.presence_status === 'in-game') {
      return friend.current_game ? `Playing ${friend.current_game}` : 'In Game';
    }
    return 'Offline';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Best Friends
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your closest friends on AdventureBlox. No limit on how many you can have!
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search best friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Best Friends Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredFriends.length} {filteredFriends.length === 1 ? 'best friend' : 'best friends'}
            {searchQuery && ` (filtered from ${bestFriends.length})`}
          </p>
        </div>

        {/* Best Friends Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-600 dark:text-gray-400">Loading best friends...</div>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? 'No best friends found' : 'No best friends yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Add friends to your best friends list from their profile'}
            </p>
            {!searchQuery && (
              <Link
                href="/connect"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Find Friends
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                {/* Friend Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/profile/${friend.username}`} className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={friend.avatar_url || `https://robohash.org/${friend.username}?set=set3`}
                          alt={friend.username}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                      {/* Presence Badge */}
                      {friend.presence_status !== 'offline' && (
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${getPresenceColor(friend.presence_status || 'offline')} rounded-full border-2 border-white dark:border-gray-800`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">
                          {friend.display_name || friend.username}
                        </p>
                        {friend.is_verified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </Link>

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(showMenu === friend.id ? null : friend.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    {showMenu === friend.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px] z-10">
                        <Link
                          href={`/profile/${friend.username}`}
                          className="block px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowMenu(null)}
                        >
                          View Profile
                        </Link>
                        <Link
                          href="/messages"
                          className="block px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowMenu(null)}
                        >
                          Send Message
                        </Link>
                        <button
                          onClick={() => {
                            handleRemoveBestFriend(friend.id);
                            setShowMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Remove Best Friend
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Presence Status */}
                <div className="mb-3">
                  <p className={`text-xs font-medium ${
                    friend.presence_status === 'online' ? 'text-blue-600 dark:text-blue-400' :
                    friend.presence_status === 'in-game' ? 'text-green-600 dark:text-green-400' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getPresenceText(friend)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/profile/${friend.username}`}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-xs font-medium rounded-lg transition-colors text-center"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/messages"
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
