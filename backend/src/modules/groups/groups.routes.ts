import { Router } from "express";
import {
  createGroup,
  getGroupById,
  getAllGroups,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  getUserGroups,
  getGroupGames,
  getGroupWallPosts,
  createGroupWallPost,
  makePrimaryGroup,
  leaveGroupEnhanced,
  removeMember,
  updateMemberRole,
  reportGroup,
  deleteGroupEnhanced,
  getGroupRoles,
  createGroupRole,
  updateGroupRole,
  deleteGroupRole,
} from "./groups.controller";
import {
  getGroupSettings,
  updateGroupSettings,
} from "./groups.settings.controller";
import {
  getGroupSocialLinks,
  updateGroupSocialLinks,
} from "./groups.social.controller";
import { authMiddleware, optionalAuth } from "../../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", getAllGroups);
router.get("/:id", optionalAuth, getGroupById);
router.get("/:id/members", getGroupMembers);
router.get("/:id/games", getGroupGames);
router.get("/:id/wall", getGroupWallPosts);
router.get("/:id/roles", getGroupRoles);
router.get("/:id/settings", getGroupSettings);
router.get("/:id/social-links", getGroupSocialLinks);

// Protected routes - Group management
router.get("/user/me", authMiddleware, getUserGroups);
router.get("/user/:userId", getUserGroups);
router.post("/", authMiddleware, createGroup);
router.put("/:id", authMiddleware, updateGroup);
router.post("/:id/join", authMiddleware, joinGroup);
router.post("/:id/leave", authMiddleware, leaveGroupEnhanced);
router.post("/:id/wall", authMiddleware, createGroupWallPost);
router.put("/:id/settings", authMiddleware, updateGroupSettings);
router.put("/:id/social-links", authMiddleware, updateGroupSocialLinks);

// Protected routes - Admin actions
router.post("/:id/primary", authMiddleware, makePrimaryGroup);
router.delete("/:id/members/:userId", authMiddleware, removeMember);
router.patch("/:id/members/:userId/role", authMiddleware, updateMemberRole);
router.post("/:id/report", authMiddleware, reportGroup);

// Protected routes - Role management
router.post("/:id/roles", authMiddleware, createGroupRole);
router.patch("/:id/roles/:roleId", authMiddleware, updateGroupRole);
router.delete("/:id/roles/:roleId", authMiddleware, deleteGroupRole);

export default router;
