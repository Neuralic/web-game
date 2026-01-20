"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  Users,
  ExternalLink,
  Monitor,
  LayoutGrid,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import VerifiedBadge from "../components/VerifiedBadge";
import { usersApi } from "@/lib/api";

interface UserProfile {
  id?: string;
  username: string;
  display_name?: string;
  bio?: string;
  status_message?: string;
  is_verified?: boolean;
}

const ProfilePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const [currentWearingIndex, setCurrentWearingIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarViewMode, setAvatarViewMode] = useState<"2D" | "3D">("3D");
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const menuRef = useRef<HTMLDivElement>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedUsername, setEditedUsername] = useState("");
  const [statusMessage, setStatusMessage] = useState("Playing with AdventureBlox Studio 2.0");
  const [editedStatusMessage, setEditedStatusMessage] = useState("Playing with AdventureBlox Studio 2.0");
  const [showAdvertisement, setShowAdvertisement] = useState(true); // Toggle to show/hide ad
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await usersApi.getCurrentUser();
        if (response.success && response.data) {
          const userData = response.data.user as UserProfile;
          setUser(userData);
          setDisplayName(userData.display_name || userData.username);
          setUsername(userData.username);
          setEditedDisplayName(userData.display_name || userData.username);
          setEditedUsername(userData.username);
          setBio(userData.bio || "");
          setEditedBio(userData.bio || "");
          // Keep dummy status if API returns empty (for demo purposes)
          if (userData.status_message) {
            setStatusMessage(userData.status_message);
            setEditedStatusMessage(userData.status_message);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = ["About", "Creations"];

  // Mock data
  const currentlyWearing = [
    { id: 1, name: "Man Torso", type: "Torso", image: "", price: "" },
    { id: 2, name: "Man Right Arm", type: "Arm", image: "", price: "" },
    { id: 3, name: "Man Left Arm", type: "Arm", image: "", price: "" },
    { id: 4, name: "Man Left Leg", type: "Leg", image: "", price: "" },
    { id: 5, name: "Man Right Leg", type: "Leg", image: "", price: "" },
    { id: 6, name: "Pal Hair", type: "Hair", image: "", price: "Free" },
    {
      id: 7,
      name: "Blue and Black Motorcycle Shirt",
      type: "Shirt",
      image: "",
      price: "Free",
    },
    {
      id: 8,
      name: "Dark Green Jeans",
      type: "Pants",
      image: "",
      price: "Free",
    },
    { id: 9, name: "Hello", type: "Emote", image: "", price: "Free" },
    { id: 10, name: "Stadium", type: "Emote", image: "", price: "Free" },
    { id: 11, name: "Point2", type: "Emote", image: "", price: "Free" },
    { id: 12, name: "Shrug", type: "Emote", image: "", price: "Free" },
  ];

  const favorites = [
    {
      id: 1,
      name: "HOW TO TRAIN YOUR DRAGON",
      rating: "95%",
      plays: "2.5K",
      image: "",
    },
    {
      id: 2,
      name: "Teamwork Puzzles 2 (Obby)",
      rating: "92%",
      plays: "3.3K",
      image: "",
    },
  ];

  const friends = [
    {
      id: 1,
      name: "nass4",
      username: "@nass4",
      avatar: "https://robohash.org/nass4?set=set3",
      status: "online-game",
    }, // Green - Playing game
    {
      id: 2,
      name: "pcobilaa",
      username: "@pcobilaa",
      avatar: "https://robohash.org/pcobilaa?set=set3",
      status: "online",
    }, // Blue - Online
    {
      id: 3,
      name: "JayJayElmi",
      username: "@JayJayElmi",
      avatar: "https://robohash.org/jayjay?set=set3",
      status: "studio",
    }, // Orange - In Studio
    {
      id: 4,
      name: "reahan007",
      username: "@reahan007",
      avatar: "https://robohash.org/reahan007?set=set3",
      status: "offline",
    }, // Grey/None - Offline
    {
      id: 5,
      name: "intann_bil",
      username: "@intann_bil",
      avatar: "https://robohash.org/intann?set=set3",
      status: "online-game",
    }, // Green - Playing game
    {
      id: 6,
      name: displayName || "User",
      username: `@${username}` || "@User",
      avatar: "https://robohash.org/reahan00r?set=set3",
      status: "online",
    }, // Blue - Online
    {
      id: 7,
      name: "Rfgzxgfdd",
      username: "@Rfgzxgfdd",
      avatar: "https://robohash.org/rfg?set=set3",
      status: "studio",
    }, // Orange - In Studio
  ];

  // Groups
  const groups = [
    {
      id: 1,
      name: "Building Roleplaying Fan ...",
      image: "https://robohash.org/buildingrp?set=set3",
      members: "5,036,909",
      rank: "Owner",
      verified: false,
    },
    {
      id: 2,
      name: "DuckXander",
      image: "https://robohash.org/duckxander?set=set3",
      members: "209,684",
      rank: "Duckies",
      verified: true,
    },
  ];

  const [groupsViewMode, setGroupsViewMode] = useState<"carousel" | "grid">(
    "carousel",
  );
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  // Groups carousel logic
  const groupsPerPage = 1;
  const maxGroupIndex = Math.max(0, groups.length - groupsPerPage);
  const visibleGroups = groups.slice(
    currentGroupIndex,
    currentGroupIndex + groupsPerPage,
  );
  const showPrevGroup = currentGroupIndex > 0;
  const showNextGroup = currentGroupIndex < maxGroupIndex;

  const handlePrevGroup = () => {
    setCurrentGroupIndex((prev) => Math.max(0, prev - groupsPerPage));
  };

  const handleNextGroup = () => {
    setCurrentGroupIndex((prev) =>
      Math.min(maxGroupIndex, prev + groupsPerPage),
    );
  };

  // Roblox Badges
  const robloxBadges = [{ id: 1, name: "Veteran", image: "" }];

  // Player Badges (original badges)
  const badges = [
    {
      id: 1,
      name: "First Catch",
      type: "event",
      image:
        "https://tr.rbxcdn.com/180DAY-f5e67ede903b5b601dbfeeae8cf30ca4/150/150/Image/Webp/noFilter",
    },
    {
      id: 2,
      name: "Ruby Rank Compl...",
      type: "achievement",
      image:
        "https://tr.rbxcdn.com/180DAY-f27876e227d1db9d246d938e7e2c1bfa/150/150/Image/Webp/noFilter",
    },
    {
      id: 3,
      name: "750 Gems",
      type: "currency",
      image:
        "https://tr.rbxcdn.com/180DAY-b5f5ec7123eac51331066e41f32f0744/150/150/Image/Webp/noFilter",
    },
    {
      id: 4,
      name: "150 Gems",
      type: "currency",
      image:
        "https://tr.rbxcdn.com/180DAY-4a009a65726fc790a5e98d8f97783d29/150/150/Image/Webp/noFilter",
    },
    {
      id: 5,
      name: "30 Gems",
      type: "currency",
      image:
        "https://tr.rbxcdn.com/180DAY-76c505966c1b2a60d6a2f133309170a5/150/150/Image/Webp/noFilter",
    },
    {
      id: 6,
      name: "Welcome!",
      type: "welcome",
      image:
        "https://tr.rbxcdn.com/180DAY-2d822d79429f504344a02d0550c4295f/150/150/Image/Webp/noFilter",
    },
  ];

  // Mock experiences for Creations tab
  const experiences = [
    {
      id: "1",
      title: `${displayName || "User"}'s Place`,
      description:
        "This is your very first AdventureBlox creation. Check it out, then make it your own with AdventureBlox Studio!",
      imageUrl: "",
      active: 0,
      visits: 0,
    },
  ];

  // Wearing grid pagination logic (4x2 = 8 items per page)
  const itemsPerPage = 8;
  const visibleWearingItems = currentlyWearing.slice(
    currentWearingIndex,
    currentWearingIndex + itemsPerPage,
  );

  // Bio editing handlers
  const handleEditBio = () => {
    setEditedBio(bio);
    setIsEditingBio(true);
  };

  const handleCancelBio = () => {
    setEditedBio(bio);
    setIsEditingBio(false);
  };

  const handleSaveBio = async () => {
    try {
      const response = await usersApi.updateProfile({
        bio: editedBio,
      });

      if (response.success) {
        setBio(editedBio);
        setIsEditingBio(false);
      } else {
        console.error("Failed to save bio:", response.message);
        alert("Failed to save bio. Please try again.");
      }
    } catch (error) {
      console.error("Error saving bio:", error);
      alert("An error occurred while saving bio.");
    }
  };

  // Handle save profile changes
  const handleSaveProfile = async () => {
    setSaveError("");
    setIsSavingProfile(true);

    try {
      // Check what actually changed
      const displayNameChanged = editedDisplayName !== displayName;
      const usernameChanged = editedUsername !== username;
      const statusMessageChanged = editedStatusMessage !== statusMessage;

      // If nothing changed, just close modal
      if (!displayNameChanged && !usernameChanged && !statusMessageChanged) {
        setShowEditProfileModal(false);
        setIsSavingProfile(false);
        return;
      }

      // Validate display name if it changed
      if (displayNameChanged) {
        if (!editedDisplayName.trim()) {
          setSaveError("Display name cannot be empty");
          setIsSavingProfile(false);
          return;
        }

        if (editedDisplayName.length < 3 || editedDisplayName.length > 50) {
          setSaveError("Display name must be between 3 and 50 characters");
          setIsSavingProfile(false);
          return;
        }
      }

      // Validate username if it changed
      if (usernameChanged) {
        if (!editedUsername.trim()) {
          setSaveError("Username cannot be empty");
          setIsSavingProfile(false);
          return;
        }

        if (editedUsername.length < 3 || editedUsername.length > 20) {
          setSaveError("Username must be between 3 and 20 characters");
          setIsSavingProfile(false);
          return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(editedUsername)) {
          setSaveError(
            "Username can only contain letters, numbers, and underscores",
          );
          setIsSavingProfile(false);
          return;
        }
      }

      // Build update object with only changed fields
      const updateData: any = {};
      if (displayNameChanged) {
        updateData.displayName = editedDisplayName;
      }
      if (usernameChanged) {
        updateData.username = editedUsername;
      }
      if (statusMessageChanged) {
        updateData.statusMessage = editedStatusMessage;
      }

      // Call API to update profile
      const response = await usersApi.updateProfile(updateData);

      if (response.success) {
        // Update local state with new values
        if (displayNameChanged) {
          setDisplayName(editedDisplayName);
        }
        if (usernameChanged) {
          setUsername(editedUsername);
        }
        if (statusMessageChanged) {
          setStatusMessage(editedStatusMessage);
        }

        setShowEditProfileModal(false);

        // Refresh user data from API
        const userResponse = await usersApi.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          const refreshedUser = userResponse.data.user as UserProfile;
          setUser(refreshedUser);
          // Update fields from fresh API data
          setDisplayName(refreshedUser.display_name || refreshedUser.username);
          setUsername(refreshedUser.username);
          setStatusMessage(refreshedUser.status_message || "");
        }
      } else {
        setSaveError(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveError("An error occurred. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Advertisement Banner - 728x90 */}
        {showAdvertisement && (
          <div className="flex justify-center py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="w-[728px] relative">
              {/* Close button */}
              <button
                onClick={() => setShowAdvertisement(false)}
                className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10"
                aria-label="Close ad"
              >
                ×
              </button>
              {/* Banner */}
              <div className="w-full h-[90px] bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                Advertisement Banner (728 x 90)
              </div>
              {/* Advertisement label and Report link */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Advertisement
                </span>
                <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline">
                  Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="max-w-[900px] mx-auto px-4">
          <div className="flex items-start gap-6 py-6 border-b border-gray-200 dark:border-gray-800">
            {/* Avatar with status badge */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                <Image
                  src="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-903254C5702EE154B5EA564D1D4CB860-Png/150/150/AvatarHeadshot/Webp/noFilter"
                  alt={username || "User Avatar"}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Status Badge - In Game (Green with gamepad icon) */}
              <div
                className="absolute w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900"
                style={{ bottom: "-3.5px", right: "-3.5px" }}
              >
                <FontAwesomeIcon
                  icon={faGamepad}
                  className="text-white text-xs"
                />
              </div>
            </div>

            {/* User info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {displayName || "User"}
                    {user?.is_verified && <VerifiedBadge size="md" />}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{username || "user"}
                  </p>
                  {statusMessage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                      "{statusMessage}"
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors"
                  >
                    Edit Profile
                  </button>
                  <Link href="/avatar">
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors">
                      Edit Avatar
                    </button>
                  </Link>

                  {/* Three dot menu */}
                  <div className="relative" ref={menuRef}>
                    <button
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                      <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Inventory
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Favorites
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-3">
                <Link
                  href="/connect"
                  className="flex items-center gap-1 hover:underline"
                >
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    7
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Friends
                  </span>
                </Link>
                <Link
                  href="/connect"
                  className="flex items-center gap-1 hover:underline"
                >
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    1
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Follower
                  </span>
                </Link>
                <Link
                  href="/connect"
                  className="flex items-center gap-1 hover:underline"
                >
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    1
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Following
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "About" ? (
            <div>
              {/* About Section with Bio */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      About
                    </h2>
                    {!isEditingBio && (
                      <button
                        onClick={handleEditBio}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3">
                    <a href="#" className="hover:opacity-80 transition-opacity">
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 24 24"
                        fill="#FF0000"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Bio editing area */}
                {isEditingBio ? (
                  <div>
                    <textarea
                      value={editedBio}
                      onChange={(e) =>
                        setEditedBio(e.target.value.slice(0, 1000))
                      }
                      placeholder="Tell the AdventureBlox community about what you like to make, build, and explore..."
                      className="w-full h-24 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Keep yourself safe, do not share personal details
                        online.
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {editedBio.length}/1000
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={handleCancelBio}
                        className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : bio ? (
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {bio}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No bio yet
                  </p>
                )}
              </div>

              {/* Currently Wearing - Merged with Avatar Display */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Currently Wearing
                </h2>

                <div className="flex gap-6">
                  {/* Left Side - Avatar Display with 2D/3D Toggle */}
                  <div className="flex-shrink-0">
                    <div className="relative bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 w-80">
                      {/* 2D/3D Toggle Button (Single Button) */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() =>
                            setAvatarViewMode(
                              avatarViewMode === "3D" ? "2D" : "3D",
                            )
                          }
                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-xs font-medium transition-colors border border-gray-300 dark:border-gray-600"
                        >
                          {avatarViewMode}
                        </button>
                      </div>

                      {/* Character Display */}
                      <div className="flex justify-center items-end h-48 mt-6">
                        <div className="relative">
                          {/* Character placeholder */}
                          <svg
                            width="100"
                            height="150"
                            viewBox="0 0 120 180"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Head */}
                            <rect
                              x="35"
                              y="0"
                              width="50"
                              height="50"
                              rx="8"
                              fill="#F5D0C5"
                            />
                            {/* Hair */}
                            <ellipse
                              cx="60"
                              cy="15"
                              rx="30"
                              ry="20"
                              fill="#B85C38"
                            />
                            <ellipse
                              cx="60"
                              cy="5"
                              rx="20"
                              ry="12"
                              fill="#B85C38"
                            />
                            <circle cx="75" cy="8" r="12" fill="#B85C38" />
                            {/* Face */}
                            <circle cx="48" cy="30" r="3" fill="#393939" />
                            <circle cx="72" cy="30" r="3" fill="#393939" />
                            <path
                              d="M52 40 Q60 48 68 40"
                              stroke="#393939"
                              strokeWidth="2"
                              fill="none"
                            />
                            {/* Torso */}
                            <rect
                              x="30"
                              y="55"
                              width="60"
                              height="50"
                              rx="4"
                              fill="#4A90A4"
                            />
                            {/* Stripes on shirt */}
                            <rect
                              x="30"
                              y="65"
                              width="60"
                              height="6"
                              fill="#6BA8BC"
                            />
                            <rect
                              x="30"
                              y="77"
                              width="60"
                              height="6"
                              fill="#6BA8BC"
                            />
                            <rect
                              x="30"
                              y="89"
                              width="60"
                              height="6"
                              fill="#6BA8BC"
                            />
                            {/* Arms */}
                            <rect
                              x="10"
                              y="55"
                              width="18"
                              height="45"
                              rx="4"
                              fill="#F5D0C5"
                            />
                            <rect
                              x="92"
                              y="55"
                              width="18"
                              height="45"
                              rx="4"
                              fill="#F5D0C5"
                            />
                            {/* Legs */}
                            <rect
                              x="32"
                              y="108"
                              width="25"
                              height="70"
                              rx="4"
                              fill="#8B4513"
                            />
                            <rect
                              x="63"
                              y="108"
                              width="25"
                              height="70"
                              rx="4"
                              fill="#8B4513"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Items Grid with Pagination */}
                  <div className="flex-1">
                    <div className="relative">
                      {/* Items Grid (4x2 = 8 items) */}
                      <div className="grid grid-cols-4 gap-2">
                        {visibleWearingItems.map((item) => (
                          <div key={item.id} className="cursor-pointer group">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls - Dots */}
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {Array.from({
                          length: Math.ceil(
                            currentlyWearing.length / itemsPerPage,
                          ),
                        }).map((_, index) => (
                          <button
                            key={index}
                            onClick={() =>
                              setCurrentWearingIndex(index * itemsPerPage)
                            }
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              Math.floor(currentWearingIndex / itemsPerPage) ===
                              index
                                ? "bg-gray-900 dark:bg-gray-100"
                                : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Friends */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Friends (7)
                  </h2>
                  <Link
                    href="/connect"
                    className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline"
                  >
                    See All
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex gap-6">
                  {friends.map((connection) => (
                    <Link
                      key={connection.id}
                      href={`/profile/${connection.username}`}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                          <Image
                            src={connection.avatar}
                            alt={connection.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        {/* Status Dot - 50% overlap like main profile */}
                        {connection.status &&
                          connection.status !== "offline" && (
                            <div
                              className={`absolute w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                                connection.status === "online-game"
                                  ? "bg-green-500"
                                  : connection.status === "online"
                                    ? "bg-blue-500"
                                    : connection.status === "studio"
                                      ? "bg-orange-500"
                                      : "bg-gray-400"
                              }`}
                              style={{ bottom: "-2px", right: "-2px" }}
                            />
                          )}
                      </div>
                      <p className="mt-2 text-xs text-gray-900 dark:text-gray-100">
                        {connection.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Groups */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Groups
                  </h2>
                  <div className="flex items-center gap-1">
                    {/* View mode toggle - List/Carousel View */}
                    <button
                      onClick={() => setGroupsViewMode("carousel")}
                      className={`p-2 rounded transition-colors ${
                        groupsViewMode === "carousel"
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    {/* Grid View */}
                    <button
                      onClick={() => setGroupsViewMode("grid")}
                      className={`p-2 rounded transition-colors ${
                        groupsViewMode === "grid"
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Carousel View - BIG with game thumbnail */}
                {groupsViewMode === "carousel" && (
                  <div className="relative bg-gray-50 dark:bg-gray-800/30 rounded-lg p-6">
                    {/* Left Arrow */}
                    {showPrevGroup && (
                      <button
                        onClick={handlePrevGroup}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}

                    {/* Group Card - ONE at a time, BIG */}
                    <div className="flex items-start gap-6">
                      {visibleGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-start gap-6 w-full"
                        >
                          {/* Large Game Thumbnail */}
                          <div className="w-64 h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 relative">
                            <Image
                              src={group.image}
                              alt={group.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Group Info */}
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                              {group.name}
                              {group.verified && (
                                <svg
                                  className="w-5 h-5 text-blue-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </h3>

                            <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
                              😊 Welcome to our group!
                            </p>

                            <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
                              🎮 Join our group to support us!
                            </p>

                            <div className="grid grid-cols-2 gap-6 mt-6">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  Members
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                  {group.members}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  Rank
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                  👑 {group.rank}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right Arrow */}
                    {showNextGroup && (
                      <button
                        onClick={handleNextGroup}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                  </div>
                )}

                {/* Grid View - SMALL cards showing ALL groups */}
                {groupsViewMode === "grid" && (
                  <div className="grid grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="block"
                      >
                        <div className="rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                          {/* Small square icon */}
                          <div className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-lg relative">
                            <Image
                              src={group.image}
                              alt={group.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="pt-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1 truncate">
                              {group.name}
                              {group.verified && (
                                <svg
                                  className="w-3 h-3 text-blue-500 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {group.members} Members
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              👑 {group.rank}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Favorites */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Favorites
                  </h2>
                  <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">
                    Favorites
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-4">
                  {favorites.map((game) => (
                    <div
                      key={game.id}
                      className="w-[200px] cursor-pointer group"
                    >
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          Game Thumbnail
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                        {game.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{game.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{game.plays}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roblox Badges */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    AdventureBlox Badges
                  </h2>
                  <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">
                    See All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-4">
                  {robloxBadges.map((badge) => (
                    <div key={badge.id} className="cursor-pointer group">
                      <div className="w-[120px] aspect-square rounded-lg overflow-hidden bg-gradient-to-b from-blue-500 to-blue-600 border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-2xl font-bold">1 YR+</div>
                          <svg
                            className="w-10 h-10 mx-auto mt-1"
                            viewBox="0 0 40 40"
                            fill="none"
                          >
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              fill="#1a73e8"
                              stroke="white"
                              strokeWidth="2"
                            />
                            <path
                              d="M20 8 L20 32 M8 20 L32 20"
                              stroke="white"
                              strokeWidth="3"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-900 dark:text-gray-100 text-center">
                        {badge.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Badges
                  </h2>
                  <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">
                    See All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-4">
                  {badges.map((badge) => (
                    <div key={badge.id} className="cursor-pointer group">
                      <div className="w-[120px] aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors relative">
                        {badge.image ? (
                          <Image
                            src={badge.image}
                            alt={badge.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-900 dark:text-gray-100 text-center truncate">
                        {badge.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className="py-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Statistics
                </h2>
                <div className="flex justify-between items-start">
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Join Date
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      7/15/2022
                    </p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Last Online
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Now
                    </p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Place Visits
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      31
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Experiences
                </h2>
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >
                    <Monitor className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >
                    <LayoutGrid className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                  </button>
                </div>
              </div>

              {viewMode === "list" ? (
                <div className="space-y-6">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                    >
                      <div className="w-[280px] h-[180px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div className="w-full h-full bg-gradient-to-b from-blue-200 to-green-200 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            ADVENTUREBLOX
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 py-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {exp.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {exp.description}
                        </p>
                        <div className="flex gap-12 mt-8">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Active
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {exp.active}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Visits
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {exp.visits}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="cursor-pointer group">
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                        <div className="w-full h-full bg-gradient-to-b from-blue-200 to-green-200 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                            ADVENTUREBLOX
                          </span>
                        </div>
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                        {exp.title}
                      </h3>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => {
              setShowEditProfileModal(false);
                setEditedDisplayName(displayName);
                setEditedUsername(username.replace("@", ""));
                setEditedStatusMessage(statusMessage);
              }}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Edit Profile
            </h2>

            {/* Display Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={editedDisplayName}
                onChange={(e) => setEditedDisplayName(e.target.value)}
                maxLength={20}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editedDisplayName.length}/20
              </div>
            </div>

            {/* Username Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-500 dark:text-gray-400 font-medium select-none pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  maxLength={20}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 pl-8 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username"
                />
              </div>
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editedUsername.length}/20
              </div>
            </div>

            {/* Status Message Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status Message
              </label>
              <input
                type="text"
                value={editedStatusMessage}
                onChange={(e) => setEditedStatusMessage(e.target.value)}
                maxLength={50}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What's on your mind?"
              />
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editedStatusMessage.length}/50
              </div>
            </div>

            {/* Error Message */}
            {saveError && (
              <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">
                {saveError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditProfileModal(false);
                  setEditedDisplayName(displayName);
                  setEditedUsername(username.replace("@", ""));
                  setEditedStatusMessage(statusMessage);
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
