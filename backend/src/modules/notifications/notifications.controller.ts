import { Request, Response } from "express";
import db from "../../config/database.js";

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await db.query(
      `SELECT 
        n.id,
        n.type,
        n.content,
        n."isRead" as is_read,
        n."createdAt" as created_at,
        n."relatedUserId" as related_user_id,
        n."relatedItemId" as related_item_id,
        u.username as related_username,
        u."displayName" as related_display_name,
        u."avatarUrl" as related_avatar_url,
        u."isVerified" as related_is_verified
      FROM notifications n
      LEFT JOIN users u ON n."relatedUserId" = u.id
      WHERE n."userId" = $1
      ORDER BY n."createdAt" DESC
      LIMIT 50`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        notifications: result.rows,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await db.query(
      `SELECT COUNT(*) as count
      FROM notifications
      WHERE "userId" = $1 AND "isRead" = false`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        count: parseInt(result.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await db.query(
      `UPDATE notifications
      SET "isRead" = true
      WHERE id = $1 AND "userId" = $2`,
      [id, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await db.query(
      `UPDATE notifications
      SET "isRead" = true
      WHERE "userId" = $1 AND "isRead" = false`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/notifications
 * @desc    Create a notification (internal use)
 * @access  Private
 */
export const createNotification = async (
  userId: string,
  type: string,
  content: string,
  relatedUserId?: string,
  relatedItemId?: string
) => {
  try {
    const result = await db.query(
      `INSERT INTO notifications ("userId", type, content, "relatedUserId", "relatedItemId", "isRead", "createdAt")
      VALUES ($1, $2, $3, $4, $5, false, NOW())
      RETURNING *`,
      [userId, type, content, relatedUserId || null, relatedItemId || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
};
