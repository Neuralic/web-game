import { Request, Response } from "express";
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
 * @route   GET /api/v1/groups/:id/events
 * @desc    Get events for a group
 * @access  Public
 */
export const getGroupEvents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const groupId = await resolveGroupId(id);
    if (!groupId) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const eventsResult = await db.query(
      `SELECT
        ge.id,
        ge."groupId" as group_id,
        ge."createdBy" as created_by,
        ge.title,
        ge.description,
        ge."imageUrl" as image_url,
        ge."startDate" as start_date,
        ge."endDate" as end_date,
        ge.location,
        ge."isActive" as is_active,
        ge."createdAt" as created_at,
        u.username as created_by_username,
        u."displayName" as created_by_display_name
      FROM group_events ge
      LEFT JOIN users u ON ge."createdBy" = u.id
      WHERE ge."groupId" = $1 AND ge."isActive" = true
      ORDER BY ge."startDate" ASC`,
      [groupId],
    );

    return res.status(200).json({
      success: true,
      data: {
        events: eventsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get group events error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/groups/:id/events
 * @desc    Create a group event
 * @access  Private (Owner only)
 */
export const createGroupEvent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, description, imageUrl, startDate, endDate, location } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required",
      });
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
      return res.status(403).json({
        success: false,
        message: "Only the group owner can create events",
      });
    }

    const eventId = uuidv4();
    const eventResult = await db.query(
      `INSERT INTO group_events (
        id, "groupId", "createdBy", title, description, "imageUrl", "startDate", "endDate", location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        "groupId" as group_id,
        "createdBy" as created_by,
        title,
        description,
        "imageUrl" as image_url,
        "startDate" as start_date,
        "endDate" as end_date,
        location,
        "isActive" as is_active,
        "createdAt" as created_at`,
      [eventId, groupId, userId, title, description || null, imageUrl || null, startDate, endDate, location || null],
    );

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: {
        event: eventResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Create group event error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/groups/:id/events/:eventId
 * @desc    Delete a group event
 * @access  Private (Owner only)
 */
export const deleteGroupEvent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, eventId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
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
      return res.status(403).json({
        success: false,
        message: "Only the group owner can delete events",
      });
    }

    const deleteResult = await db.query(
      `DELETE FROM group_events WHERE id = $1 AND "groupId" = $2 RETURNING id`,
      [eventId, groupId],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete group event error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
