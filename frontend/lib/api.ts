// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// API Response types
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ msg?: string; message?: string }>;
}

// Auth types
interface SignupData {
  username: string;
  password: string;
  month: string;
  day: string;
  year: string;
  gender?: string;
  turnstileToken?: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    isVerified: boolean;
    createdAt: string;
    twoFactorEnabled?: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

// Silent token refresh — returns true if successful
let _isRefreshing = false;
let _refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (_isRefreshing && _refreshPromise) return _refreshPromise;
  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (!refreshToken) return false;
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

// Helper function to handle API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  _retry = false,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // On 401, try silent refresh once then retry
    if (response.status === 401 && !_retry && endpoint !== '/auth/refresh') {
      const refreshed = await silentRefresh();
      if (refreshed) {
        // Rebuild Authorization header with new token
        const newToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const newOptions: RequestInit = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          },
        };
        return apiCall<T>(endpoint, newOptions, true);
      }
      // Refresh failed — clear tokens but do NOT redirect (let UI handle it gracefully)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

// Auth API
export const authApi = {
  signup: async (data: SignupData): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  logout: async (token: string): Promise<ApiResponse> => {
    return apiCall("/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  refreshToken: async (
    refreshToken: string,
  ): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  verifyEmail: async (token: string): Promise<ApiResponse> => {
    return apiCall(`/auth/verify-email/${token}`, {
      method: "GET",
    });
  },
};

// Users API
export const usersApi = {
  // Get current user's profile from database
  getCurrentUser: async (): Promise<ApiResponse<{ user: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/users/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get user profile by username
  getUserByUsername: async (
    username: string,
  ): Promise<ApiResponse<unknown>> => {
    return apiCall(`/users/${username}`, {
      method: "GET",
    });
  },

  // Update profile (displayName, bio, status)
 updateProfile: async (data: {
    displayName?: string;
    bio?: string;
    status?: string;
    email?: string;
    socialVisibility?: string;
    gender?: string;
  }): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/users/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Update profile settings (privacy)
  updateProfileSettings: async (data: {
    profileVisibility?: string;
    canReceiveFriendRequests?: string;
    canReceiveMessages?: string;
    canFollow?: string;
    canViewInventory?: string;
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
    profileTheme?: string;
    // Parental controls — not yet persisted by the backend (no DB columns/handling
    // yet), but accepted here so the settings page can send them once it is.
    chatRestriction?: string;
    safeChatMode?: boolean;
    blockExternalLinks?: boolean;
  }): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/users/profile/settings", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<ApiResponse<{ preferences: Record<string, boolean> }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/users/notifications", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Update (upsert) notification preferences
  updateNotificationPreferences: async (
    preferences: Record<string, boolean>,
  ): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/users/notifications", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });
  },

  // Get following list
  getFollowing: async (): Promise<ApiResponse<{ following: any[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return apiCall("/users/following", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get followers list
  getFollowers: async (): Promise<ApiResponse<{ followers: any[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return apiCall("/users/followers", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },


getUserFollowing: async (userId: string): Promise<ApiResponse<unknown>> => {
    return apiCall(`/users/${userId}/following`);
  },

  getUserFollowers: async (userId: string): Promise<ApiResponse<unknown>> => {
    return apiCall(`/users/${userId}/followers`);
  },

  // Follow a user
  followUser: async (userId: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return apiCall(`/users/${userId}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Unfollow a user
  unfollowUser: async (userId: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/users/${userId}/follow`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get relationship status with a user
  getRelationship: async (userId: string): Promise<ApiResponse<{ relationship: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/users/${userId}/relationship`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get user's social links
  getUserSocialLinks: async (userId: string): Promise<ApiResponse<{ socialLinks: any[] }>> => {
    return apiCall(`/users/social-links/${userId}`, {
      method: "GET",
    });
  },

  // Get current user's social links
  getMySocialLinks: async (): Promise<ApiResponse<{ socialLinks: any[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/users/social-links/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Add or update a social link
  upsertSocialLink: async (platform: string, url: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/users/social-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ platform, url }),
    });
  },

  // Delete a social link
  deleteSocialLink: async (platform: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/users/social-links/${platform}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
connectRoblox: async (robloxUsername: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall("/users/roblox/connect", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ robloxUsername }),
    });
  },

  disconnectRoblox: async (): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall("/users/roblox/disconnect", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

};

// Accounts API
export const accountsApi = {
  // Get all accounts for current user
  getAccounts: async (): Promise<ApiResponse<{ accounts: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/accounts", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Add a new account
  addAccount: async (
    accountUserId: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/accounts/add", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountUserId,
        accessToken,
        refreshToken,
      }),
    });
  },

  // Switch to a different account
  switchAccount: async (accountId: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/accounts/switch/${accountId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Remove an account
  removeAccount: async (accountId: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/accounts/${accountId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get active account
  getActiveAccount: async (): Promise<ApiResponse<{ account: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/accounts/active", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Groups API
export const groupsApi = {
  // Create a new group
  createGroup: async (data: {
    name: string;
    description?: string;
    iconUrl: string;
    coverPhotoUrl?: string;
    joinSetting?: string;
    category?: string;
  }): Promise<ApiResponse<{ group: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/groups", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Get all groups
  getAllGroups: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{ groups: unknown[]; pagination: unknown }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    return apiCall(`/groups?${queryParams.toString()}`, {
      method: "GET",
    });
  },

  // Get group by ID
  getGroupById: async (
    id: string,
  ): Promise<ApiResponse<{ group: unknown }>> => {
    const token = storage.getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiCall(`/groups/${id}`, {
      method: "GET",
      headers: headers,
    });
  },

  // Update group
  updateGroup: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      iconUrl?: string;
      coverPhotoUrl?: string;
      joinSetting?: string;
    },
  ): Promise<ApiResponse<{ group: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Delete group
  deleteGroup: async (id: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Join a group
  joinGroup: async (id: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Leave a group
  leaveGroup: async (id: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get group members
  getGroupMembers: async (
    id: string,
  ): Promise<ApiResponse<{ members: unknown[] }>> => {
    return apiCall(`/groups/${id}/members`, {
      method: "GET",
    });
  },

  // Get user's groups (current authenticated user)
  getUserGroups: async (): Promise<ApiResponse<{ groups: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/user/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get feed of recent wall posts from user's groups
  getMyGroupFeed: async (limit = 20, offset = 0): Promise<ApiResponse<{ posts: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return { success: false, error: "No authentication token found" };
    }
    return apiCall(`/groups/feed/me?limit=${limit}&offset=${offset}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get groups for a specific user (public)
  getGroupsForUser: async (userId: string): Promise<ApiResponse<{ groups: unknown[] }>> => {
    return apiCall(`/groups/user/${userId}`, {
      method: "GET",
    });
  },

  // Get group games
  getGroupGames: async (
    id: string,
  ): Promise<ApiResponse<{ games: unknown[] }>> => {
    return apiCall(`/groups/${id}/games`, {
      method: "GET",
    });
  },

  // Get group wall posts
  getGroupWallPosts: async (
    id: string,
    page?: number,
    limit?: number,
  ): Promise<ApiResponse<{ posts: unknown[]; pagination: unknown }>> => {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (limit) queryParams.append("limit", limit.toString());

    return apiCall(`/groups/${id}/wall?${queryParams.toString()}`, {
      method: "GET",
    });
  },

  // Create group wall post
  createGroupWallPost: async (
    id: string,
    content: string,
    imageUrl?: string,
  ): Promise<ApiResponse<{ post: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/wall`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, imageUrl }),
    });
  },

  // Make group primary
  makePrimaryGroup: async (id: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/primary`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Remove member from group
  removeMember: async (id: string, userId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/members/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Ban a member from the group
  banMember: async (id: string, userId: string, reason?: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/members/${userId}/ban`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
  },

  // Unban a member from the group
  unbanMember: async (id: string, userId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/bans/${userId}/unban`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get banned users for a group
  getGroupBans: async (id: string): Promise<ApiResponse<{ bans: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/bans`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get audit logs for a group (owner only)
  getGroupAuditLogs: async (id: string, offset = 0): Promise<ApiResponse<{ logs: unknown[]; total: number }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/audit-logs?offset=${offset}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Update member role
  updateMemberRole: async (
    id: string,
    userId: string,
    roleId: string | null,
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/members/${userId}/role`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roleId }),
    });
  },

  // Report group
  reportGroup: async (
    id: string,
    category: string,
    description?: string,
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, description }),
    });
  },

  // Get group roles
  getGroupRoles: async (
    id: string,
  ): Promise<ApiResponse<{ roles: unknown[] }>> => {
    return apiCall(`/groups/${id}/roles`, {
      method: "GET",
    });
  },

  // Get group settings
  getGroupSettings: async (
    id: string,
  ): Promise<ApiResponse<{ settings: unknown }>> => {
    return apiCall(`/groups/${id}/settings`, {
      method: "GET",
    });
  },

  // Update group settings
  updateGroupSettings: async (
    id: string,
    data: {
      manualApproval?: boolean;
      verificationLevel?: string;
      accountAgeRequirement?: string;
      wallEnabled?: boolean;
      wallPostPermission?: string;
    },
  ): Promise<ApiResponse<{ settings: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/settings`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Get group social links
  getGroupSocialLinks: async (
    id: string,
  ): Promise<ApiResponse<{ socialLinks: unknown }>> => {
    return apiCall(`/groups/${id}/social-links`, {
      method: "GET",
    });
  },

  // Update group social links
  updateGroupSocialLinks: async (
    id: string,
    data: {
      discord?: string;
      twitter?: string;
      youtube?: string;
      twitch?: string;
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      website?: string;
      discord_title?: string;
      twitter_title?: string;
      youtube_title?: string;
      twitch_title?: string;
      facebook_title?: string;
      instagram_title?: string;
      tiktok_title?: string;
      website_title?: string;
    },
  ): Promise<ApiResponse<{ socialLinks: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/social-links`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Create group role
  createGroupRole: async (
    id: string,
    data: {
      name: string;
      description?: string;
      rank?: number;
      canPostOnWall?: boolean;
      canDeleteWallPosts?: boolean;
      canPostShout?: boolean;
      canManageMembers?: boolean;
      canDeleteMembers?: boolean;
      canBanMembers?: boolean;
      canSpendGroupFunds?: boolean;
      canAdvertiseGroup?: boolean;
      canManageAds?: boolean;
      canManageAlliances?: boolean;
      canManageRoles?: boolean;
      canManageStore?: boolean;
      canManageGames?: boolean;
    },
  ): Promise<ApiResponse<{ role: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Update group role
  updateGroupRole: async (
    id: string,
    roleId: string,
    data: {
      name?: string;
      description?: string;
      rank?: number;
      canPostOnWall?: boolean;
      canDeleteWallPosts?: boolean;
      canPostShout?: boolean;
      canManageMembers?: boolean;
      canDeleteMembers?: boolean;
      canBanMembers?: boolean;
      canSpendGroupFunds?: boolean;
      canAdvertiseGroup?: boolean;
      canManageAds?: boolean;
      canManageAlliances?: boolean;
      canManageRoles?: boolean;
      canManageStore?: boolean;
      canManageGames?: boolean;
    },
  ): Promise<ApiResponse<{ role: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/roles/${roleId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Delete group role
  deleteGroupRole: async (id: string, roleId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/roles/${roleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get group alliances
  getGroupAlliances: async (
    id: string,
  ): Promise<ApiResponse<{ alliances: unknown[] }>> => {
    return apiCall(`/groups/${id}/alliances`, {
      method: "GET",
    });
  },

  // Get alliance requests (owner only)
  getAllianceRequests: async (
    id: string,
  ): Promise<ApiResponse<{ requests: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/alliances/requests`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Send alliance request
  sendAllianceRequest: async (
    id: string,
    alliedGroupId: string,
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/alliances`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ alliedGroupId }),
    });
  },

  // Respond to alliance request
  respondToAllianceRequest: async (
    id: string,
    allianceId: string,
    action: "accept" | "decline",
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/alliances/${allianceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });
  },

  // Remove alliance
  removeAlliance: async (id: string, allianceId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/alliances/${allianceId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Update group shout
  updateGroupShout: async (
    id: string,
    shoutText: string,
    shoutImageUrl?: string,
  ): Promise<ApiResponse<{ shout: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/shout`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shoutText, shoutImageUrl }),
    });
  },

  // Get wall post replies
  getWallPostReplies: async (
    groupId: string,
    postId: string,
  ): Promise<ApiResponse<{ replies: unknown[] }>> => {
    return apiCall(`/groups/${groupId}/wall/${postId}/replies`, {
      method: "GET",
    });
  },

  // Create wall post reply
  createWallPostReply: async (
    groupId: string,
    postId: string,
    content: string,
  ): Promise<ApiResponse<{ reply: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${groupId}/wall/${postId}/replies`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
  },

  // Delete wall post reply
  deleteWallPostReply: async (
    groupId: string,
    postId: string,
    replyId: string,
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${groupId}/wall/${postId}/replies/${replyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

deleteGroupWallPost: async (
    groupId: string,
    postId: string,
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }
    return apiCall(`/groups/${groupId}/wall/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get join requests for a group
  getJoinRequests: async (
    id: string,
  ): Promise<ApiResponse<{ requests: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${id}/join-requests`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Accept a join request
  acceptJoinRequest: async (
    groupId: string,
    requestId: string,
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${groupId}/join-requests/${requestId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Reject a join request
  rejectJoinRequest: async (
    groupId: string,
    requestId: string,
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/groups/${groupId}/join-requests/${requestId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Search groups for alliances
  searchGroups: async (query: string): Promise<ApiResponse<{ groups: unknown[] }>> => {
    return apiCall(`/groups/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
    });
  },

  // Get group events
  getGroupEvents: async (id: string): Promise<ApiResponse<{ events: unknown[] }>> => {
    return apiCall(`/groups/${id}/events`, {
      method: "GET",
    });
  },

  // Create group event
  createGroupEvent: async (
    id: string,
    data: {
      title: string;
      description?: string;
      imageUrl?: string;
      startDate: string;
      endDate: string;
      location?: string;
    },
  ): Promise<ApiResponse<{ event: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return { success: false, error: "No authentication token found" };
    }

    return apiCall(`/groups/${id}/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Get group ads
  getGroupAds: async (id: string): Promise<ApiResponse<{ ads: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/ads`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Create group ad
  createGroupAd: async (
    id: string,
    data: { name: string; format: string; imageUrl: string; adSetName?: string; maxBid?: number },
  ): Promise<ApiResponse<{ ad: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/ads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Update group ad (pause/resume)
  updateGroupAd: async (id: string, adId: string, status: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/ads/${adId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
  },

  // Delete group ad
  deleteGroupAd: async (id: string, adId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/ads/${adId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get group store items
  getGroupStoreItems: async (id: string): Promise<ApiResponse<{ items: unknown[] }>> => {
    return apiCall(`/groups/${id}/store`, { method: "GET" });
  },

  // Create group store item
  createGroupStoreItem: async (
    id: string,
    data: { name: string; description?: string; price: number; imageUrl?: string; itemType?: string; stock?: number },
  ): Promise<ApiResponse<{ item: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/store`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Delete group store item
  deleteGroupStoreItem: async (id: string, itemId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/store/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Buy a group store item
  buyGroupStoreItem: async (id: string, itemId: string): Promise<ApiResponse<{ balance: number }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/store/${itemId}/buy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get group application form
  getApplicationForm: async (id: string): Promise<ApiResponse<{ form: unknown }>> => {
    return apiCall(`/groups/${id}/application`, { method: "GET" });
  },

  // Create/update group application form
  upsertApplicationForm: async (
    id: string,
    data: { questions: unknown[]; autoRankId?: string; isOpen?: boolean },
  ): Promise<ApiResponse<{ form: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/application`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Submit a group application
  submitApplication: async (id: string, answers: unknown[]): Promise<ApiResponse<{ application: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/application/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers }),
    });
  },

  // Get pending applications for review
  getApplicationReviews: async (id: string): Promise<ApiResponse<{ applications: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/application/reviews`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Accept or deny an application
  reviewApplication: async (id: string, applicationId: string, status: "accepted" | "denied"): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/application/${applicationId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
  },

  // Get the group's API key (owner only)
  getApiKey: async (id: string): Promise<ApiResponse<{ apiKey: string | null }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/api-key`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Generate (or regenerate) the group's API key (owner only)
  generateApiKey: async (id: string): Promise<ApiResponse<{ apiKey: string }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/api-key`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Delete group event
  deleteGroupEvent: async (id: string, eventId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return { success: false, error: "No authentication token found" };
    }

    return apiCall(`/groups/${id}/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get the group's current AdventureBux balance (owner only)
  getGroupBalance: async (id: string): Promise<ApiResponse<{ groupBalance: number }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/balance`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get recent payout history for a group (owner only)
  getGroupPayouts: async (id: string): Promise<ApiResponse<{ payouts: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/payouts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Gift AdventureBux from the current user to another user by username
  giftAdventureBux: async (
    data: { recipientUsername: string; amount: number },
  ): Promise<ApiResponse<{ balance: number }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall("/users/gift", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Send a payout from the group's balance to a member (owner only)
  createGroupPayout: async (
    id: string,
    data: { userId: string; amount: number; reason?: string },
  ): Promise<ApiResponse<{ groupBalance: number }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/groups/${id}/payout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },
};

// Upload API
export const uploadApi = {
  // Upload a single image
  uploadImage: async (
    file: File,
    type: string,
  ): Promise<
    ApiResponse<{ url: string; filename: string; type: string; size: number }>
  > => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Upload error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  // Upload multiple images
  uploadMultipleImages: async (
    files: File[],
    type: string,
  ): Promise<
    ApiResponse<{
      files: Array<{
        url: string;
        filename: string;
        type: string;
        size: number;
      }>;
    }>
  > => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("type", type);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Upload multiple error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },
};

// Friends API
export const friendsApi = {
  // Send friend request
  sendFriendRequest: async (receiverId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/friends/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiverId }),
    });
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/friends/accept/${requestId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Decline friend request
  declineFriendRequest: async (requestId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/friends/decline/${requestId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/friends/${friendId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get friends list (current user)
  getFriends: async (): Promise<ApiResponse<{ friends: unknown[]; count: number }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/friends", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get friends list for a specific user (public)
  getUserFriends: async (userId: string): Promise<ApiResponse<{ friends: unknown[]; count: number }>> => {
    return apiCall(`/friends/user/${userId}`, {
      method: "GET",
    });
  },

  // Get friend requests
  getFriendRequests: async (): Promise<ApiResponse<{ received: unknown[]; sent: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/friends/requests", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Add to best friends
  addBestFriend: async (friendId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/friends/best/${friendId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Remove best friend
  removeBestFriend: async (friendId: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/friends/best/${friendId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get best friends list
  getBestFriends: async (): Promise<ApiResponse<{ bestFriends: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/friends/best", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Block user
  blockUser: async (userId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/friends/block/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Messages API
export const notificationsApi = {
  // Get all notifications
  getNotifications: async (): Promise<ApiResponse<{ notifications: any[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return apiCall("/notifications", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get unread count
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return apiCall("/notifications/unread-count", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return apiCall(`/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Mark all as read
  markAllAsRead: async (): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return apiCall("/notifications/read-all", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export const messagesApi = {
  // Get all conversations
  getConversations: async (): Promise<ApiResponse<{ conversations: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/messages/conversations", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get messages with a specific user
  getMessages: async (userId: string, limit = 50, offset = 0): Promise<ApiResponse<{ messages: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/messages/${userId}?limit=${limit}&offset=${offset}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Send a message (REST fallback)
  sendMessage: async (userId: string, content: string): Promise<ApiResponse<{ message: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/messages/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/messages/${messageId}/read`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Unblock user
  unblockUser: async (userId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall(`/friends/unblock/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get blocked users
  getBlockedUsers: async (): Promise<ApiResponse<{ blocked: unknown[] }>> => {
    const token = storage.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "No authentication token found",
      };
    }

    return apiCall("/friends/blocked", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Search API
export const searchApi = {
  // Search users
  searchUsers: async (query: string, limit = 10): Promise<ApiResponse<{ users: unknown[]; query: string }>> => {
    const token = storage.getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiCall(`/search/users?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: "GET",
      headers,
    });
  },

  // Quick search for autocomplete
  quickSearch: async (query: string): Promise<ApiResponse<{ users: unknown[] }>> => {
    return apiCall(`/search/quick?q=${encodeURIComponent(query)}`, {
      method: "GET",
    });
  },

  // Search groups
  searchGroups: async (query: string, limit = 8): Promise<ApiResponse<{ groups: unknown[] }>> => {
    return apiCall(`/search/groups?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: "GET",
    });
  },

  // Search games
  searchGames: async (query: string, limit = 8): Promise<ApiResponse<{ games: unknown[] }>> => {
    return apiCall(`/search/games?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: "GET",
    });
  },
};

// Storage helpers for tokens ONLY
// User data should ALWAYS be fetched from API, never stored in localStorage
export const storage = {
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  },

  clearTokens: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
};

// Catalog API
export const catalogApi = {
  getItems: async (params: {
    category?: string;
    subcategory?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
    itemType?: string;
    available?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && value !== "All") {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    return apiCall<{
      items: Array<{
        id: string;
        name: string;
        description: string;
        creatorName: string;
        category: string;
        subcategory: string;
        itemType: string;
        thumbnailUrl: string;
        robloxAssetId: string;
        isAvailable: boolean;
        isFeatured: boolean;
        tags: string[];
        favoriteCount: number;
        salesCount: number;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
      };
    }>(`/catalog/items${queryString ? `?${queryString}` : ""}`);
  },

  getItemById: async (id: string) => {
    return apiCall<{
      item: {
        id: string;
        name: string;
        description: string;
        creatorName: string;
        category: string;
        subcategory: string;
        itemType: string;
        thumbnailUrl: string;
        robloxAssetId: string;
        isAvailable: boolean;
        isFeatured: boolean;
        tags: string[];
        favoriteCount: number;
        salesCount: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/catalog/items/${id}`);
  },

  getCategories: async () => {
    return apiCall<{
      categories: Array<{ category: string; itemCount: string }>;
    }>("/catalog/categories");
  },

  getSubcategories: async (category: string) => {
    return apiCall<{
      subcategories: Array<{ subcategory: string; itemCount: string }>;
    }>(`/catalog/subcategories/${encodeURIComponent(category)}`);
  },
getUserInventory: async (params: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    const queryParams = new URLSearchParams();
    if (params.category && params.category !== "All") queryParams.append("category", params.category);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    return apiCall(`/catalog/inventory${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
},
addToInventory: async (itemId: string) => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/catalog/inventory/${itemId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
searchRobloxCatalog: async (params: {
    keyword?: string;
    category?: string;
    bundleType?: string | number;
    itemType?: string;
    isEmote?: boolean;
    assetTypes?: string;
    limit?: number;
    cursor?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.keyword) queryParams.append("keyword", params.keyword);
    if (params.category) queryParams.append("category", params.category);
    if (params.bundleType !== undefined) queryParams.append("bundleType", String(params.bundleType));
    if (params.itemType) queryParams.append("itemType", params.itemType);
    if (params.isEmote !== undefined) queryParams.append("isEmote", String(params.isEmote));
    if (params.assetTypes) queryParams.append("assetTypes", params.assetTypes);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.cursor) queryParams.append("cursor", params.cursor);
    return apiCall(`/catalog/roblox/search?${queryParams.toString()}`, {
      method: "GET",
    });
  },
};

// Feed API (Homepage wall)
export const feedApi = {
  getPosts: async (limit = 20, offset = 0): Promise<ApiResponse<{ posts: unknown[] }>> => {
    const token = storage.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return apiCall(`/feed?limit=${limit}&offset=${offset}`, { method: "GET", headers });
  },

  createPost: async (data: { content?: string; imageUrl?: string }): Promise<ApiResponse<{ post: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall("/feed", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deletePost: async (id: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/feed/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  toggleLike: async (id: string): Promise<ApiResponse<{ liked: boolean }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/feed/${id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getComments: async (id: string): Promise<ApiResponse<{ comments: unknown[] }>> => {
    return apiCall(`/feed/${id}/comments`, { method: "GET" });
  },

  createComment: async (id: string, content: string): Promise<ApiResponse<{ comment: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/feed/${id}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
  },
};

export const adsApi = {
  createAd: async (data: {
    name: string;
    format: string;
    imageUrl: string;
    bidPerDay: number;
    groupId?: string;
    gameId?: string;
    profileId?: string;
  }): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    return apiCall('/ads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  getMyAds: async (): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    return apiCall('/ads/my', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  deleteAd: async (id: string): Promise<ApiResponse<unknown>> => {
    const token = storage.getAccessToken();
    return apiCall(`/ads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  serveAd: async (format: string): Promise<ApiResponse<unknown>> => {
    return apiCall(`/ads/serve/${format}`);
  },

  trackClick: async (id: string): Promise<ApiResponse<unknown>> => {
    return apiCall(`/ads/${id}/click`, { method: 'POST' });
  },
};

export interface VoiceParticipant {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  joined_at: string;
}

export interface VoiceSignal {
  id: string;
  from_user_id: string;
  signal_type: "offer" | "answer" | "ice-candidate";
  payload: any;
  created_at: string;
}

export const voiceApi = {
  createRoom: async (groupId: string): Promise<ApiResponse<{ roomId: string; participants: VoiceParticipant[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/voice/rooms`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ groupId }),
    });
  },

  getActiveRoom: async (groupId: string): Promise<ApiResponse<{ room: { id: string } | null; participants: VoiceParticipant[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/voice/rooms/${groupId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  joinRoom: async (roomId: string): Promise<ApiResponse<{ participants: VoiceParticipant[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/voice/rooms/${roomId}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  leaveRoom: async (roomId: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/voice/rooms/${roomId}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  sendSignal: async (
    roomId: string,
    data: { toUserId: string; signalType: "offer" | "answer" | "ice-candidate"; payload: any },
  ): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/voice/rooms/${roomId}/signal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  getSignals: async (roomId: string): Promise<ApiResponse<{ signals: VoiceSignal[] }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/voice/rooms/${roomId}/signals`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// DevForum API
export const forumApi = {
  // Get all forum categories with thread counts and latest activity
  getCategories: async (): Promise<ApiResponse<{ categories: unknown[] }>> => {
    return apiCall("/forum/categories", { method: "GET" });
  },

  // Get threads in a category (paginated)
  getCategoryThreads: async (
    slug: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<{ category: unknown; threads: unknown[]; pagination: unknown }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const query = queryParams.toString();
    return apiCall(`/forum/categories/${slug}/threads${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  // Get a single thread with its replies
  getThread: async (id: string): Promise<ApiResponse<{ thread: unknown; replies: unknown[] }>> => {
    return apiCall(`/forum/threads/${id}`, { method: "GET" });
  },

  // Create a new thread
  createThread: async (data: {
    categoryId: string;
    title: string;
    content: string;
  }): Promise<ApiResponse<{ thread: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall("/forum/threads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Add a reply to a thread
  createReply: async (threadId: string, content: string): Promise<ApiResponse<{ reply: unknown }>> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/forum/threads/${threadId}/replies`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
  },

  // Delete a thread (author or admin only)
  deleteThread: async (id: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/forum/threads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Delete a reply (author or admin only)
  deleteReply: async (id: string): Promise<ApiResponse> => {
    const token = storage.getAccessToken();
    if (!token) return { success: false, error: "No authentication token found" };
    return apiCall(`/forum/replies/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
