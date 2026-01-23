import { Request, Response } from "express";
import db from '../../lib/db.js';

interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

/**
 * @route   GET /api/v1/accounts
 * @desc    Get all accounts for the current user
 * @access  Private
 */
export const getAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const primaryUserId = req.userId;

    if (!primaryUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get all accounts for this user
    const accountsResult = await db.query(
      `SELECT
        ua.id,
        ua."accountUserId" as account_user_id,
        ua."isActive" as is_active,
        ua."addedAt" as added_at,
        ua."lastUsedAt" as last_used_at,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified
      FROM user_accounts ua
      JOIN users u ON ua."accountUserId" = u.id
      WHERE ua."primaryUserId" = $1
      ORDER BY ua."lastUsedAt" DESC`,
      [primaryUserId],
    );

    return res.status(200).json({
      success: true,
      data: {
        accounts: accountsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/accounts/add
 * @desc    Add a new account (called after successful login/signup)
 * @access  Private
 */
export const addAccount = async (req: AuthRequest, res: Response) => {
  try {
    const primaryUserId = req.userId;
    const { accountUserId, accessToken, refreshToken } = req.body;

    if (!primaryUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!accountUserId || !accessToken || !refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if account already exists
    const existingAccount = await db.query(
      `SELECT id FROM user_accounts
       WHERE "primaryUserId" = $1 AND "accountUserId" = $2`,
      [primaryUserId, accountUserId],
    );

    if (existingAccount.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Account already added",
      });
    }

    // Set all other accounts to inactive
    await db.query(
      `UPDATE user_accounts SET "isActive" = false WHERE "primaryUserId" = $1`,
      [primaryUserId],
    );

    // Add new account
    const newAccountResult = await db.query(
      `INSERT INTO user_accounts
       ("primaryUserId", "accountUserId", "accessToken", "refreshToken", "isActive")
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, "accountUserId" as account_user_id, "isActive" as is_active, "addedAt" as added_at`,
      [primaryUserId, accountUserId, accessToken, refreshToken],
    );

    const newAccount = newAccountResult.rows[0];

    // Get user info for the new account
    const userResult = await db.query(
      `SELECT id, username, "displayName" as display_name, "isVerified" as is_verified
       FROM users WHERE id = $1`,
      [accountUserId],
    );

    return res.status(201).json({
      success: true,
      message: "Account added successfully",
      data: {
        account: {
          ...newAccount,
          ...userResult.rows[0],
        },
      },
    });
  } catch (error) {
    console.error("Add account error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/accounts/switch/:accountId
 * @desc    Switch to a different account
 * @access  Private
 */
export const switchAccount = async (req: AuthRequest, res: Response) => {
  try {
    const primaryUserId = req.userId;
    const { accountId } = req.params;

    if (!primaryUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get the account
    const accountResult = await db.query(
      `SELECT
        ua."accountUserId" as account_user_id,
        ua."accessToken" as access_token,
        ua."refreshToken" as refresh_token,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified
      FROM user_accounts ua
      JOIN users u ON ua."accountUserId" = u.id
      WHERE ua.id = $1 AND ua."primaryUserId" = $2`,
      [accountId, primaryUserId],
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const account = accountResult.rows[0];

    // Set all accounts to inactive
    await db.query(
      `UPDATE user_accounts SET "isActive" = false WHERE "primaryUserId" = $1`,
      [primaryUserId],
    );

    // Set this account as active and update lastUsedAt
    await db.query(
      `UPDATE user_accounts
       SET "isActive" = true, "lastUsedAt" = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [accountId],
    );

    return res.status(200).json({
      success: true,
      message: "Switched to account successfully",
      data: {
        user: {
          id: account.account_user_id,
          username: account.username,
          displayName: account.display_name,
          isVerified: account.is_verified,
        },
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
      },
    });
  } catch (error) {
    console.error("Switch account error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   DELETE /api/v1/accounts/:accountId
 * @desc    Remove an account
 * @access  Private
 */
export const removeAccount = async (req: AuthRequest, res: Response) => {
  try {
    const primaryUserId = req.userId;
    const { accountId } = req.params;

    if (!primaryUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Delete the account
    const deleteResult = await db.query(
      `DELETE FROM user_accounts
       WHERE id = $1 AND "primaryUserId" = $2
       RETURNING id`,
      [accountId, primaryUserId],
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account removed successfully",
    });
  } catch (error) {
    console.error("Remove account error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/v1/accounts/active
 * @desc    Get the currently active account
 * @access  Private
 */
export const getActiveAccount = async (req: AuthRequest, res: Response) => {
  try {
    const primaryUserId = req.userId;

    if (!primaryUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get active account
    const accountResult = await db.query(
      `SELECT
        ua.id,
        ua."accountUserId" as account_user_id,
        u.username,
        u."displayName" as display_name,
        u."isVerified" as is_verified
      FROM user_accounts ua
      JOIN users u ON ua."accountUserId" = u.id
      WHERE ua."primaryUserId" = $1 AND ua."isActive" = true
      LIMIT 1`,
      [primaryUserId],
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active account found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        account: accountResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Get active account error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
