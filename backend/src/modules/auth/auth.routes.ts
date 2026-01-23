import { Router } from "express";
import {
  signup,
  login,
  logout,
  refreshToken,
  verifyEmail,
} from './auth.controller.js';
import { validateSignup, validateLogin } from './auth.validation.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post("/signup", validateSignup, signup);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post("/login", validateLogin, login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post("/logout", logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post("/refresh", refreshToken);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify user email with token
 * @access  Public
 */
router.get("/verify-email/:token", verifyEmail);

export default router;
