import { Router } from "express";
import {
  getAccounts,
  addAccount,
  switchAccount,
  removeAccount,
  getActiveAccount,
} from "./accounts.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @route   GET /api/v1/accounts
 * @desc    Get all accounts for the current user
 * @access  Private
 */
router.get("/", authMiddleware, getAccounts);

/**
 * @route   GET /api/v1/accounts/active
 * @desc    Get the currently active account
 * @access  Private
 */
router.get("/active", authMiddleware, getActiveAccount);

/**
 * @route   POST /api/v1/accounts/add
 * @desc    Add a new account (called after successful login/signup)
 * @access  Private
 */
router.post("/add", authMiddleware, addAccount);

/**
 * @route   POST /api/v1/accounts/switch/:accountId
 * @desc    Switch to a different account
 * @access  Private
 */
router.post("/switch/:accountId", authMiddleware, switchAccount);

/**
 * @route   DELETE /api/v1/accounts/:accountId
 * @desc    Remove an account
 * @access  Private
 */
router.delete("/:accountId", authMiddleware, removeAccount);

export default router;
