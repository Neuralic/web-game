import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from './messages.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Conversations
router.get("/conversations", getConversations);

// Messages
router.get("/:userId", getMessages);
router.post("/:userId", sendMessage);

// Mark as read
router.put("/:messageId/read", markAsRead);

export default router;
