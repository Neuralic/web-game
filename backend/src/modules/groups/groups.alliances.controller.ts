import { Response } from "express";
import db from '../../lib/db.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from "uuid";

/**
 * @route   GET /api/v1/groups/:id/alliances
 * @desc    Get all alliances for a group
 * @access  Public
 */
export const getGroupAlliances = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const alliancesResult = await db.query(
      `SELECT
        ga.id,
        ga."groupId" as group_id,
        ga."alliedGroupId" as allied_group_id,
        ga.status,
        ga."requestedBy" as requested_by,
        ga."requestedAt" as requested_at,
        ga."respondedAt" as responded_at,
        ga."createdAt" as created_at,
        g.name as allied_group_name,
        g."iconUrl" as allied_group_icon,
        g."memberCount" as allied_group_member_count,
        g."isVerified" as allied_group_verified
      FROM group_alliances ga
      LEFT JOIN groups g ON ga."alliedGroupId" = g.id
      WHERE ga."groupId" = $1 AND ga.status = 'accepted'
      ORDER BY ga."createdAt" DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        alliances: alliancesResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching group alliances:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   GET /api/v1/groups/:id/alliances/requests
 * @desc    Get pending alliance requests for a group
 * @access  Private (Owner only)
 */
export const getAllianceRequests = async (
  req: AuthRequest,
  res: Response
) => {
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
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id]
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
        message: "Only the group owner can view alliance requests",
      });
    }

    // Get incoming alliance requests
    const requestsResult = await db.query(
      `SELECT
        ga.id,
        ga."groupId" as group_id,
        ga."alliedGroupId" as allied_group_id,
        ga.status,
        ga."requestedBy" as requested_by,
        ga."requestedAt" as requested_at,
        g.name as requesting_group_name,
        g."iconUrl" as requesting_group_icon,
        g."memberCount" as requesting_group_member_count,
        g."isVerified" as requesting_group_verified
      FROM group_alliances ga
      LEFT JOIN groups g ON ga."requestedBy" = g.id
      WHERE ga."alliedGroupId" = $1 AND ga.status = 'pending'
      ORDER BY ga."requestedAt" DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        requests: requestsResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching alliance requests:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/alliances
 * @desc    Send alliance request to another group
 * @access  Private (Owner only)
 */
export const sendAllianceRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { alliedGroupId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!alliedGroupId) {
      return res.status(400).json({
        success: false,
        message: "Allied group ID is required",
      });
    }

    // Check if user is the owner of the requesting group
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id]
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
        message: "Only the group owner can send alliance requests",
      });
    }

    // Check if target group exists
    const targetGroupResult = await db.query(
      `SELECT id FROM groups WHERE id = $1`,
      [alliedGroupId]
    );

    if (targetGroupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target group not found",
      });
    }

    // Can't ally with yourself
    if (id === alliedGroupId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create alliance with your own group",
      });
    }

    // Check if alliance already exists (in either direction)
    const existingAlliance = await db.query(
      `SELECT id, status FROM group_alliances
       WHERE ("groupId" = $1 AND "alliedGroupId" = $2)
       OR ("groupId" = $2 AND "alliedGroupId" = $1)`,
      [id, alliedGroupId]
    );

    if (existingAlliance.rows.length > 0) {
      const alliance = existingAlliance.rows[0];
      if (alliance.status === "accepted") {
        return res.status(409).json({
          success: false,
          message: "Alliance already exists",
        });
      } else if (alliance.status === "pending") {
        return res.status(409).json({
          success: false,
          message: "Alliance request already pending",
        });
      }
    }

    // Create alliance request
    const allianceId = uuidv4();
    await db.query(
      `INSERT INTO group_alliances (
        id,
        "groupId",
        "alliedGroupId",
        "requestedBy",
        status
      ) VALUES ($1, $2, $3, $4, 'pending')`,
      [allianceId, id, alliedGroupId, id]
    );

    return res.status(201).json({
      success: true,
      message: "Alliance request sent successfully",
    });
  } catch (error) {
    console.error("Error sending alliance request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   PATCH /api/v1/groups/:id/alliances/:allianceId
 * @desc    Accept or decline an alliance request
 * @access  Private (Owner only)
 */
export const respondToAllianceRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const { id, allianceId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!action || !["accept", "decline"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'accept' or 'decline'",
      });
    }

    // Check if user is the owner of the group receiving the request
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id]
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
        message: "Only the group owner can respond to alliance requests",
      });
    }

    // Check if alliance request exists and is pending
    const allianceResult = await db.query(
      `SELECT * FROM group_alliances WHERE id = $1 AND "alliedGroupId" = $2 AND status = 'pending'`,
      [allianceId, id]
    );

    if (allianceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Alliance request not found or already responded",
      });
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    // Update alliance status
    await db.query(
      `UPDATE group_alliances
       SET status = $1, "respondedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $2`,
      [newStatus, allianceId]
    );

    // If accepted, create the reciprocal alliance
    if (action === "accept") {
      const alliance = allianceResult.rows[0];
      const reciprocalId = uuidv4();
      await db.query(
        `INSERT INTO group_alliances (
          id,
          "groupId",
          "alliedGroupId",
          "requestedBy",
          status,
          "respondedAt"
        ) VALUES ($1, $2, $3, $4, 'accepted', NOW())`,
        [reciprocalId, id, alliance.groupId, alliance.groupId]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Alliance request ${action}ed successfully`,
    });
  } catch (error) {
    console.error("Error responding to alliance request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id/alliances/:allianceId
 * @desc    Remove an alliance
 * @access  Private (Owner only)
 */
export const removeAlliance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, allianceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      `SELECT "ownerId" FROM groups WHERE id = $1`,
      [id]
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
        message: "Only the group owner can remove alliances",
      });
    }

    // Get the alliance to find the reciprocal alliance
    const allianceResult = await db.query(
      `SELECT * FROM group_alliances WHERE id = $1 AND "groupId" = $2`,
      [allianceId, id]
    );

    if (allianceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Alliance not found",
      });
    }

    const alliance = allianceResult.rows[0];

    // Delete the alliance
    await db.query(`DELETE FROM group_alliances WHERE id = $1`, [allianceId]);

    // Delete the reciprocal alliance
    await db.query(
      `DELETE FROM group_alliances WHERE "groupId" = $1 AND "alliedGroupId" = $2`,
      [alliance.alliedGroupId, alliance.groupId]
    );

    return res.status(200).json({
      success: true,
      message: "Alliance removed successfully",
    });
  } catch (error) {
    console.error("Error removing alliance:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
