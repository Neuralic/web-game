import { Response } from "express";
import db from '../../lib/db.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { v4 as uuidv4 } from "uuid";

const resolveGroupId = async (id: string): Promise<string | null> => {
  const isNumeric = /^\d+$/.test(id);
  const result = await db.query(
    isNumeric
      ? 'SELECT id FROM groups WHERE "groupNumber" = $1'
      : 'SELECT id FROM groups WHERE id = $1',
    [isNumeric ? parseInt(id, 10) : id],
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
};

/**
 * @route   GET /api/v1/groups/:id/ads
 * @desc    Get all ads for a group
 * @access  Private (Owner only)
 */
export const getGroupAds = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const adsResult = await db.query(
      `SELECT
        id,
        "groupId" as group_id,
        name,
        format,
        "imageUrl" as image_url,
        "adSetName" as ad_set_name,
        "maxBid" as max_bid,
        status,
        impressions,
        clicks,
        spent,
        "createdAt" as created_at
      FROM group_ads
      WHERE "groupId" = $1
      ORDER BY "createdAt" DESC`,
      [groupId],
    );

    return res.status(200).json({
      success: true,
      data: {
        ads: adsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get group ads error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   POST /api/v1/groups/:id/ads
 * @desc    Create a new ad for a group
 * @access  Private (Owner only)
 */
export const createGroupAd = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, format, imageUrl, adSetName, maxBid } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!name || !imageUrl) {
      return res.status(400).json({ success: false, message: "Ad name and image are required" });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is the owner
    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [groupId],
    );

    if (groupResult.rows[0].ownerId !== userId) {
      return res.status(403).json({ success: false, message: "Only the group owner can create ads" });
    }

    const adId = uuidv4();
    const adResult = await db.query(
      `INSERT INTO group_ads (
        id, "groupId", "createdBy", name, format, "imageUrl", "adSetName", "maxBid", status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING
        id, "groupId" as group_id, name, format, "imageUrl" as image_url,
        "adSetName" as ad_set_name, "maxBid" as max_bid, status,
        impressions, clicks, spent, "createdAt" as created_at`,
      [adId, groupId, userId, name, format || 'banner', imageUrl, adSetName || null, maxBid || 0.10],
    );

    return res.status(201).json({
      success: true,
      message: "Ad created successfully. It will be reviewed by a moderator.",
      data: { ad: adResult.rows[0] },
    });
  } catch (error) {
    console.error("Create group ad error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   PATCH /api/v1/groups/:id/ads/:adId
 * @desc    Update ad status (pause/resume)
 * @access  Private (Owner only)
 */
export const updateGroupAd = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const adId = String(req.params.adId);
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [groupId],
    );

    if (groupResult.rows[0].ownerId !== userId) {
      return res.status(403).json({ success: false, message: "Only the group owner can manage ads" });
    }

    const validStatuses = ['running', 'paused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'running' or 'paused'" });
    }

    const updateResult = await db.query(
      `UPDATE group_ads SET status = $1, "updatedAt" = NOW()
       WHERE id = $2 AND "groupId" = $3
       RETURNING id, name, status`,
      [status, adId, groupId],
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Ad ${status === 'paused' ? 'paused' : 'resumed'} successfully`,
      data: { ad: updateResult.rows[0] },
    });
  } catch (error) {
    console.error("Update group ad error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id/ads/:adId
 * @desc    Delete a group ad
 * @access  Private (Owner only)
 */
export const deleteGroupAd = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const adId = String(req.params.adId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const groupResult = await db.query(
      'SELECT "ownerId" FROM groups WHERE id = $1',
      [groupId],
    );

    if (groupResult.rows[0].ownerId !== userId) {
      return res.status(403).json({ success: false, message: "Only the group owner can delete ads" });
    }

    const deleteResult = await db.query(
      `DELETE FROM group_ads WHERE id = $1 AND "groupId" = $2 RETURNING id`,
      [adId, groupId],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    return res.status(200).json({ success: true, message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Delete group ad error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
