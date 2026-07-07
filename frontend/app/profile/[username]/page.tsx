"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Monitor,
  LayoutGrid,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import VerifiedBadge from "../../components/VerifiedBadge";
import UserAvatar from "../../components/UserAvatar";
import { usersApi, friendsApi, groupsApi, storage } from "@/lib/api";
import { openChatWithUser } from "@/app/components/ChatWidget";
import { useParams, useRouter } from "next/navigation";
import { useUserPresence } from "@/hooks/useUserPresence";
import { supabase } from "@/lib/supabase";

const RobloxAvatar3D = dynamic(() => import("../../components/RobloxAvatar3D"), {
  ssr: false,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface UserProfile {
  id?: string;
  username: string;
  display_name?: string;
  bio?: string;
  status_message?: string;
  is_verified?: boolean;
}

interface AvatarStateData {
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
}


function ProfileHeadshot({ userId, username }: { userId: string; username: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/avatar/render/${userId}`)
      .then(r => r.json())
      .then(data => { if (data.imageUrl) setImageUrl(data.imageUrl); })
      .catch(() => {});
  }, [userId]);

  const initials = (username || "?")[0].toUpperCase();

  if (!imageUrl) {
    return (
      <div className="w-36 h-36 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border-2 border-gray-200 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-300 font-bold text-4xl">{initials}</span>
      </div>
    );
  }

  return (
    <div className="w-36 h-36 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
      <img
        src={imageUrl}
        alt={username}
        className="w-full object-cover object-top"
        style={{ height: '240%', marginTop: '-15%' }}
      />
    </div>
  );
}

const ProfilePage = () => {
  const params = useParams();
  const profileUsername = params?.username as string;
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const [currentWearingIndex, setCurrentWearingIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const menuRef = useRef<HTMLDivElement>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedUsername, setEditedUsername] = useState("");
  const [statusMessage, setStatusMessage] = useState("Playing with AdventureBlox Studio 2.0");
  const [editedStatusMessage, setEditedStatusMessage] = useState("Playing with AdventureBlox Studio 2.0");
  const [showAdvertisement, setShowAdvertisement] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showLeftAd, setShowLeftAd] = useState(true);
  const [showRightAd, setShowRightAd] = useState(true);

  // Avatar state
  const [avatarState, setAvatarState] = useState<AvatarStateData | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);

  const [relationship, setRelationship] = useState<{
    isFriend: boolean;
    friendRequestStatus: 'sent' | 'received' | null;
    isFollowing: boolean;
    isBestFriend: boolean;
    isBlocked: boolean;
  } | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const realtimePresence = useUserPresence(profileUser?.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, currentUserResponse] = await Promise.all([
          usersApi.getUserByUsername(profileUsername),
          usersApi.getCurrentUser(),
        ]);

        let viewedUser: any = null;
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data as any;
          viewedUser = profileData.user;
        }

        let currentUserData: any = null;
        if (currentUserResponse.success && currentUserResponse.data) {
          currentUserData = currentUserResponse.data.user as any;
          setCurrentUser(currentUserData);
        }

        const isOwn = !!(currentUserData && currentUserData.username === profileUsername);
        setIsOwnProfile(isOwn);

        if (isOwn && currentUserData) {
          setProfileUser(currentUserData);
          setDisplayName(currentUserData.display_name || currentUserData.username);
          setUsername(currentUserData.username);
          setEditedDisplayName(currentUserData.display_name || currentUserData.username);
          setEditedUsername(currentUserData.username);
          setBio(currentUserData.bio || "");
          setEditedBio(currentUserData.bio || "");
          if (currentUserData.status_message) {
            setStatusMessage(currentUserData.status_message);
            setEditedStatusMessage(currentUserData.status_message);
          }
          setUserGender(currentUserData.gender || null);
          setRelationship(null);
        } else if (viewedUser) {
          if (viewedUser?.user_number && !/^\d+$/.test(profileUsername)) {
            router.replace(`/profile/${viewedUser.user_number}`);
          }
          setProfileUser(viewedUser);
          setDisplayName(viewedUser.display_name || viewedUser.username);
          setUsername(viewedUser.username);
          setBio(viewedUser.bio || "");
          if (viewedUser.status_message) {
            setStatusMessage(viewedUser.status_message);
          }
          setUserGender(viewedUser.gender || null);

          if (currentUserData && viewedUser.id) {
            try {
              const relResponse = await usersApi.getRelationship(viewedUser.id);
              if (relResponse.success && relResponse.data) {
                setRelationship(relResponse.data as any);
              } else {
                setRelationship({ isFriend: false, friendRequestStatus: null, isFollowing: false, isBestFriend: false, isBlocked: false });
              }
            } catch { /* ignore */ }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (profileUsername) {
      fetchData();
    }
  }, [profileUsername]);

  // Fetch avatar state (own profile only — for Currently Wearing panel)
  useEffect(() => {
    const fetchAvatarState = async () => {
      setAvatarLoading(true);
      try {
        if (isOwnProfile) {
          const token = storage.getAccessToken();
          if (!token) { setAvatarLoading(false); return; }
          const res = await fetch(`${API_BASE}/avatar`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && data.data?.avatarState) {
            const state = data.data.avatarState;
            setAvatarState(state);
            const assetIds = [
              state.hair_asset_id, state.face_asset_id, state.head_asset_id,
              state.hat_asset_id, state.body_asset_id, state.shirt_asset_id,
              state.pants_asset_id, state.accessory_asset_id,
            ].filter(Boolean).map((id: string) => parseInt(id));
            if (assetIds.length > 0) {
              fetch(`${API_BASE}/avatar/render-custom`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ assetIds }),
              }).then(r => r.json()).then(d => {
                if (d.success && d.imageUrl) setCustomAvatarUrl(d.imageUrl);
              }).catch(() => {});
            }
          }
        } else if (profileUser?.id) {
          const res = await fetch(`${API_BASE}/avatar/public/${profileUser.id}`);
          const data = await res.json();
          if (data.success && data.data?.avatarState) {
            const state = data.data.avatarState;
            setAvatarState(state);
            const assetIds = [
              state.hair_asset_id, state.face_asset_id, state.head_asset_id,
              state.hat_asset_id, state.body_asset_id, state.shirt_asset_id,
              state.pants_asset_id, state.accessory_asset_id,
            ].filter(Boolean).map((id: string) => parseInt(id));
            if (assetIds.length > 0) {
              const token = storage.getAccessToken();
              if (token) {
                fetch(`${API_BASE}/avatar/render-custom`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ assetIds }),
                }).then(r => r.json()).then(d => {
                  if (d.success && d.imageUrl) setCustomAvatarUrl(d.imageUrl);
                }).catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch avatar state:", err);
      } finally {
        setAvatarLoading(false);
      }
    };

    if (profileUser?.id) {
      fetchAvatarState();
    }
  }, [profileUser?.id, isOwnProfile]);

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
  const favorites: any[] = [];

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profileUser?.id) return;
      try {
        const friendsResponse = isOwnProfile
          ? await friendsApi.getFriends()
          : await friendsApi.getUserFriends(profileUser.id);
        if (friendsResponse.success && friendsResponse.data) {
          const realFriends = (friendsResponse.data.friends || []).map((friend: any) => ({
            id: friend.id,
            name: friend.display_name || friend.username,
            username: friend.username,
            status: "offline",
          }));
          setFriends(realFriends);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();

    if (!profileUser?.id || isOwnProfile) return;

    const channel = supabase
      .channel('profile-friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `userId=eq.${profileUser.id}` }, () => { fetchFriends(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileUser?.id, isOwnProfile]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!profileUser?.id) return;
      setLoadingGroups(true);
      try {
        const response = isOwnProfile
          ? await groupsApi.getUserGroups()
          : await groupsApi.getGroupsForUser(profileUser.id);
        if (response.success && response.data) {
          const rawGroups = response.data.groups || [];
          const userGroups = await Promise.all(rawGroups.map(async (group: any) => {
            try {
              const detailRes = await groupsApi.getGroupById(group.id);
              const realCount = detailRes.success ? (detailRes.data?.group as any)?.member_count : group.member_count;
              return {
                id: group.id,
                name: group.name,
                description: group.description || '',
                image: group.icon_url || `https://robohash.org/${group.name}?set=set3`,
                members: (realCount ?? group.member_count)?.toLocaleString() || '0',
                rank: group.role || 'Member',
                verified: group.is_verified || false,
                isPrimary: group.id === profileUser?.primary_group_id,
              };
            } catch {
              return {
                id: group.id,
                name: group.name,
                description: group.description || '',
                image: group.icon_url || `https://robohash.org/${group.name}?set=set3`,
                members: group.member_count?.toLocaleString() || '0',
                rank: group.role || 'Member',
                verified: group.is_verified || false,
                isPrimary: false,
              };
            }
          }));
          userGroups.sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
          setGroups(userGroups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();

    const refetchRelationship = async () => {
      if (!profileUser?.id || isOwnProfile) return;
      try {
        const relationshipResponse = await usersApi.getRelationship(profileUser.id);
        if (relationshipResponse.success && relationshipResponse.data) {
          setRelationship(relationshipResponse.data as any);
        }
      } catch (error) {
        console.error('Error refetching relationship:', error);
      }
    };

    if (!profileUser?.id) return;

    const groupsChannel = supabase
      .channel('profile-groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `userId=eq.${profileUser.id}` }, () => { fetchGroups(); })
      .subscribe();

    const friendshipsChannel = supabase
      .channel('profile-relationship-friendships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => { refetchRelationship(); })
      .subscribe();

    const requestsChannel = supabase
      .channel('profile-relationship-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => { refetchRelationship(); })
      .subscribe();

    return () => {
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(friendshipsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [profileUser?.id, isOwnProfile]);

  useEffect(() => {
    if (!profileUser?.id) return;
    const channel = supabase
      .channel('profile-bio-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${profileUser.id}` },
        (payload: any) => {
          if (payload.new && 'bio' in payload.new) {
            setBio(payload.new.bio || '');
            if (!isEditingBio) setEditedBio(payload.new.bio || '');
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileUser?.id, isEditingBio]);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      if (!profileUser?.id) return;
      try {
        const response = await usersApi.getUserSocialLinks(profileUser.id);
        if (response.success && response.data) {
          setSocialLinks(response.data.socialLinks || []);
        }
      } catch (error) {
        console.error('Error fetching social links:', error);
      }
    };

    fetchSocialLinks();

    if (!profileUser?.id) return;

    const channel = supabase
      .channel('profile-social-links-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_social_links', filter: `userId=eq.${profileUser.id}` }, () => { fetchSocialLinks(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileUser?.id]);

  const [groupsViewMode, setGroupsViewMode] = useState<"carousel" | "grid">("carousel");
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const groupsPerPage = 3;
  const maxGroupIndex = Math.max(0, groups.length - groupsPerPage);

  const robloxBadges: any[] = [];
  const badges: any[] = [];

  const experiences = [
    {
      id: "1",
      title: `${displayName || "User"}'s Place`,
      description: "This is your very first AdventureBlox creation. Check it out, then make it your own with AdventureBlox Studio!",
      imageUrl: "",
      active: 0,
      visits: 0,
    },
  ];

  const currentlyWearing = avatarState
    ? [
        avatarState.hat_thumbnail && { id: "hat", thumb: avatarState.hat_thumbnail },
        avatarState.hair_thumbnail && { id: "hair", thumb: avatarState.hair_thumbnail },
        avatarState.face_thumbnail && { id: "face", thumb: avatarState.face_thumbnail },
        avatarState.head_thumbnail && { id: "head", thumb: avatarState.head_thumbnail },
        avatarState.shirt_thumbnail && { id: "shirt", thumb: avatarState.shirt_thumbnail },
        avatarState.pants_thumbnail && { id: "pants", thumb: avatarState.pants_thumbnail },
        avatarState.body_thumbnail && { id: "body", thumb: avatarState.body_thumbnail },
        avatarState.accessory_thumbnail && { id: "accessory", thumb: avatarState.accessory_thumbnail },
      ].filter(Boolean) as { id: string; thumb: string }[]
    : [];

  const itemsPerPage = 8;
  const visibleWearingItems = currentlyWearing.slice(currentWearingIndex, currentWearingIndex + itemsPerPage);

  const handleEditBio = () => { setEditedBio(bio); setIsEditingBio(true); };
  const handleCancelBio = () => { setEditedBio(bio); setIsEditingBio(false); };

  const handleSaveBio = async () => {
    try {
      const response = await usersApi.updateProfile({ bio: editedBio });
      if (response.success) { setBio(editedBio); setIsEditingBio(false); }
      else { alert("Failed to save bio. Please try again."); }
    } catch (error) { alert("An error occurred while saving bio."); }
  };

  const handleFollowToggle = async () => {
    if (!profileUser?.id) return;
    setIsLoadingAction(true);
    try {
      if (relationship?.isFollowing) {
        const response = await usersApi.unfollowUser(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isFollowing: false } : null);
      } else {
        const response = await usersApi.followUser(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isFollowing: true } : null);
      }
    } catch (error) { console.error('Follow toggle error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleSendFriendRequest = async () => {
    if (!profileUser?.id) return;
    setIsLoadingAction(true);
    try {
      const response = await friendsApi.sendFriendRequest(profileUser.id);
      if (response.success) setRelationship(prev => prev ? { ...prev, friendRequestStatus: 'sent' } : null);
    } catch (error) { console.error('Send friend request error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleUnfriend = async () => {
    if (!profileUser?.id || !window.confirm('Are you sure you want to unfriend this user?')) return;
    setIsLoadingAction(true);
    try {
      const response = await friendsApi.removeFriend(profileUser.id);
      if (response.success) setRelationship(prev => prev ? { ...prev, isFriend: false, isBestFriend: false } : null);
    } catch (error) { console.error('Unfriend error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleBestFriendToggle = async () => {
    if (!profileUser?.id) return;
    setIsLoadingAction(true);
    try {
      if (relationship?.isBestFriend) {
        const response = await friendsApi.removeBestFriend(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isBestFriend: false } : null);
      } else {
        const response = await friendsApi.addBestFriend(profileUser.id);
        if (response.success) setRelationship(prev => prev ? { ...prev, isBestFriend: true } : null);
      }
    } catch (error) { console.error('Best friend toggle error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleBlockUser = async () => {
    if (!profileUser?.id || !window.confirm('Are you sure you want to block this user?')) return;
    setIsLoadingAction(true);
    try {
      const response = await friendsApi.blockUser(profileUser.id);
      if (response.success) setRelationship(prev => prev ? { ...prev, isBlocked: true, isFriend: false } : null);
    } catch (error) { console.error('Block user error:', error); }
    finally { setIsLoadingAction(false); }
  };

  const handleReportAbuse = () => { alert('Report abuse functionality coming soon'); setShowProfileMenu(false); };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatLastOnline = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const getPresenceStatus = (): { color: string; hasIcon: boolean; label: string } | null => {
    const status = realtimePresence?.presenceStatus || profileUser?.presence_status || 'offline';
    const lastOnline = realtimePresence?.lastOnline || profileUser?.last_online;
    const currentGame = realtimePresence?.currentGame || profileUser?.current_game;
    const isRecentlyActive = lastOnline && (new Date().getTime() - new Date(lastOnline).getTime()) < 5 * 60 * 1000;
    if ((status === 'online' || status === 'in-game') && isRecentlyActive) {
      if (status === 'in-game') return { color: 'bg-green-500', hasIcon: true, label: currentGame ? `Playing ${currentGame}` : 'In Game' };
      return { color: 'bg-blue-500', hasIcon: false, label: 'Online' };
    }
    return null;
  };

  const handleSaveProfile = async () => {
    setSaveError("");
    setIsSavingProfile(true);
    try {
      const displayNameChanged = editedDisplayName !== displayName;
      const usernameChanged = editedUsername !== username;
      const statusMessageChanged = editedStatusMessage !== statusMessage;

      if (!displayNameChanged && !usernameChanged && !statusMessageChanged) {
        setShowEditProfileModal(false); setIsSavingProfile(false); return;
      }

      if (displayNameChanged) {
        if (!editedDisplayName.trim()) { setSaveError("Display name cannot be empty"); setIsSavingProfile(false); return; }
        if (editedDisplayName.length < 3 || editedDisplayName.length > 50) { setSaveError("Display name must be between 3 and 50 characters"); setIsSavingProfile(false); return; }
      }

      if (usernameChanged) {
        if (!editedUsername.trim()) { setSaveError("Username cannot be empty"); setIsSavingProfile(false); return; }
        if (editedUsername.length < 3 || editedUsername.length > 20) { setSaveError("Username must be between 3 and 20 characters"); setIsSavingProfile(false); return; }
        if (!/^[a-zA-Z0-9_]+$/.test(editedUsername)) { setSaveError("Username can only contain letters, numbers, and underscores"); setIsSavingProfile(false); return; }
      }

      const updateData: any = {};
      if (displayNameChanged) updateData.displayName = editedDisplayName;
      if (usernameChanged) updateData.username = editedUsername;
      if (statusMessageChanged) updateData.statusMessage = editedStatusMessage;

      const response = await usersApi.updateProfile(updateData);

      if (response.success) {
        if (displayNameChanged) setDisplayName(editedDisplayName);
        if (usernameChanged) setUsername(editedUsername);
        if (statusMessageChanged) setStatusMessage(editedStatusMessage);
        setShowEditProfileModal(false);

        const userResponse = await usersApi.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          const refreshedUser = userResponse.data.user as UserProfile;
          setProfileUser(refreshedUser);
          setDisplayName(refreshedUser.display_name || refreshedUser.username);
          setUsername(refreshedUser.username);
          setStatusMessage(refreshedUser.status_message || "");
        }
      } else {
        setSaveError(response.message || "Failed to update profile");
      }
    } catch (error) {
      setSaveError("An error occurred. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const hasRobloxLinked = !!avatarState?.roblox_user_id;
  const avatarBadge = hasRobloxLinked ? "Roblox" : customAvatarUrl ? "R15" : "2D";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <div className="flex justify-center gap-4 px-4">
        {showLeftAd && (
          <div className="hidden xl:block flex-shrink-0 pt-[130px]">
            <div className="relative w-[160px]">
              <button onClick={() => setShowLeftAd(false)} className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10" aria-label="Close ad">×</button>
              <div className="w-[160px] h-[600px] bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                <span className="text-center px-2">Advertisement</span>
                <span className="text-center px-2 mt-2 text-xs">(160 x 600)</span>
              </div>
              <div className="mt-1 text-center"><span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Advertisement</span></div>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-[900px]">
          {showAdvertisement && (
            <div className="flex justify-center py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="w-full relative">
                <button onClick={() => setShowAdvertisement(false)} className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10" aria-label="Close ad">×</button>
                <div className="w-full h-[90px] bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                  Advertisement Banner (728 x 90)
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Advertisement</span>
                  <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline">Report</button>
                </div>
              </div>
            </div>
          )}

          <div className="px-4">
            {/* Profile Header */}
            <div className="flex items-start gap-6 py-6 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                {/* Profile pic — always R15 via UserAvatar */}
                <ProfileHeadshot userId={profileUser?.id || ""} username={displayName || username} />
                {getPresenceStatus() && (
                  <div
                    className={`absolute w-7 h-7 ${getPresenceStatus()?.color} rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900`}
                    style={{ bottom: "-3.5px", right: "-3.5px" }}
                    title={getPresenceStatus()?.label}
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {displayName || "User"}
                      {profileUser?.is_verified && <VerifiedBadge size="md" />}
                      {profileUser?.is_studio && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full border border-orange-200 dark:border-orange-800">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                          Studio
                        </span>
                      )}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{username || "user"}</p>
                    {statusMessage && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{statusMessage}"</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {profileUser && (
                      <>
                        {isOwnProfile ? (
                          <>
                            <button onClick={() => setShowEditProfileModal(true)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors">Edit Profile</button>
                            <Link href="/avatar"><button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors">Edit Avatar</button></Link>
                          </>
                        ) : (
                          <>
                            {relationship?.isFriend ? (
                              <>
                                <button onClick={() => openChatWithUser(profileUser.id, profileUser.username, profileUser.display_name, profileUser.avatar_url)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors">Message</button>
                                <button onClick={handleUnfriend} disabled={isLoadingAction} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors disabled:opacity-50">Unfriend</button>
                              </>
                            ) : relationship?.friendRequestStatus === 'sent' ? (
                              <button disabled className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg text-sm cursor-not-allowed">Request Sent</button>
                            ) : relationship?.friendRequestStatus === 'received' ? (
                              <button onClick={handleSendFriendRequest} disabled={isLoadingAction} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors">Accept Friend Request</button>
                            ) : (
                              <button onClick={handleSendFriendRequest} disabled={isLoadingAction} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50">Add Friend</button>
                            )}
                          </>
                        )}
                      </>
                    )}

                    <div className="relative" ref={menuRef}>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                          {isOwnProfile ? (
                            <>
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowProfileMenu(false)}>Inventory</button>
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowProfileMenu(false)}>Favorites</button>
                            </>
                          ) : (
                            <>
                              {relationship?.isFriend && (
                                <>
                                  <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { handleBestFriendToggle(); setShowProfileMenu(false); }}>
                                    {relationship?.isBestFriend ? 'Remove Best Friend' : 'Make Best Friend'}
                                  </button>
                                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                </>
                              )}
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { handleFollowToggle(); setShowProfileMenu(false); }}>
                                {relationship?.isFollowing ? 'Unfollow' : 'Follow'}
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                              <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { handleBlockUser(); setShowProfileMenu(false); }}>Block User</button>
                              <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleReportAbuse}>Report Abuse</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-3">
                  <Link href="/friends" className="flex items-center gap-1 hover:underline">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{friends.length}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Friends</span>
                  </Link>
                  <Link href="/friends?tab=Followers" className="flex items-center gap-1 hover:underline">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{profileUser?.follower_count || 0}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Follower{profileUser?.follower_count !== 1 ? 's' : ''}</span>
                  </Link>
                  <Link href="/friends?tab=Following" className="flex items-center gap-1 hover:underline">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{profileUser?.following_count || 0}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Following</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "About" ? (
              <div>
                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">About</h2>
                      {isOwnProfile && !isEditingBio && (
                        <button onClick={handleEditBio} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                    {socialLinks.length > 0 && (
                      <div className="flex items-center gap-3">
                        {socialLinks.map((link) => (
                          <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title={link.platform}>
                            <img src={
  link.platform === 'youtube' ? 'https://www.youtube.com/favicon.ico' :
  link.platform === 'twitter' ? 'https://abs.twimg.com/favicons/twitter.3.ico' :
  link.platform === 'twitch' ? 'https://www.twitch.tv/favicon.ico' :
  link.platform === 'kick' ? 'https://kick.com/favicon.ico' :
  link.platform === 'instagram' ? 'https://cdn.cdnlogo.com/logos/i/92/instagram.svg' :
  link.platform === 'tiktok' ? 'https://www.tiktok.com/favicon.ico' :
  `https://www.google.com/s2/favicons?domain=${link.url}&sz=24`
} className="w-6 h-6 rounded" alt={link.platform} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {isEditingBio ? (
                    <div>
                      <textarea value={editedBio} onChange={(e) => setEditedBio(e.target.value.slice(0, 1000))} placeholder="Tell the AdventureBlox community about what you like to make, build, and explore..." className="w-full h-24 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600" />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Keep yourself safe, do not share personal details online.</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{editedBio.length}/1000</p>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button onClick={handleCancelBio} className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">Cancel</button>
                        <button onClick={handleSaveBio} className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">Save</button>
                      </div>
                    </div>
                  ) : bio ? (
                    <p className="text-sm text-gray-900 dark:text-gray-100">{bio}</p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No bio yet</p>
                  )}
                </div>

                {/* Currently Wearing */}
                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Currently Wearing</h2>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 w-80 overflow-hidden" style={{ minHeight: 260 }}>
                        <div className="absolute top-3 right-3 z-20">
                          {(avatarBadge === "2D" || avatarBadge === "Roblox") && (
                          <span className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600">
                            {avatarBadge === "Roblox" ? "3D" : "2D"}
                          </span>
                        )}
                        </div>

                        {avatarLoading ? (
                          <div className="flex items-center justify-center h-48 mt-6">
                            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : hasRobloxLinked && isOwnProfile ? (
                          <div className="relative h-48 mt-6">
                            <RobloxAvatar3D robloxUserId={avatarState!.roblox_user_id!} />
                          </div>
                        ) : customAvatarUrl ? (
                          <div className="flex justify-center items-center h-48 mt-6">
                            <img src={customAvatarUrl} alt="Avatar" className="h-full object-contain" />
                          </div>
                        ) : (
                          <div className="flex justify-center items-center h-48 mt-6">
                            <UserAvatar userId={profileUser?.id || ""} username={displayName || username} size={160} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-4 gap-2">
                        {visibleWearingItems.length > 0 ? (
                          visibleWearingItems.map((item) => (
                            <div key={item.id} className="cursor-pointer group">
                              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                                <img src={item.thumb} alt={item.id} className="w-full h-full object-contain p-1" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 col-span-4">No items equipped yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Friends section */}
                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Friends ({friends.length})</h2>
                    <Link href={isOwnProfile ? "/friends" : `/friends?userId=${profileUser?.id}`} className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">See All<ChevronRight className="w-4 h-4" /></Link>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {friends.map((connection) => (
                      <Link key={connection.id} href={`/profile/${connection.username}`} className="flex flex-col items-center cursor-pointer group">
                        <div className="relative">
                          <UserAvatar userId={connection.id} username={connection.name} size={80} />
                          {connection.status && connection.status !== "offline" && (
                            <div className={`absolute w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${connection.status === "online-game" ? "bg-green-500" : connection.status === "online" ? "bg-blue-500" : connection.status === "studio" ? "bg-orange-500" : "bg-gray-400"}`} style={{ bottom: "-2px", right: "-2px" }} />
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-900 dark:text-gray-100">{connection.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {!loadingGroups && groups.length > 0 && (
                  <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Groups</h2>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setGroupsViewMode("carousel")} className={`p-2 rounded transition-colors ${groupsViewMode === "carousel" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
                        <button onClick={() => setGroupsViewMode("grid")} className={`p-2 rounded transition-colors ${groupsViewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
                      </div>
                    </div>

                    {groupsViewMode === "carousel" && groups.length > 0 && (
                      <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                        <div className="flex h-[260px]">
                          {currentGroupIndex > 0 && (
                            <button onClick={(e) => { e.preventDefault(); setCurrentGroupIndex(Math.max(0, currentGroupIndex - 1)); }} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors shadow">
                              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                          )}
                          <Link href={`/groups/${groups[currentGroupIndex]?.id}`} className="w-[260px] h-full flex-shrink-0 bg-blue-500 dark:bg-gray-700 relative block">
                            <Image src={groups[currentGroupIndex]?.image || `https://robohash.org/${groups[currentGroupIndex]?.name}?set=set3`} alt={groups[currentGroupIndex]?.name || ""} fill className="object-cover" sizes="180px" />
                          </Link>
                          <Link href={`/groups/${groups[currentGroupIndex]?.id}`} className="flex-1 p-6 flex flex-col justify-between block">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 flex items-center gap-2">
  {groups[currentGroupIndex]?.name}
  {groups[currentGroupIndex]?.verified && (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1D9BF0"/>
      <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )}
</h3>
                              <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-3" />
                              {groups[currentGroupIndex]?.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{groups[currentGroupIndex]?.description}</p>
                              )}
                            </div>
                            <div className="flex gap-10">
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Members</p>
                                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{groups[currentGroupIndex]?.members?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Rank</p>
                                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{groups[currentGroupIndex]?.rank || "Member"}</p>
                              </div>
                            </div>
                          </Link>
                          {currentGroupIndex < groups.length - 1 && (
                            <button onClick={(e) => { e.preventDefault(); setCurrentGroupIndex(Math.min(groups.length - 1, currentGroupIndex + 1)); }} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors shadow">
                              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {groupsViewMode === "grid" && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {groups.map((group) => (
                          <Link key={group.id} href={`/groups/${group.id}`} className="block group/card">
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-lg relative">
                              <Image src={group.image} alt={group.name} fill className="object-cover group-hover/card:opacity-90 transition-opacity" sizes="(max-width: 640px) 33vw, 25vw" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5 truncate flex items-center gap-1">
  {group.name}
  {group.verified && (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1D9BF0"/>
      <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )}
</h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{group.members} Members · {group.rank || "Member"}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Favorites</h2>
                    <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">Favorites<ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No favorite games yet.</p>
                </div>

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">AdventureBlox Badges</h2>
                    <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">See All<ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No badges earned yet.</p>
                </div>

                <div className="py-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Badges</h2>
                    <button className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 hover:underline">See All<ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No player badges yet.</p>
                </div>

                <div className="py-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Statistics</h2>
                  <div className="flex justify-between items-start">
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Join Date</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatDate(profileUser?.created_at)}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Online</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {(() => {
                          const lastOnline = realtimePresence?.lastOnline || profileUser?.last_online;
                          const status = realtimePresence?.presenceStatus || profileUser?.presence_status;
                          const isRecentlyActive = lastOnline && (new Date().getTime() - new Date(lastOnline).getTime()) < 5 * 60 * 1000;
                          if ((status === 'online' || status === 'in-game') && isRecentlyActive) return 'Now';
                          return formatLastOnline(lastOnline);
                        })()}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Place Visits</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{profileUser?.place_visits || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Experiences</h2>
                  <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><Monitor className="w-4 h-4 text-gray-900 dark:text-gray-100" /></button>
                    <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><LayoutGrid className="w-4 h-4 text-gray-900 dark:text-gray-100" /></button>
                  </div>
                </div>
                {viewMode === "list" ? (
                  <div className="space-y-6">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="flex gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer">
                        <div className="w-[280px] h-[180px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <div className="w-full h-full bg-gradient-to-b from-blue-200 to-green-200 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">ADVENTUREBLOX</span>
                          </div>
                        </div>
                        <div className="flex-1 py-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{exp.title}</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{exp.description}</p>
                          <div className="flex gap-12 mt-8">
                            <div><p className="text-sm text-gray-600 dark:text-gray-400">Active</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{exp.active}</p></div>
                            <div><p className="text-sm text-gray-600 dark:text-gray-400">Visits</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{exp.visits}</p></div>
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
                            <span className="text-xl font-bold text-gray-700 dark:text-gray-300">ADVENTUREBLOX</span>
                          </div>
                        </div>
                        <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100">{exp.title}</h3>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {showRightAd && (
          <div className="hidden xl:block flex-shrink-0 pt-[130px]">
            <div className="relative w-[160px]">
              <button onClick={() => setShowRightAd(false)} className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-2xl font-bold leading-none z-10" aria-label="Close ad">×</button>
              <div className="w-[160px] h-[600px] bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300 dark:border-gray-600">
                <span className="text-center px-2">Advertisement</span>
                <span className="text-center px-2 mt-2 text-xs">(160 x 600)</span>
              </div>
              <div className="mt-1 text-center"><span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Advertisement</span></div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => { setShowEditProfileModal(false); setEditedDisplayName(displayName); setEditedUsername(username.replace("@", "")); setEditedStatusMessage(statusMessage); }} className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Profile</h2>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
              <input type="text" value={editedDisplayName} onChange={(e) => setEditedDisplayName(e.target.value)} maxLength={20} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">{editedDisplayName.length}/20</div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-500 dark:text-gray-400 font-medium select-none pointer-events-none">@</span>
                <input type="text" value={editedUsername} onChange={(e) => setEditedUsername(e.target.value)} maxLength={20} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 pl-8 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="username" />
              </div>
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">{editedUsername.length}/20</div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status Message</label>
              <input type="text" value={editedStatusMessage} onChange={(e) => setEditedStatusMessage(e.target.value)} maxLength={50} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="What's on your mind?" />
              <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">{editedStatusMessage.length}/50</div>
            </div>
            {saveError && <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">{saveError}</div>}
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => { setShowEditProfileModal(false); setEditedDisplayName(displayName); setEditedUsername(username.replace("@", "")); setEditedStatusMessage(statusMessage); }} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded transition-colors">Cancel</button>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingProfile ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
