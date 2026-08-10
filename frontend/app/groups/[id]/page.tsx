"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, Loader2, ImagePlus, X } from "lucide-react";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import GamesSection from "../../components/groups/GamesSection";
import MembersSection from "../../components/groups/MembersSection";
import SocialLinksSection from "../../components/groups/SocialLinksSection";
import DescriptionSection from "../../components/groups/DescriptionSection";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ReportModal from "@/components/modals/ReportModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { groupsApi, uploadApi, storage } from "@/lib/api";
import UserAvatar from "../../components/UserAvatar";

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
  role?: string;
  owner_username?: string;
  owner_display_name?: string;
  shout_text?: string;
  shout_image_url?: string;
  shout_posted_at?: string;
  shout_posted_by?: string;
  shout_posted_by_username?: string;
  shout_posted_by_avatar?: string;
  join_setting?: string;
  created_at?: string;
}

const groupSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const GroupDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [primaryGroupId, setPrimaryGroupId] = useState<string | null>(null);

  // Decode current user ID from JWT token
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

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [shoutText, setShoutText] = useState("");
  const [shoutImage, setShoutImage] = useState<File | null>(null);
  const [shoutImagePreview, setShoutImagePreview] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [searchMyGroups, setSearchMyGroups] = useState("");
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentGroupDetails, setCurrentGroupDetails] = useState<Group | null>(
    null,
  );
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [wallPosts, setWallPosts] = useState<
    Array<{
      id: string;
      content: string;
      image_url?: string;
      likes: number;
      reply_count: number;
      created_at: string;
      author_id: string;
      author_username: string;
      author_display_name?: string;
      author_is_verified: boolean;
      author_role?: string;
    }>
  >([]);
  const [loadingWallPosts, setLoadingWallPosts] = useState(true);
  const [postingWall, setPostingWall] = useState(false);
  const [wallPostError, setWallPostError] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [postingReply, setPostingReply] = useState<Record<string, boolean>>({});

  // Modal states
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [alliances, setAlliances] = useState<
    Array<{
      id: string;
      allied_group_id: string;
      allied_group_name: string;
      allied_group_icon?: string;
      allied_group_member_count: number;
      allied_group_verified: boolean;
    }>
  >([]);
  const [loadingAlliances, setLoadingAlliances] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
  });
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  // Store state
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [loadingStoreItems, setLoadingStoreItems] = useState(true);
  const [canManageGroupStore, setCanManageGroupStore] = useState(false);
  const [showAddStoreItemForm, setShowAddStoreItemForm] = useState(false);
  const [storeItemName, setStoreItemName] = useState("");
  const [storeItemDescription, setStoreItemDescription] = useState("");
  const [storeItemPrice, setStoreItemPrice] = useState("0");
  const [storeItemType, setStoreItemType] = useState("shirt");
  const [storeItemImage, setStoreItemImage] = useState<File | null>(null);
  const [storeItemImagePreview, setStoreItemImagePreview] = useState<string | null>(null);
  const [uploadingStoreItemImage, setUploadingStoreItemImage] = useState(false);
  const [creatingStoreItem, setCreatingStoreItem] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [buyMessage, setBuyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Application center state
  const [applicationForm, setApplicationForm] = useState<any>(null);
  const [loadingApplicationForm, setLoadingApplicationForm] = useState(true);
  const [canManageGroupMembers, setCanManageGroupMembers] = useState(false);
  const [applicationAnswers, setApplicationAnswers] = useState<string[]>([]);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [applicationSubmitError, setApplicationSubmitError] = useState<string | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [loadingPendingApplications, setLoadingPendingApplications] = useState(false);
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null);
  const [showApplicationSetup, setShowApplicationSetup] = useState(false);
  const [setupQuestions, setSetupQuestions] = useState<string[]>([""]);
  const [setupAutoRankId, setSetupAutoRankId] = useState("");
  const [setupIsOpen, setSetupIsOpen] = useState(true);
  const [savingApplicationForm, setSavingApplicationForm] = useState(false);
  const [applicationSetupError, setApplicationSetupError] = useState<string | null>(null);
  const [groupRolesForSetup, setGroupRolesForSetup] = useState<any[]>([]);

  // Fetch user's groups for sidebar + primary group
  useEffect(() => {
    const fetchUserGroups = async () => {
      setLoadingGroups(true);
      setUserGroups([]); // Clear stale data first
      try {
        const [groupsResponse, profileResponse] = await Promise.all([
          groupsApi.getUserGroups(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/users/profile`, {
            headers: { Authorization: `Bearer ${storage.getAccessToken()}` },
          }).then(r => r.json()).catch(() => null),
        ]);
        if (groupsResponse.success && groupsResponse.data) {
          setUserGroups((groupsResponse.data.groups as Group[]) || []);
        }
        if (profileResponse?.success && profileResponse?.data?.user?.primary_group_id) {
          setPrimaryGroupId(profileResponse.data.user.primary_group_id);
        }
      } catch (error) {
        console.error("Failed to fetch user groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchUserGroups();
  }, [groupId]);

  // Fetch full details of the current group
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) return;

      try {
        const response = await groupsApi.getGroupById(groupId);
        if (response.success && response.data) {
          const group = response.data.group as Group;
          
          setCurrentGroupDetails(group);
          // Redirect old UUID URLs to canonical groupNumber/slug URL
          const isUUID = /^[0-9a-f-]{36}$/i.test(groupId);
          if (isUUID && group.group_number) {
            router.replace(`/groups/${group.group_number}/${groupSlug(group.name)}`);
          }
        }
      } catch (error) {
        console.error("Error fetching group details:", error);
      }
    };

    fetchGroupDetails();
  }, [groupId, router]);

  // Fetch alliances
  useEffect(() => {
    const fetchAlliances = async () => {
      if (!groupId) return;

      setLoadingAlliances(true);
      try {
        const response = await groupsApi.getGroupAlliances(groupId);
        if (response.success && response.data) {
          setAlliances((response.data.alliances as typeof alliances) || []);
        }
      } catch (error) {
        console.error("Error fetching alliances:", error);
      } finally {
        setLoadingAlliances(false);
      }
    };

    fetchAlliances();
  }, [groupId]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!groupId) return;
      setLoadingEvents(true);
      try {
        const response = await groupsApi.getGroupEvents(groupId);
        if (response.success && response.data) {
          setEvents((response.data.events as any[]) || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [groupId]);

  // Handle create event
  const handleCreateEvent = async () => {
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid || !eventForm.title) return;
    setCreatingEvent(true);
    setEventError(null);
    try {
      let imageUrl: string | undefined;
      if (eventImage) {
        try {
          const uploadResponse = await uploadApi.uploadImage(eventImage, 'event');
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = (uploadResponse.data as { url: string }).url;
          }
        } catch (uploadError) {
          console.error("Image upload failed, continuing without image:", uploadError);
        }
      }
      const response = await groupsApi.createGroupEvent(groupUuid, {
        title: eventForm.title,
        description: eventForm.description || undefined,
        imageUrl,
        startDate: new Date(eventForm.startDate).toISOString(),
        endDate: new Date(eventForm.endDate).toISOString(),
        location: eventForm.location || undefined,
      });
      if (response.success && response.data) {
        setEvents([...events, response.data.event as any]);
        setShowCreateEvent(false);
        setEventForm({ title: "", description: "", startDate: "", endDate: "", location: "" });
        setEventImage(null);
        if (eventImagePreview) URL.revokeObjectURL(eventImagePreview);
        setEventImagePreview(null);
      } else {
        setEventError(response.error || "Failed to create event.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setEventError("Failed to create event. Please try again.");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid) return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const response = await groupsApi.deleteGroupEvent(groupUuid, eventId);
      if (response.success) {
        setEvents(events.filter(e => e.id !== eventId));
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  // Get current group - prefer detailed data, fallback to sidebar data.
  // currentGroupDetails.role can come back missing even for an actual member
  // if the access token was stale/expired when /groups/:id was called — that
  // route uses optionalAuth, which silently drops the userId (and therefore
  // the role lookup) instead of erroring, so it doesn't trigger a token
  // refresh. userGroups comes from a strictly-authenticated endpoint (so a
  // stale token there does trigger a refresh) and only ever contains groups
  // the user is actually a member of, so use it to backfill role when missing.
  const membershipMatch = userGroups.find(
    (g) => g.id === (currentGroupDetails?.id || groupId)
  );
  const currentGroup = currentGroupDetails
    ? { ...currentGroupDetails, role: currentGroupDetails.role || membershipMatch?.role }
    : membershipMatch;

  // Fetch store items
  useEffect(() => {
    const fetchStoreItems = async () => {
      if (!groupId) return;
      setLoadingStoreItems(true);
      try {
        const response = await groupsApi.getGroupStoreItems(groupId);
        if (response.success && response.data) {
          setStoreItems((response.data.items as any[]) || []);
        }
      } catch (error) {
        console.error("Error fetching store items:", error);
      } finally {
        setLoadingStoreItems(false);
      }
    };

    fetchStoreItems();
  }, [groupId]);

  // Determine whether the current user can manage this group's store —
  // Owner always can; otherwise look up their role's canManageStore flag.
  useEffect(() => {
    const checkStorePermission = async () => {
      if (!groupId || !currentGroup?.role) {
        setCanManageGroupStore(false);
        return;
      }
      if (currentGroup.role === "Owner") {
        setCanManageGroupStore(true);
        return;
      }
      try {
        const response = await groupsApi.getGroupRoles(groupId);
        if (response.success && response.data) {
          const roles = (response.data as any).roles || [];
          const myRole = roles.find((r: any) => r.name === currentGroup.role);
          setCanManageGroupStore(!!myRole?.can_manage_store);
        }
      } catch (error) {
        console.error("Error checking store permission:", error);
      }
    };

    checkStorePermission();
  }, [groupId, currentGroup?.role]);

  const handleStoreItemImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    setStoreItemImage(file);
    if (storeItemImagePreview) URL.revokeObjectURL(storeItemImagePreview);
    setStoreItemImagePreview(URL.createObjectURL(file));
  };

  const handleCreateStoreItem = async () => {
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid || !storeItemName.trim()) return;

    setCreatingStoreItem(true);
    setStoreError(null);
    try {
      let imageUrl: string | undefined;
      if (storeItemImage) {
        setUploadingStoreItemImage(true);
        try {
          const uploadResponse = await uploadApi.uploadImage(storeItemImage, 'group-store-item');
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = (uploadResponse.data as { url: string }).url;
          }
        } catch (uploadError) {
          console.error("Image upload failed, continuing without image:", uploadError);
        }
        setUploadingStoreItemImage(false);
      }

      const response = await groupsApi.createGroupStoreItem(groupUuid, {
        name: storeItemName.trim(),
        description: storeItemDescription.trim() || undefined,
        price: parseInt(storeItemPrice) || 0,
        imageUrl,
        itemType: storeItemType,
      });

      if (response.success && response.data) {
        setStoreItems([(response.data as any).item, ...storeItems]);
        setShowAddStoreItemForm(false);
        setStoreItemName("");
        setStoreItemDescription("");
        setStoreItemPrice("0");
        setStoreItemType("shirt");
        setStoreItemImage(null);
        if (storeItemImagePreview) URL.revokeObjectURL(storeItemImagePreview);
        setStoreItemImagePreview(null);
      } else {
        setStoreError((response as any).message || "Failed to create store item");
      }
    } catch (error) {
      console.error("Error creating store item:", error);
      setStoreError("Failed to create store item");
    } finally {
      setCreatingStoreItem(false);
    }
  };

  const handleBuyStoreItem = async (itemId: string) => {
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid) return;

    setBuyingItemId(itemId);
    setBuyMessage(null);
    try {
      const response = await groupsApi.buyGroupStoreItem(groupUuid, itemId);
      if (response.success) {
        setBuyMessage({ type: "success", text: (response as any).message || "Purchase successful!" });
        // Refresh items in case stock changed
        const refreshed = await groupsApi.getGroupStoreItems(groupUuid);
        if (refreshed.success && refreshed.data) {
          setStoreItems((refreshed.data.items as any[]) || []);
        }
      } else {
        setBuyMessage({ type: "error", text: (response as any).message || "Purchase failed" });
      }
    } catch (error) {
      console.error("Error buying store item:", error);
      setBuyMessage({ type: "error", text: "Purchase failed. Please try again." });
    } finally {
      setBuyingItemId(null);
      setTimeout(() => setBuyMessage(null), 4000);
    }
  };

  // Fetch the group's application form
  useEffect(() => {
    const fetchApplicationForm = async () => {
      if (!groupId) return;
      setLoadingApplicationForm(true);
      try {
        const response = await groupsApi.getApplicationForm(groupId);
        if (response.success && response.data) {
          const form = (response.data as any).form;
          setApplicationForm(form);
          if (form?.questions) {
            setApplicationAnswers(new Array(form.questions.length).fill(""));
          }
        }
      } catch (error) {
        console.error("Error fetching application form:", error);
      } finally {
        setLoadingApplicationForm(false);
      }
    };

    fetchApplicationForm();
  }, [groupId]);

  // Determine whether the current user can manage members (and therefore
  // review applications) — same Owner-or-role-flag pattern as the store.
  useEffect(() => {
    const checkMembersPermission = async () => {
      if (!groupId || !currentGroup?.role) {
        setCanManageGroupMembers(false);
        return;
      }
      if (currentGroup.role === "Owner") {
        setCanManageGroupMembers(true);
        return;
      }
      try {
        const response = await groupsApi.getGroupRoles(groupId);
        if (response.success && response.data) {
          const roles = (response.data as any).roles || [];
          const myRole = roles.find((r: any) => r.name === currentGroup.role);
          setCanManageGroupMembers(!!myRole?.can_manage_members);
        }
      } catch (error) {
        console.error("Error checking members permission:", error);
      }
    };

    checkMembersPermission();
  }, [groupId, currentGroup?.role]);

  // Fetch the pending-applications review queue once we know the viewer can manage members
  useEffect(() => {
    const fetchPendingApplications = async () => {
      if (!groupId || !canManageGroupMembers) return;
      setLoadingPendingApplications(true);
      try {
        const response = await groupsApi.getApplicationReviews(groupId);
        if (response.success && response.data) {
          setPendingApplications((response.data as any).applications || []);
        }
      } catch (error) {
        console.error("Error fetching pending applications:", error);
      } finally {
        setLoadingPendingApplications(false);
      }
    };

    fetchPendingApplications();
  }, [groupId, canManageGroupMembers]);

  // Fetch group roles for the owner's "Setup Form" auto-rank selector, and
  // pre-fill the setup fields from the existing form once it's loaded.
  useEffect(() => {
    const fetchRolesForSetup = async () => {
      if (!groupId || currentGroup?.role !== "Owner") return;
      try {
        const response = await groupsApi.getGroupRoles(groupId);
        if (response.success && response.data) {
          setGroupRolesForSetup((response.data as any).roles || []);
        }
      } catch (error) {
        console.error("Error fetching roles for application setup:", error);
      }
    };

    fetchRolesForSetup();
  }, [groupId, currentGroup?.role]);

  useEffect(() => {
    if (!applicationForm) return;
    const questions = (applicationForm.questions || []).map((q: any) => (typeof q === "string" ? q : q.question || ""));
    setSetupQuestions(questions.length > 0 ? questions : [""]);
    setSetupAutoRankId(applicationForm.auto_rank_id || "");
    setSetupIsOpen(applicationForm.is_open !== false);
  }, [applicationForm]);

  const handleAnswerChange = (index: number, value: string) => {
    setApplicationAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmitApplication = async () => {
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid) return;

    setSubmittingApplication(true);
    setApplicationSubmitError(null);
    try {
      const response = await groupsApi.submitApplication(groupUuid, applicationAnswers);
      if (response.success) {
        setApplicationSubmitted(true);
      } else {
        setApplicationSubmitError((response as any).message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setApplicationSubmitError("Failed to submit application");
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleReviewApplication = async (applicationId: string, status: "accepted" | "denied") => {
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid) return;

    setReviewingApplicationId(applicationId);
    try {
      const response = await groupsApi.reviewApplication(groupUuid, applicationId, status);
      if (response.success) {
        setPendingApplications((prev) => prev.filter((a) => a.id !== applicationId));
      } else {
        alert((response as any).message || `Failed to ${status === "accepted" ? "accept" : "deny"} application`);
      }
    } catch (error) {
      console.error("Error reviewing application:", error);
      alert("Failed to review application. Please try again.");
    } finally {
      setReviewingApplicationId(null);
    }
  };

  const handleSetupQuestionChange = (index: number, value: string) => {
    setSetupQuestions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddSetupQuestion = () => setSetupQuestions((prev) => [...prev, ""]);

  const handleRemoveSetupQuestion = (index: number) => {
    setSetupQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveApplicationForm = async () => {
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid) return;

    const cleanedQuestions = setupQuestions.map((q) => q.trim()).filter((q) => q.length > 0);

    setSavingApplicationForm(true);
    setApplicationSetupError(null);
    try {
      const response = await groupsApi.upsertApplicationForm(groupUuid, {
        questions: cleanedQuestions.map((question) => ({ question })),
        autoRankId: setupAutoRankId || undefined,
        isOpen: setupIsOpen,
      });
      if (response.success && response.data) {
        setApplicationForm((response.data as any).form);
        setShowApplicationSetup(false);
      } else {
        setApplicationSetupError((response as any).message || "Failed to save application form");
      }
    } catch (error) {
      console.error("Error saving application form:", error);
      setApplicationSetupError("Failed to save application form");
    } finally {
      setSavingApplicationForm(false);
    }
  };

  // Fetch wall posts
  useEffect(() => {
    const fetchWallPosts = async () => {
      if (!groupId) return;

      setLoadingWallPosts(true);
      try {
        const response = await groupsApi.getGroupWallPosts(groupId, 1, 20);
        if (response.success && response.data) {
          setWallPosts((response.data.posts as typeof wallPosts) || []);
        }
      } catch (error) {
        console.error("Error fetching wall posts:", error);
      } finally {
        setLoadingWallPosts(false);
      }
    };

    fetchWallPosts();
  }, [groupId]);

  // Handle image selection for wall post
  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const handleRemovePostImage = () => {
    setPostImage(null);
    if (postImagePreview) URL.revokeObjectURL(postImagePreview);
    setPostImagePreview(null);
  };

  // Handle wall post submission
  const handlePostSubmit = async () => {
    if (!groupId || (!newPost.trim() && !postImage)) return;

    setPostingWall(true);
    setWallPostError(null);
    try {
      let imageUrl: string | undefined;

      // Upload image first if present
      if (postImage) {
        setUploadingImage(true);
        const uploadResponse = await uploadApi.uploadImage(postImage, 'wall-post');
        setUploadingImage(false);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = (uploadResponse.data as { url: string }).url;
        } else {
          alert("Failed to upload image. Please try again.");
          setPostingWall(false);
          return;
        }
      }

      const response = await groupsApi.createGroupWallPost(
        groupId,
        newPost.trim(),
        imageUrl,
      );
      if (response.success && response.data) {
        setWallPosts([
          response.data.post as (typeof wallPosts)[0],
          ...wallPosts,
        ]);
        setNewPost("");
        handleRemovePostImage();
      } else {
        setWallPostError((response as any).message || (response as any).error || "Failed to post. Please try again.");
      }
    } catch (error) {
      console.error("Error posting to wall:", error);
      setWallPostError("Failed to post. Please try again.");
    } finally {
      setPostingWall(false);
      setUploadingImage(false);
    }
  };

  // Handle join group
  const handleJoinGroup = async () => {
    // Use the UUID from loaded group details — groupId in URL is groupNumber
    const groupUuid = currentGroupDetails?.id;
    if (!groupUuid) return;

    setJoining(true);
    try {
      const response = await groupsApi.joinGroup(groupUuid);
      if (response.success) {
        const requiresApproval = (response as any).requiresApproval;
        
        if (requiresApproval) {
          // Join request submitted - show pending message
          setSuccessMessage({
            title: "Join Request Submitted",
            message: response.message || "Your join request has been submitted. Please wait for approval from group administrators.",
          });
          setShowSuccessModal(true);
        } else {
          // Immediately joined - refresh group details
          const detailsResponse = await groupsApi.getGroupById(groupId);
          if (detailsResponse.success && detailsResponse.data) {
            setCurrentGroupDetails(detailsResponse.data.group as Group);
          }
          // Refresh user groups list
          const userGroupsResponse = await groupsApi.getUserGroups();
          if (userGroupsResponse.success && userGroupsResponse.data) {
            setUserGroups((userGroupsResponse.data.groups as Group[]) || []);
          }
          setSuccessMessage({
            title: "Success",
            message: "Successfully joined the group!",
          });
          setShowSuccessModal(true);
        }
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || response.message || "Failed to join group",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error joining group:", error);
      setSuccessMessage({
        title: "Error",
        message: "An error occurred while joining the group",
      });
      setShowSuccessModal(true);
    } finally {
      setJoining(false);
    }
  };

  // Handle shout submission
  const handleShoutSubmit = async () => {
    if ((!shoutText.trim() && !shoutImage) || !groupId) return;

    try {
      let imageUrl: string | undefined;
      if (shoutImage) {
        const uploadResponse = await uploadApi.uploadImage(shoutImage, 'shout');
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = (uploadResponse.data as { url: string }).url;
        } else {
          alert("Failed to upload image"); return;
        }
      }
      const response = await groupsApi.updateGroupShout(
        groupId,
        shoutText.trim(),
        imageUrl,
      );
      if (response.success) {
        // Refresh group details to show new shout
        const groupResponse = await groupsApi.getGroupById(groupId);
        if (groupResponse.success && groupResponse.data) {
          setCurrentGroupDetails(groupResponse.data.group as Group);
        }
        setShoutText("");
        setShoutImage(null);
        if (shoutImagePreview) URL.revokeObjectURL(shoutImagePreview);
        setShoutImagePreview(null);
        setSuccessMessage({
          title: "Success",
          message: "Shout posted successfully!",
        });
        setShowSuccessModal(true);
      } else {
        setSuccessMessage({
          title: "Error",
          message: response.error || "Failed to post shout",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error posting shout:", error);
      setSuccessMessage({
        title: "Error",
        message: "Failed to post shout",
      });
      setShowSuccessModal(true);
    }
  };

  // Toggle replies visibility
  const handleToggleReplies = async (postId: string) => {
    const isCurrentlyShown = showReplies[postId];
    
    if (!isCurrentlyShown && !replies[postId]) {
      // Fetch replies if not already loaded
      setLoadingReplies({ ...loadingReplies, [postId]: true });
      try {
        const response = await groupsApi.getWallPostReplies(groupId, postId);
        if (response.success && response.data) {
          setReplies({ ...replies, [postId]: response.data.replies || [] });
        }
      } catch (error) {
        console.error("Error fetching replies:", error);
      } finally {
        setLoadingReplies({ ...loadingReplies, [postId]: false });
      }
    }
    
    setShowReplies({ ...showReplies, [postId]: !isCurrentlyShown });
  };

  // Handle reply submission
  const handleReplySubmit = async (postId: string) => {
    const content = replyText[postId];
    if (!content?.trim() || !groupId) return;

    setPostingReply({ ...postingReply, [postId]: true });
    try {
      const response = await groupsApi.createWallPostReply(
        groupId,
        postId,
        content.trim(),
      );
      if (response.success && response.data) {
        // Add new reply to the list
        const currentReplies = replies[postId] || [];
        setReplies({
          ...replies,
          [postId]: [...currentReplies, response.data.reply],
        });
        // Update reply count
        setWallPosts(
          wallPosts.map((post) =>
            post.id === postId
              ? { ...post, reply_count: (post.reply_count || 0) + 1 }
              : post
          )
        );
        // Clear reply text
        setReplyText({ ...replyText, [postId]: "" });
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setPostingReply({ ...postingReply, [postId]: false });
    }
  };

  // Handle delete reply
  const handleDeleteReply = async (postId: string, replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
      const response = await groupsApi.deleteWallPostReply(
        groupId,
        postId,
        replyId,
      );
      if (response.success) {
        // Remove reply from list
        const currentReplies = replies[postId] || [];
        setReplies({
          ...replies,
          [postId]: currentReplies.filter((r: any) => r.id !== replyId),
        });
        // Update reply count
        setWallPosts(
          wallPosts.map((post) =>
            post.id === postId
              ? { ...post, reply_count: Math.max(0, (post.reply_count || 0) - 1) }
              : post
          )
        );
        setSuccessMessage({
          title: "Success",
          message: "Reply deleted successfully!",
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      setSuccessMessage({
        title: "Error",
        message: "Failed to delete reply",
      });
      setShowSuccessModal(true);
    }
  };

  const tabs = ["About", "Store", "Alliances", "Events", "Applications"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex w-full">
        {/* Left Sidebar - Fixed, No Scroll */}
        <div className="w-1/4 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 px-6 py-6 fixed h-[calc(100vh-64px)] left-0 top-[64px]">
          {/* Groups Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Groups
            </h2>
            <Link
              href="/groups?discover=true"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              See All
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search My Groups"
              value={searchMyGroups}
              onChange={(e) => setSearchMyGroups(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-[#1a1a1a] border-none rounded text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Groups List */}
          <div className="space-y-1 mb-4">
            {loadingGroups ? (
              <div className="py-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
            ) : userGroups.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  No groups yet
                </p>
              </div>
            ) : (() => {
              const filteredGroups = userGroups.filter((g) =>
                g.name.toLowerCase().includes(searchMyGroups.toLowerCase())
              );
              const primaryGroup = filteredGroups.find(g => g.id === primaryGroupId);
              const otherGroups = filteredGroups.filter(g => g.id !== primaryGroupId);

              const renderGroupItem = (group: Group) => {
                const href = group.group_number
                  ? `/groups/${group.group_number}/${groupSlug(group.name)}`
                  : `/groups/${group.id}`;
                const isActive = groupId === group.id ||
                  groupId === String(group.group_number) ||
                  params.id === String(group.group_number);
                return (
                  <Link
                    key={group.id}
                    href={href}
                    className={`flex items-center gap-3 py-2 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      isActive ? "bg-gray-100 dark:bg-[#1a1a1a]" : ""
                    }`}
                  >
                    <div className="w-[150px] h-[150px] rounded overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 relative">
                      {group.icon_url ? (
                        <Image
                          src={group.icon_url}
                          alt={group.name}
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                      ) : (
                        <span className="text-3xl flex items-center justify-center w-full h-full">
                          🎮
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
                        {group.name}
                        {group.is_verified && (
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="12" fill="#1D9BF0"/>
                            <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.member_count?.toLocaleString()} members
                      </p>
                    </div>
                  </Link>
                );
              };

              return filteredGroups.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    No groups match your search
                  </p>
                </div>
              ) : (
                <>
                  {primaryGroup && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 mb-1">Primary</p>
                      {renderGroupItem(primaryGroup)}
                    </div>
                  )}
                  {otherGroups.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 mb-1">My Groups</p>
                      {otherGroups.map(renderGroupItem)}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Create Community Button */}
          <div className="mt-4">
            <Link
              href="/groups/create"
              className="block w-full bg-gray-200 dark:bg-[#242424] hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2.5 text-sm rounded-lg transition-colors text-center"
            >
              Create Group
            </Link>
          </div>
        </div>

        {/* Main Content - 75% width, Only Scrollable Section */}
        <div className="w-3/4 ml-[25%]">
          <div className="bg-white dark:bg-black">
          {/* Cover Banner - Full width, always show with fallback gradient */}
          <div className="w-full h-[250px] relative overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
            {currentGroup?.cover_photo_url && (
              <a
                href={currentGroup.cover_photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 block"
              >
                <Image
                  src={currentGroup.cover_photo_url}
                  alt={`${currentGroup.name} cover`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </a>
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Group Header */}
          <div className="flex items-end gap-4 px-6 pb-6 border-b border-gray-100 dark:border-gray-800 -mt-20 relative z-10">
            {currentGroup ? (
              <>
                <div className="w-[200px] h-[200px] border-4 border-white dark:border-gray-900 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#242424] relative shadow-lg">
                  {currentGroup.icon_url ? (
                    <a
                      href={currentGroup.icon_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 block"
                    >
                      <Image
                        src={currentGroup.icon_url}
                        alt={currentGroup.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🎮
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {currentGroup.name}
                    {currentGroup.is_verified && (
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="12" fill="#1D9BF0"/>
                        <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    By{" "}
                    <a href={`/profile/${currentGroup.owner_username}`} className="text-white hover:underline">{currentGroup.owner_display_name || currentGroup.owner_username}</a>
                  </p>

                  <div className="flex gap-8 mt-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                        Members
                      </p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {currentGroup.member_count}
                      </p>
                    </div>
                    {currentGroup.role && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-1">
                          Rank
                        </p>
                        <span className="inline-block px-4 py-1.5 text-sm font-bold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                          {currentGroup.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Join Button + Three Dot Menu */}
                <div className="flex items-center gap-2">
                  {/* Join Button - Show only if user is not a member */}
                  {!currentGroup.role && currentGroupDetails !== null && (
                    <button
                      onClick={handleJoinGroup}
                      disabled={joining}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joining ? "Joining..." : "Join Group"}
                    </button>
                  )}

                  {/* Three Dot Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setGroupMenuOpen(!groupMenuOpen)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {groupMenuOpen && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setGroupMenuOpen(false)}
                        />

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded shadow-lg z-20 py-1">
                          {/* If user is a member/owner - show full menu */}
                          {currentGroup.role ? (
                            <>
                              {/* Admin Options - Only show if user is Owner */}
                              {currentGroup.owner_id === currentUserId && (
                                <>
                                  <Link href={`/groups/${groupId}/configure`}>
                                    <button
                                      onClick={() => setGroupMenuOpen(false)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      Configure Group
                                    </button>
                                  </Link>
                                  <Link
                                    href={`/groups/${groupId}/configure?section=Advertise Group`}
                                  >
                                    <button
                                      onClick={() => setGroupMenuOpen(false)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      Advertise Group
                                    </button>
                                  </Link>
                                </>
                              )}

                              {/* Regular Member Options */}
                              <button
                                onClick={async () => {
                                  setGroupMenuOpen(false);
                                  const groupUuid = currentGroupDetails?.id;
                                  if (groupUuid) {
                                    setActionLoading(true);
                                    const response =
                                      await groupsApi.makePrimaryGroup(groupUuid);
                                    setActionLoading(false);
                                    if (response.success) {
                                      setPrimaryGroupId(groupUuid);
                                      setSuccessMessage({
                                        title: "Success",
                                        message: "Group set as primary!",
                                      });
                                      setShowSuccessModal(true);
                                    } else {
                                      setSuccessMessage({
                                        title: "Error",
                                        message:
                                          response.error || "Failed to set primary group",
                                      });
                                      setShowSuccessModal(true);
                                    }
                                  }
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Make Primary
                              </button>
                              <button
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  setShowLeaveConfirm(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Leave Group
                              </button>

                              {/* Owner Only Option */}

                              <div className="border-t border-gray-200 dark:border-[#2a2a2a] my-1"></div>
                            </>
                          ) : (
                            /* If user is NOT a member - show limited menu */
                            <>
                              <button
                                onClick={() => {
                                  setGroupMenuOpen(false);
                                  if (groupId) {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/groups/${groupId}`
                                    );
                                    setSuccessMessage({
                                      title: "Success",
                                      message: "Group link copied to clipboard!",
                                    });
                                    setShowSuccessModal(true);
                                  }
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Copy Link
                              </button>
                            </>
                          )}

                          {/* Report Abuse - Always visible */}
                          <button
                            onClick={() => {
                              setGroupMenuOpen(false);
                              setShowReportModal(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            Report Abuse
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Group not found</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          {/* Tab Navigation */}
          <div className="flex gap-10 px-6 border-b border-gray-100 dark:border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-base font-semibold transition-colors relative ${
                  activeTab === tab
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "About" && (
            <>
              {/* Description Section */}
              <div className="p-6">
                <DescriptionSection description={currentGroup?.description} />
              </div>

              {/* Shout Section */}
              <div className="bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Shout
                </h3>

                {/* Current Shout Display */}
                {currentGroup?.shout_text ? (
                  <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-100 dark:border-[#2a2a2a] mb-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <UserAvatar
  userId={currentGroup.shout_posted_by || ""}
  username={currentGroup.shout_posted_by_username || ""}
  size={40}
  headshot
/>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Username */}
                        {currentGroup.shout_posted_by_username && (
                          <a 
                            href={`/profile/${currentGroup.shout_posted_by_username}`}
                            className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:underline"
                          >
                            {currentGroup.shout_posted_by_username}
                          </a>
                        )}
                        
                        {/* Shout Message */}
                        <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 break-words">
                          {currentGroup.shout_text}
                        </p>
                        
                        {/* Shout Image */}
                        {currentGroup.shout_image_url && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
                            <img src={currentGroup.shout_image_url} alt="Shout image" className="max-w-full max-h-64 object-contain" />
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        {currentGroup.shout_posted_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(currentGroup.shout_posted_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })} | {new Date(currentGroup.shout_posted_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Nothing has been said yet.
                  </p>
                )}

                {/* Shout Input - Only for members with shout permission */}
                {currentGroup && currentGroup.role && (
                  <div className="space-y-3">
                    <textarea
                      value={shoutText}
                      onChange={(e) => setShoutText(e.target.value)}
                      placeholder="Enter your shout"
                      maxLength={1000}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    {shoutImagePreview && (
                      <div className="relative inline-block">
                        <img src={shoutImagePreview} alt="Preview" className="max-h-32 rounded border border-gray-300 dark:border-[#2a2a2a]" />
                        <button
                          onClick={() => { setShoutImage(null); if (shoutImagePreview) URL.revokeObjectURL(shoutImagePreview); setShoutImagePreview(null); }}
                          className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors" title="Attach image">
                          <ImagePlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
                              setShoutImage(file);
                              if (shoutImagePreview) URL.revokeObjectURL(shoutImagePreview);
                              setShoutImagePreview(URL.createObjectURL(file));
                            }}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {shoutText.length}/1000 characters
                        </p>
                      </div>
                      <button
                        onClick={handleShoutSubmit}
                        disabled={!shoutText.trim() && !shoutImage}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Group Shout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Games Section */}
              <div className="mx-6">
                <GamesSection groupId={currentGroup?.id} />
              </div>

              {/* Members Section */}
              <div className="mx-6">
                <MembersSection groupId={currentGroup?.id} />
              </div>

              {/* Social Links */}
              <SocialLinksSection groupId={currentGroup?.id} />

              {/* Wall Section */}
              <div className="bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 p-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Wall
                </h2>

                <div className="mb-4 w-full">
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Say something..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-gray-50 dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    {wallPostError && (
                      <p className="text-sm text-red-500">{wallPostError}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={handlePostSubmit}
                        disabled={!newPost.trim() || postingWall}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {postingWall ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                </div>

                {wallPosts.length > 0 ? (
                  <div className="space-y-6">
                    {wallPosts.map((post) => (
                      <div key={post.id} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200 dark:border-[#2a2a2a]">
                        {/* Post Header */}
                        <div className="flex gap-3 mb-3">
                          <UserAvatar
  userId={post.author_id}
  username={post.author_display_name || post.author_username}
  size={40}
/>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/profile/${post.author_username}`}
                                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {post.author_display_name || post.author_username}
                              </a>
                              {post.author_is_verified && (
                                <span className="text-blue-500 text-xs">✓</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {post.author_role || "Member"} | {new Date(post.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })} | {new Date(post.created_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>

                          {/* Three-dot menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenPostMenu(
                                  openPostMenu === post.id ? null : post.id,
                                )
                              }
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>

                            {openPostMenu === post.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenPostMenu(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded shadow-lg z-20 py-1">
  {(post.author_id === currentUserId || currentGroupDetails?.owner_id === currentUserId) && (
    <>
      <button
        onClick={async () => {
          setOpenPostMenu(null);
          if (!confirm("Are you sure you want to delete this post?")) return;
          try {
            const groupUuid = currentGroupDetails?.id;
            if (!groupUuid) return;
            const response = await groupsApi.deleteGroupWallPost(groupUuid, post.id);
            if (response.success) {
              setWallPosts(wallPosts.filter(p => p.id !== post.id));
            }
          } catch (error) {
            console.error("Error deleting post:", error);
          }
        }}
        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        Delete Post
      </button>
      <div className="border-t border-gray-200 dark:border-[#2a2a2a] my-1" />
    </>
  )}
  <button
    onClick={() => {
      setShowReportModal(true);
      setOpenPostMenu(null);
    }}
    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  >
    Report Abuse
  </button>
</div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Post Content */}
                        {post.content && (
                          <p className="text-base text-gray-900 dark:text-gray-100 mb-3 whitespace-pre-wrap break-words">
                            {post.content}
                          </p>
                        )}

                        {/* Post Actions */}
                        <div className="flex items-center justify-between">
                          {(post.reply_count || 0) > 0 ? (
                            <button
                              onClick={() => handleToggleReplies(post.id)}
                              className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                            >
                              {showReplies[post.id] ? "Hide" : "View"} Replies ({post.reply_count})
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">No replies yet</span>
                          )}
                          <button
                            onClick={() => {
                              if (!showReplies[post.id]) {
                                handleToggleReplies(post.id);
                              }
                              // Focus on reply input after a short delay
                              setTimeout(() => {
                                const input = document.querySelector(`input[data-post-id="${post.id}"]`) as HTMLInputElement;
                                input?.focus();
                              }, 100);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Replies Section */}
                        {showReplies[post.id] && (
                          <div className="mt-4 space-y-3">
                            {loadingReplies[post.id] ? (
                              <div className="text-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                              </div>
                            ) : (
                              <>
                                {/* Reply Input */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    data-post-id={post.id}
                                    value={replyText[post.id] || ""}
                                    onChange={(e) =>
                                      setReplyText({ ...replyText, [post.id]: e.target.value })
                                    }
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReplySubmit(post.id);
                                      }
                                    }}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => handleReplySubmit(post.id)}
                                    disabled={!replyText[post.id]?.trim() || postingReply[post.id]}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {postingReply[post.id] ? "..." : "Reply"}
                                  </button>
                                </div>

                                {/* Replies List */}
                                {replies[post.id]?.length > 0 && (
                                  <div className="space-y-3 pl-4 border-l-2 border-gray-300 dark:border-[#2a2a2a]">
                                    {replies[post.id].map((reply: any) => (
                                      <div key={reply.id} className="flex gap-2">
                                        <UserAvatar
  userId={reply.author_id}
  username={reply.author_display_name || reply.author_username}
  size={32}
/>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={`/profile/${reply.author_username}`}
                                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                              {reply.author_display_name || reply.author_username}
                                            </a>
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
                                        {reply.author_id === currentGroupDetails?.owner_id && (
                                          <button
                                            onClick={() => handleDeleteReply(post.id, reply.id)}
                                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No wall posts yet. Be the first to post!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "Store" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Store
                </h2>
                {canManageGroupStore && (
                  <button
                    onClick={() => { setShowAddStoreItemForm(!showAddStoreItemForm); setStoreError(null); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {showAddStoreItemForm ? "Cancel" : "Add Item"}
                  </button>
                )}
              </div>

              {buyMessage && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                    buyMessage.type === "success"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  {buyMessage.text}
                </div>
              )}

              {/* Add Item Form */}
              {showAddStoreItemForm && (
                <div className="mb-6 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-5 space-y-4">
                  {storeError && (
                    <p className="text-sm text-red-500">{storeError}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={storeItemName}
                      onChange={(e) => setStoreItemName(e.target.value)}
                      placeholder="Enter item name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={storeItemDescription}
                      onChange={(e) => setStoreItemDescription(e.target.value)}
                      placeholder="Describe this item..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (AdventureBux)</label>
                      <input
                        type="number"
                        min="0"
                        value={storeItemPrice}
                        onChange={(e) => setStoreItemPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Type</label>
                      <select
                        value={storeItemType}
                        onChange={(e) => setStoreItemType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="shirt">Shirt</option>
                        <option value="pants">Pants</option>
                        <option value="hat">Hat</option>
                        <option value="gear">Gear</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Image</label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 bg-gray-200 dark:bg-[#242424] hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg cursor-pointer transition-colors">
                        {storeItemImage ? "Change Image" : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStoreItemImageSelect}
                          className="hidden"
                        />
                      </label>
                      {storeItemImage && (
                        <button
                          onClick={() => { setStoreItemImage(null); if (storeItemImagePreview) URL.revokeObjectURL(storeItemImagePreview); setStoreItemImagePreview(null); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {storeItemImagePreview && (
                      <div className="mt-2">
                        <img src={storeItemImagePreview} alt="Item preview" className="max-h-32 rounded-lg border border-gray-300 dark:border-gray-600" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleCreateStoreItem}
                    disabled={!storeItemName.trim() || creatingStoreItem || uploadingStoreItemImage}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingStoreItemImage ? "Uploading image..." : creatingStoreItem ? "Creating..." : "Create Item"}
                  </button>
                </div>
              )}

              {/* Items Grid */}
              {loadingStoreItems ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : storeItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Store Items
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    This group doesn&apos;t have any store items yet. Check back later!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 flex flex-col">
                      <div className="w-full aspect-square bg-gray-100 dark:bg-[#1a1a1a] rounded-lg overflow-hidden flex items-center justify-center mb-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">🎽</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex-1 line-clamp-2">{item.description}</p>
                      )}
                      {item.stock !== -1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.stock} left</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.price} AdventureBux</span>
                        <button
                          onClick={() => handleBuyStoreItem(item.id)}
                          disabled={buyingItemId === item.id || (item.stock !== -1 && item.stock <= 0)}
                          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buyingItemId === item.id ? "Buying..." : (item.stock !== -1 && item.stock <= 0) ? "Sold Out" : "Buy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Alliances" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Allies ({alliances.length})
                </h2>
              </div>

              {loadingAlliances ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading alliances...
                  </span>
                </div>
              ) : alliances.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {alliances.map((alliance) => (
                    <Link
                      key={alliance.id}
                      href={`/groups/${alliance.allied_group_id}`}
                      className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-[#242424] overflow-hidden relative">
                        {alliance.allied_group_icon ? (
                          <Image
                            src={alliance.allied_group_icon}
                            alt={alliance.allied_group_name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🎮
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-1">
                          <h3
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
                            title={alliance.allied_group_name}
                          >
                            {alliance.allied_group_name}
                          </h3>
                          {alliance.allied_group_verified && (
                            <span className="text-blue-500 text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {alliance.allied_group_member_count?.toLocaleString() || 0} Members
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    No alliances yet
                  </p>
                  {currentGroup?.owner_id === currentUserId && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Send alliance requests to other groups from the Configure page
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "Events" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Events
                </h2>
                {currentGroup?.owner_id === currentUserId && (
                  <button
                    onClick={() => setShowCreateEvent(!showCreateEvent)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {showCreateEvent ? "Cancel" : "Create Event"}
                  </button>
                )}
              </div>

              {/* Create Event Form */}
              {showCreateEvent && (
                <div className="mb-6 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title *</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="Enter event title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      placeholder="Describe your event..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      placeholder="e.g. In-game, Discord, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={eventForm.startDate}
                        onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select date and time (include AM/PM)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={eventForm.endDate}
                        onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select date and time (include AM/PM)</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Image</label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg cursor-pointer transition-colors">
                        {eventImage ? "Change Image" : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
                            setEventImage(file);
                            if (eventImagePreview) URL.revokeObjectURL(eventImagePreview);
                            setEventImagePreview(URL.createObjectURL(file));
                          }}
                          className="hidden"
                        />
                      </label>
                      {eventImage && (
                        <button
                          onClick={() => { setEventImage(null); if (eventImagePreview) URL.revokeObjectURL(eventImagePreview); setEventImagePreview(null); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {eventImagePreview && (
                      <div className="mt-2">
                        <img src={eventImagePreview} alt="Event preview" className="max-h-32 rounded-lg border border-gray-300 dark:border-[#2a2a2a]" />
                      </div>
                    )}
                  </div>
                  {eventError && (
                    <p className="text-sm text-red-500">{eventError}</p>
                  )}
                  <button
                    onClick={handleCreateEvent}
                    disabled={!eventForm.title || !eventForm.startDate || !eventForm.endDate || creatingEvent}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingEvent ? "Creating..." : "Create Event"}
                  </button>
                </div>
              )}

              {/* Events List */}
              {loadingEvents ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event: any) => {
                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);
                    const isUpcoming = startDate > new Date();
                    const isOngoing = startDate <= new Date() && endDate >= new Date();

                    return (
                      <div
                        key={event.id}
                        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden"
                      >
                        {event.image_url && (
                          <div className="w-full h-40 bg-gray-200 dark:bg-[#242424] relative">
                            <Image src={event.image_url} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                          </div>
                        )}
                        <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {event.title}
                              </h3>
                              {isOngoing && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                  Live Now
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {event.location && <span>📍 {event.location}</span>}
                            </div>
                            {event.created_by_username && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Created by{" "}
                                <Link href={`/profile/${event.created_by_username}`} className="text-blue-500 hover:underline">
                                  {event.created_by_display_name || event.created_by_username}
                                </Link>
                              </p>
                            )}
                          </div>
                          {currentGroup?.owner_id === currentUserId && (
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="ml-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                              title="Delete event"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Upcoming Events
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    This group doesn&apos;t have any upcoming events. Check back later or ask the group owner to create one.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "Applications" && (
            <div className="p-6 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Applications
                </h2>
                {currentGroup?.role === "Owner" && (
                  <button
                    onClick={() => { setShowApplicationSetup(!showApplicationSetup); setApplicationSetupError(null); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {showApplicationSetup ? "Cancel" : "Setup Form"}
                  </button>
                )}
              </div>

              {/* Owner: Setup Form */}
              {currentGroup?.role === "Owner" && showApplicationSetup && (
                <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-5 space-y-4">
                  {applicationSetupError && (
                    <p className="text-sm text-red-500">{applicationSetupError}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Questions</label>
                    <div className="space-y-2">
                      {setupQuestions.map((q, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={q}
                            onChange={(e) => handleSetupQuestionChange(i, e.target.value)}
                            placeholder={`Question ${i + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {setupQuestions.length > 1 && (
                            <button
                              onClick={() => handleRemoveSetupQuestion(i)}
                              className="px-3 text-red-500 hover:underline text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddSetupQuestion}
                      className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      + Add Question
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auto-Rank on Accept</label>
                    <select
                      value={setupAutoRankId}
                      onChange={(e) => setSetupAutoRankId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Default (lowest rank)</option>
                      {groupRolesForSetup.filter((r: any) => r.name !== "Owner").map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setupIsOpen}
                      onChange={(e) => setSetupIsOpen(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Applications open</span>
                  </label>

                  <button
                    onClick={handleSaveApplicationForm}
                    disabled={savingApplicationForm}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingApplicationForm ? "Saving..." : "Save Form"}
                  </button>
                </div>
              )}

              {/* Manager/Owner: Review Queue */}
              {canManageGroupMembers && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Pending Applications
                  </h3>
                  {loadingPendingApplications ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  ) : pendingApplications.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No pending applications.</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingApplications.map((app) => (
                        <div key={app.id} className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <UserAvatar userId={app.applicant_id} username={app.applicant_display_name || app.applicant_username} size={32} />
                            <a
                              href={`/profile/${app.applicant_username}`}
                              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {app.applicant_display_name || app.applicant_username}
                            </a>
                          </div>
                          <div className="space-y-2 mb-4">
                            {(applicationForm?.questions || []).map((q: any, i: number) => (
                              <div key={i}>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  {typeof q === "string" ? q : q.question}
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">{app.answers?.[i] || "—"}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewApplication(app.id, "accepted")}
                              disabled={reviewingApplicationId === app.id}
                              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReviewApplication(app.id, "denied")}
                              disabled={reviewingApplicationId === app.id}
                              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Non-member: Fill out application */}
              {!currentGroup?.role && (
                <div>
                  {loadingApplicationForm ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  ) : applicationSubmitted ? (
                    <p className="text-sm text-green-600 dark:text-green-400 py-4">
                      Your application has been submitted. The group owners will review it soon.
                    </p>
                  ) : !applicationForm ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                      This group doesn&apos;t have an application form set up yet.
                    </p>
                  ) : !applicationForm.is_open ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                      Applications are currently closed for this group.
                    </p>
                  ) : (
                    <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-5 space-y-4">
                      {applicationSubmitError && (
                        <p className="text-sm text-red-500">{applicationSubmitError}</p>
                      )}
                      {(applicationForm.questions || []).map((q: any, i: number) => (
                        <div key={i}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {typeof q === "string" ? q : q.question}
                          </label>
                          <textarea
                            value={applicationAnswers[i] || ""}
                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      ))}
                      <button
                        onClick={handleSubmitApplication}
                        disabled={submittingApplication}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingApplication ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8">
            <Footer />
          </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={async () => {
          const groupUuid = currentGroupDetails?.id || groupId;
          if (groupUuid) {
            setActionLoading(true);
            const response = await groupsApi.leaveGroup(groupUuid);
            setActionLoading(false);
            setShowLeaveConfirm(false);
            if (response.success) {
              const isGroupDeleted = response.message?.includes("deleted");
              setSuccessMessage({
                title: "Success",
                message: isGroupDeleted
                  ? "Group deleted successfully! You were the last member."
                  : "Left group successfully!",
              });
              setShowSuccessModal(true);
              // Refresh user groups list
              const userGroupsResponse = await groupsApi.getUserGroups();
              if (userGroupsResponse.success && userGroupsResponse.data) {
                setUserGroups((userGroupsResponse.data.groups as Group[]) || []);
              }
              setTimeout(() => {
                router.push("/groups");
              }, 2000);
            } else {
              setSuccessMessage({
                title: "Error",
                message: response.error || "Failed to leave group",
              });
              setShowSuccessModal(true);
            }
          }
        }}
        title={
          currentGroupDetails?.owner_id === currentUserId
            ? "Leave Group / Delete Group"
            : "Leave Group"
        }
        message={
          currentGroupDetails?.owner_id === currentUserId
            ? (currentGroupDetails?.member_count ?? 0) > 1
              ? "As the owner, you cannot leave while there are other members. Remove all members first, then you can leave to delete the group."
              : "You are the last member and the owner. Leaving will permanently delete this group. This action cannot be undone."
            : "Are you sure you want to leave this group? This action cannot be undone."
        }
        confirmText={
          currentGroupDetails?.owner_id === currentUserId &&
          currentGroupDetails?.member_count === 1
            ? "Delete Group"
            : "Leave Group"
        }
        cancelText={
          currentGroupDetails?.owner_id === currentUserId &&
          currentGroupDetails?.member_count > 1
            ? "Close"
            : "Cancel"
        }
        variant="danger"
        loading={actionLoading}
        disabled={
          currentGroupDetails?.owner_id === currentUserId &&
          (currentGroupDetails?.member_count ?? 0) > 1
        }
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={async (category, description) => {
          if (groupId) {
            setActionLoading(true);
            const response = await groupsApi.reportGroup(
              groupId,
              category,
              description || undefined,
            );
            setActionLoading(false);
            setShowReportModal(false);
            if (response.success) {
              setSuccessMessage({
                title: "Success",
                message:
                  "Report submitted successfully! Our moderation team will review it.",
              });
              setShowSuccessModal(true);
            } else {
              setSuccessMessage({
                title: "Error",
                message: response.error || "Failed to submit report",
              });
              setShowSuccessModal(true);
            }
          }
        }}
        loading={actionLoading}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </div>
  );
};

export default GroupDetailPage;
