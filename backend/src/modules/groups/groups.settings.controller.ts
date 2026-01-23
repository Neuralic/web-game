import { Response } from "express";
import db from "../../lib/db";
import { AuthRequest } from "../../middleware/auth.middleware";

/**
 * @route   GET /api/v1/groups/:id/settings
 * @desc    Get group settings
 * @access  Public
 */
export const getGroupSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const settingsResult = await db.query(
      `SELECT
        id,
        "groupId" as group_id,
        "manualApproval" as manual_approval,
        "verificationLevel" as verification_level,
        "accountAgeRequirement" as account_age_requirement,
        "wallEnabled" as wall_enabled,
        "wallPostPermission" as wall_post_permission,
        "createdAt" as created_at,
        "updatedAt" as updated_at
      FROM group_settings
      WHERE "groupId" = $1`,
      [id],
    );

    if (settingsResult.rows.length === 0) {
      // Create default settings if they don't exist
      const createResult = await db.query(
        `INSERT INTO group_settings ("groupId")
         VALUES ($1)
         RETURNING
           id,
           "groupId" as group_id,
           "manualApproval" as manual_approval,
           "verificationLevel" as verification_level,
           "accountAgeRequirement" as account_age_requirement,
           "wallEnabled" as wall_enabled,
           "wallPostPermission" as wall_post_permission,
           "createdAt" as created_at,
           "updatedAt" as updated_at`,
        [id],
      );

      return res.status(200).json({
        success: true,
        data: {
          settings: createResult.rows[0],
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        settings: settingsResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Get group settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   PUT /api/v1/groups/:id/settings
 * @desc    Update group settings
 * @access  Private (Owner only)
 */
export const updateGroupSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [id],
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (groupResult.rows[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can update settings",
      });
    }

    const {
      manualApproval,
      verificationLevel,
      accountAgeRequirement,
      wallEnabled,
      wallPostPermission,
    } = req.body;

    // Check if settings exist
    const existingSettings = await db.query(
      'SELECT id FROM group_settings WHERE "groupId" = $1',
      [id],
    );

    let settingsResult;

    if (existingSettings.rows.length === 0) {
      // Create new settings
      settingsResult = await db.query(
        `INSERT INTO group_settings (
          "groupId",
          "manualApproval",
          "verificationLevel",
          "accountAgeRequirement",
          "wallEnabled",
          "wallPostPermission",
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING
          id,
          "groupId" as group_id,
          "manualApproval" as manual_approval,
          "verificationLevel" as verification_level,
          "accountAgeRequirement" as account_age_requirement,
          "wallEnabled" as wall_enabled,
          "wallPostPermission" as wall_post_permission,
          "createdAt" as created_at,
          "updatedAt" as updated_at`,
        [
          id,
          manualApproval ?? false,
          verificationLevel ?? "none",
          accountAgeRequirement ?? "none",
          wallEnabled ?? true,
          wallPostPermission ?? "all",
        ],
      );
    } else {
      // Update existing settings
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (manualApproval !== undefined) {
        updates.push(`"manualApproval" = $${paramIndex}`);
        values.push(manualApproval);
        paramIndex++;
      }

      if (verificationLevel !== undefined) {
        updates.push(`"verificationLevel" = $${paramIndex}`);
        values.push(verificationLevel);
        paramIndex++;
      }

      if (accountAgeRequirement !== undefined) {
        updates.push(`"accountAgeRequirement" = $${paramIndex}`);
        values.push(accountAgeRequirement);
        paramIndex++;
      }

      if (wallEnabled !== undefined) {
        updates.push(`"wallEnabled" = $${paramIndex}`);
        values.push(wallEnabled);
        paramIndex++;
      }

      if (wallPostPermission !== undefined) {
        updates.push(`"wallPostPermission" = $${paramIndex}`);
        values.push(wallPostPermission);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      updates.push(`"updatedAt" = NOW()`);
      values.push(id);

      settingsResult = await db.query(
        `UPDATE group_settings
         SET ${updates.join(", ")}
         WHERE "groupId" = $${paramIndex}
         RETURNING
           id,
           "groupId" as group_id,
           "manualApproval" as manual_approval,
           "verificationLevel" as verification_level,
           "accountAgeRequirement" as account_age_requirement,
           "wallEnabled" as wall_enabled,
           "wallPostPermission" as wall_post_permission,
           "createdAt" as created_at,
           "updatedAt" as updated_at`,
        values,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Group settings updated successfully",
      data: {
        settings: settingsResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Update group settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
