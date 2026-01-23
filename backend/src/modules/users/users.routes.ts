import { Router } from "express";
import {
  getProfile,
  getUserByUsername,
  updateProfile,
  updateProfileSettings,
} from './users.controller.js';
import { verifyToken, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/profile", verifyToken, getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile (displayName, bio, status)
 * @access  Private
 */
router.put("/profile", verifyToken, updateProfile);

/**
 * @route   PUT /api/v1/users/profile/settings
 * @desc    Update profile privacy settings
 * @access  Private
 */
router.put("/profile/settings", verifyToken, updateProfileSettings);

/**
 * @route   GET /api/v1/users/:username
 * @desc    Get user profile by username
 * @access  Public (with optional auth)
 */
router.get("/:username", optionalAuth, getUserByUsername);

export default router;
