"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, HelpCircle, MoreHorizontal, Check, X } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { friendsApi, usersApi } from "@/lib/api";
import UserAvatar from "../components/UserAvatar";
import { useRealtime } from "@/contexts/RealtimeContext";

function FriendsPageContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const userId = searchParams.get('userId');
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tabFromUrl || "Friends");
  const [connectionSearch, setConnectionSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { presenceMap } = useRealtime();

  const [friends, setFriends] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);

  const tabs = ["Friends", "Following", "Followers", "Requests"];

  useEffect(() => {
    if (tabFromUrl && tabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "Friends") {
          const userId = searchParams.get('userId');
          const response = userId
            ? await friendsApi.getUserFriends(userId)
            : await friendsApi.getFriends();
          if (response.success && response.data) {
            const realFriends = (response.data.friends || []).map((friend: any) => {
              const presence = presenceMap.get(friend.id);
              const status = presence?.presenceStatus || 'offline';
              return {
                id: friend.id,
                name: friend.display_name || friend.username,
                username: `@${friend.username}`,
                status: status === 'online' ? 'Online' : status === 'in-game' ? 'Playing' : 'Offline',
                statusType: status,
              };
            });
            setFriends(realFriends);
          } else {
            setFriends([]);
          }
        } else if (activeTab === "Following") {
          const response = userId
            ? await usersApi.getUserFollowing(userId)
            : await usersApi.getFollowing();
          if (response.success && response.data) {
            const realFollowing = (response.data.following || []).map((user: any) => {
              const presence = presenceMap.get(user.id);
              const status = presence?.presenceStatus || 'offline';
              return {
                id: user.id,
                name: user.display_name || user.username,
                username: `@${user.username}`,
                status: status === 'online' ? 'Online' : status === 'in-game' ? 'Playing' : 'Offline',
                statusType: status,
                isVerified: user.is_verified,
              };
            });
            setFollowing(realFollowing);
          } else {
            setFollowing([]);
          }
        } else if (activeTab === "Followers") {
          const response = userId
            ? await usersApi.getUserFollowers(userId)
            : await usersApi.getFollowers();
          if (response.success && response.data) {
            const realFollowers = (response.data.followers || []).map((user: any) => {
              const presence = presenceMap.get(user.id);
              const status = presence?.presenceStatus || 'offline';
              return {
                id: user.id,
                name: user.display_name || user.username,
                username: `@${user.username}`,
                status: status === 'online' ? 'Online' : status === 'in-game' ? 'Playing' : 'Offline',
                statusType: status,
                isVerified: user.is_verified,
              };
            });
            setFollowers(realFollowers);
          } else {
            setFollowers([]);
          }
        } else if (activeTab === "Requests") {
          const response = await friendsApi.getFriendRequests();
          if (response.success && response.data) {
            const realRequests = (response.data.received || []).map((req: any) => ({
              id: req.sender_id,
              request_id: req.id,
              name: req.sender_display_name || req.sender_username,
              username: `@${req.sender_username}`,
              status: "Offline",
              statusType: "offline",
            }));
            setReceivedRequests(realRequests);
            setSentRequests(response.data.sent || []);
          } else {
            setReceivedRequests([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (activeTab === "Friends") setFriends([]);
        if (activeTab === "Following") setFollowing([]);
        if (activeTab === "Followers") setFollowers([]);
        if (activeTab === "Requests") setReceivedRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, presenceMap]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await friendsApi.acceptFriendRequest(requestId);
      if (response.success) {
        const [requestsResponse, friendsResponse] = await Promise.all([
          friendsApi.getFriendRequests(),
          friendsApi.getFriends()
        ]);

        if (requestsResponse.success && requestsResponse.data) {
          const realRequests = (requestsResponse.data.received || []).map((req: any) => ({
            id: req.sender_id,
            request_id: req.id,
            name: req.sender_display_name || req.sender_username,
            username: `@${req.sender_username}`,
            status: "Offline",
            statusType: "offline",
          }));
          setReceivedRequests(realRequests);
        }

        if (friendsResponse.success && friendsResponse.data) {
          const realFriends = (friendsResponse.data.friends || []).map((friend: any) => {
            const presence = presenceMap.get(friend.id);
            const status = presence?.presenceStatus || 'offline';
            return {
              id: friend.id,
              name: friend.display_name || friend.username,
              username: `@${friend.username}`,
              status: status === 'online' ? 'Online' : status === 'in-game' ? 'Playing' : 'Offline',
              statusType: status,
            };
          });
          setFriends(realFriends);
        }
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await friendsApi.declineFriendRequest(requestId);
      if (response.success) {
        const requestsResponse = await friendsApi.getFriendRequests();
        if (requestsResponse.success && requestsResponse.data) {
          const realRequests = (requestsResponse.data.received || []).map((req: any) => ({
            id: req.sender_id,
            request_id: req.id,
            name: req.sender_display_name || req.sender_username,
            username: `@${req.sender_username}`,
            status: "Offline",
            statusType: "offline",
          }));
          setReceivedRequests(realRequests);
        }
      }
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "Friends": return friends;
      case "Following": return following;
      case "Followers": return followers;
      case "Requests": return receivedRequests;
      default: return friends;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          My Friends
        </h1>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 dark:border-gray-800 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-base font-semibold transition-colors relative ${
                activeTab === tab
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-gray-100" />
              )}
            </button>
          ))}
        </div>

        {/* Content Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {activeTab} ({currentData.length})
            </h2>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <HelpCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {activeTab === "Connections" && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 w-64">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search Friends"
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                className="bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus:outline-none w-full"
              />
            </div>
          )}
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentData.map((user) => (
            <div
              key={user.id}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 relative"
            >
              {/* 3-dot menu */}
              {(activeTab === "Friends" || activeTab === "Following") && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>

                  {openMenuId === user.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-20">
                        <button
                          onClick={() => setOpenMenuId(null)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                          {activeTab === "Friends" ? "Unfriend" : "Unfollow"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                {/* Avatar with status dot */}
                <Link
                  href={`/profile/${user.username.replace('@', '')}`}
                  className="relative mb-3 block hover:opacity-90 transition-opacity"
                >
                  <div className="relative inline-block">
                    <UserAvatar userId={user.id} username={user.name} size={96} headshot />
                    {user.statusType && user.statusType !== "offline" && (
                      <div
                        className={`absolute w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 ${
                          user.statusType === "online-game"
                            ? "bg-green-500"
                            : user.statusType === "online"
                              ? "bg-blue-500"
                              : user.statusType === "studio"
                                ? "bg-orange-500"
                                : "bg-gray-400"
                        }`}
                        style={{ bottom: "2px", right: "2px" }}
                      />
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.statusType === "online-game"
                        ? "bg-green-500"
                        : user.statusType === "online"
                          ? "bg-blue-500"
                          : user.statusType === "studio"
                            ? "bg-orange-500"
                            : "bg-gray-400"
                    }`}
                  />
                  <Link
                    href={`/profile/${user.username.replace('@', '')}`}
                    className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                  >
                    {user.name}
                  </Link>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{user.username}</p>
                <p
                  className={`text-sm font-medium ${
                    user.statusType === "online-game"
                      ? "text-green-600 dark:text-green-400"
                      : user.statusType === "online"
                        ? "text-blue-600 dark:text-blue-400"
                        : user.statusType === "studio"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {user.status}
                </p>

                {/* Action buttons for Requests */}
                {activeTab === "Requests" && (
                  <div className="flex gap-2 mt-4 w-full">
                    <button
                      onClick={() => {
                        if (user.request_id) handleDeclineRequest(user.request_id);
                      }}
                      className="flex-1 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded transition-colors flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (user.request_id) handleAcceptRequest(user.request_id);
                      }}
                      className="flex-1 p-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded transition-colors flex items-center justify-center"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <FriendsPageContent />
    </Suspense>
  );
}
