import { Router } from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  addBestFriend,
  removeBestFriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "./friends.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Friend requests
router.post("/request", sendFriendRequest);
router.post("/accept/:requestId", acceptFriendRequest);
router.post("/decline/:requestId", declineFriendRequest);
router.get("/requests", getFriendRequests);

// Friends management
router.get("/", getFriends);
router.delete("/:friendId", removeFriend);

// Best friends
router.post("/best/:friendId", addBestFriend);
router.delete("/best/:friendId", removeBestFriend);

// Block/unblock
router.post("/block/:userId", blockUser);
router.delete("/unblock/:userId", unblockUser);
router.get("/blocked", getBlockedUsers);

export default router;
