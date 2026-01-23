import { Request, Response } from "express";
import db from '../../lib/db.js';

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Fetch user profile with profile data
    const userResult = await db.query(
      `SELECT
        u.id,
        u.username,
        u."displayName" as display_name,
        u.email,
        u."birthMonth" as birth_month,
        u."birthDay" as birth_day,
        u."birthYear" as birth_year,
        u.gender,
        u."isVerified" as is_verified,
        u."isPlayer" as is_player,
        u."isStudio" as is_studio,
        u."isPremium" as is_premium,
        u."lastLogin" as last_login,
        u."createdAt" as created_at,
        p.bio,
        p.status,
        p."avatarUrl" as avatar_url,
        p."profileTheme" as profile_theme,
        p."profileVisibility" as profile_visibility,
        p."canReceiveFriendRequests" as can_receive_friend_requests,
        p."canReceiveMessages" as can_receive_messages,
        p."showOnlineStatus" as show_online_status,
        p."showLastSeen" as show_last_seen,
        p."visitCount" as visit_count,
        p."placeVisits" as place_visits,
        p."presenceStatus" as presence_status,
        p."currentGame" as current_game,
        p."lastSeen" as last_seen
      FROM users u
      LEFT JOIN profiles p ON u.id = p."userId"
      WHERE u.id = $1`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   GET /api/v1/users/:username
 * @desc    Get user profile by username
 * @access  Public
 */
export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // Fetch user profile with profile data
    const userResult = await db.query(
      `SELECT
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        u."isPlayer" as is_player,
        u."isStudio" as is_studio,
        u."createdAt" as created_at,
        p.bio,
        p.status,
        p."avatarUrl" as avatar_url,
        p."profileVisibility" as profile_visibility,
        p."visitCount" as visit_count,
        p."placeVisits" as place_visits,
        p."presenceStatus" as presence_status,
        p."currentGame" as current_game,
        p."lastSeen" as last_seen
      FROM users u
      LEFT JOIN profiles p ON u.id = p."userId"
      WHERE u.username = $1 AND u."isBanned" = false`,
      [username],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Check profile visibility
    if (user.profile_visibility === "private") {
      return res.status(403).json({
        success: false,
        message: "This profile is private",
      });
    }

    // Increment visit count
    await db.query(
      `UPDATE profiles SET "visitCount" = "visitCount" + 1 WHERE "userId" = $1`,
      [user.id],
    );

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get user by username error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { displayName, username, bio, status } = req.body;

    // Validate displayName if provided
    if (displayName) {
      if (displayName.length < 3 || displayName.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Display name must be between 3 and 50 characters",
        });
      }
    }

    // Validate username if provided
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 20 characters",
        });
      }

      // Check if username is alphanumeric with underscores only
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          message:
            "Username can only contain letters, numbers, and underscores",
        });
      }

      // Check if username is already taken by another user
      const existingUser = await db.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, userId],
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    // Validate bio if provided
    if (bio && bio.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 1000 characters",
      });
    }

    // Validate status if provided
    if (status && status.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Status cannot exceed 255 characters",
      });
    }

    // Update user table if displayName or username is provided
    const userUpdates: string[] = [];
    const userValues: any[] = [];
    let userParamIndex = 1;

    if (displayName !== undefined) {
      userUpdates.push(`"displayName" = $${userParamIndex}`);
      userValues.push(displayName);
      userParamIndex++;
    }

    if (username !== undefined) {
      userUpdates.push(`username = $${userParamIndex}`);
      userValues.push(username);
      userParamIndex++;
    }

    if (userUpdates.length > 0) {
      userUpdates.push(`"updatedAt" = NOW()`);
      userValues.push(userId);

      await db.query(
        `UPDATE users SET ${userUpdates.join(", ")} WHERE id = $${userParamIndex}`,
        userValues,
      );
    }

    // Check if profile exists
    const profileCheck = await db.query(
      `SELECT id FROM profiles WHERE "userId" = $1`,
      [userId],
    );

    if (profileCheck.rows.length === 0) {
      // Create profile if it doesn't exist
      await db.query(
        `INSERT INTO profiles (id, "userId", bio, status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::TEXT, $1, $2, $3, NOW(), NOW())`,
        [userId, bio || null, status || null],
      );
    } else {
      // Update existing profile
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (bio !== undefined) {
        updates.push(`bio = $${paramIndex}`);
        values.push(bio);
        paramIndex++;
      }

      if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      if (updates.length > 0) {
        updates.push(`"updatedAt" = NOW()`);
        values.push(userId);

        await db.query(
          `UPDATE profiles SET ${updates.join(", ")} WHERE "userId" = $${paramIndex}`,
          values,
        );
      }
    }

    // Fetch updated profile
    const updatedProfile = await db.query(
      `SELECT
        u.id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified,
        p.bio,
        p.status,
        p."updatedAt" as updated_at
      FROM users u
      LEFT JOIN profiles p ON u.id = p."userId"
      WHERE u.id = $1`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedProfile.rows[0],
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/users/profile/settings
 * @desc    Update profile privacy settings
 * @access  Private
 */
export const updateProfileSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      profileVisibility,
      canReceiveFriendRequests,
      canReceiveMessages,
      showOnlineStatus,
      showLastSeen,
      profileTheme,
    } = req.body;

    // Validate enum values
    const validVisibility = ["public", "friends", "private"];
    const validPermissions = ["everyone", "friends", "no_one"];

    if (profileVisibility && !validVisibility.includes(profileVisibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile visibility setting",
      });
    }

    if (
      canReceiveFriendRequests &&
      !validPermissions.includes(canReceiveFriendRequests)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid friend request setting",
      });
    }

    if (canReceiveMessages && !validPermissions.includes(canReceiveMessages)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message setting",
      });
    }

    // Check if profile exists
    const profileCheck = await db.query(
      `SELECT id FROM profiles WHERE "userId" = $1`,
      [userId],
    );

    if (profileCheck.rows.length === 0) {
      // Create profile with settings
      await db.query(
        `INSERT INTO profiles (id, "userId", "profileVisibility", "canReceiveFriendRequests",
         "canReceiveMessages", "showOnlineStatus", "showLastSeen", "profileTheme", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::TEXT, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          userId,
          profileVisibility || "public",
          canReceiveFriendRequests || "everyone",
          canReceiveMessages || "everyone",
          showOnlineStatus !== undefined ? showOnlineStatus : true,
          showLastSeen !== undefined ? showLastSeen : true,
          profileTheme || "default",
        ],
      );
    } else {
      // Update existing profile settings
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (profileVisibility !== undefined) {
        updates.push(`"profileVisibility" = $${paramIndex}`);
        values.push(profileVisibility);
        paramIndex++;
      }

      if (canReceiveFriendRequests !== undefined) {
        updates.push(`"canReceiveFriendRequests" = $${paramIndex}`);
        values.push(canReceiveFriendRequests);
        paramIndex++;
      }

      if (canReceiveMessages !== undefined) {
        updates.push(`"canReceiveMessages" = $${paramIndex}`);
        values.push(canReceiveMessages);
        paramIndex++;
      }

      if (showOnlineStatus !== undefined) {
        updates.push(`"showOnlineStatus" = $${paramIndex}`);
        values.push(showOnlineStatus);
        paramIndex++;
      }

      if (showLastSeen !== undefined) {
        updates.push(`"showLastSeen" = $${paramIndex}`);
        values.push(showLastSeen);
        paramIndex++;
      }

      if (profileTheme !== undefined) {
        updates.push(`"profileTheme" = $${paramIndex}`);
        values.push(profileTheme);
        paramIndex++;
      }

      if (updates.length > 0) {
        updates.push(`"updatedAt" = NOW()`);
        values.push(userId);

        await db.query(
          `UPDATE profiles SET ${updates.join(", ")} WHERE "userId" = $${paramIndex}`,
          values,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile settings updated successfully",
    });
  } catch (error) {
    console.error("Update profile settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
