import { Router } from "express";
import {
  getGames,
  getGameById,
  publishGame,
  publishGameByPlaceId,
  getSponsoredGames,
  sponsorGame,
  unsponsorGame,
  getMyGames,
  deleteGame,
  getGamesByGroup,
  getGamesByUser,
  getGameComments,
  createGameComment,
  replyToGameComment,
  deleteGameComment,
  deleteGameCommentReply,
  toggleGameLike,
  toggleGameDislike,
  toggleGameFavorite,
  getUserFavoriteGames,
  recordGamePlay,
  getUserRecentlyPlayed,
  getGameSummaries,
  getGamePasses,
  createGamePass,
  getGameServers,
} from "./games.controller.js";
import { verifyToken, optionalAuth } from "../../middleware/auth.middleware.js";
import { createGameLimiter, createCommentLimiter } from "../../middleware/rateLimiter.js";
const router = Router();
router.get("/", getGames);
router.get("/sponsored", getSponsoredGames);
router.get("/my-games", verifyToken, getMyGames);
router.get("/favorites/:userId", getUserFavoriteGames);
router.get("/recently-played/:userId", getUserRecentlyPlayed);
router.get("/summaries", getGameSummaries);
router.get("/group/:groupId", getGamesByGroup);
router.get("/user/:userId", getGamesByUser);
router.get("/:id", optionalAuth, getGameById);
router.post("/publish", verifyToken, createGameLimiter, publishGame);
router.post("/publish-by-place-id", verifyToken, createGameLimiter, publishGameByPlaceId);
router.delete("/:id", verifyToken, deleteGame);
router.post("/:id/sponsor", verifyToken, sponsorGame);
router.delete("/:id/sponsor", verifyToken, unsponsorGame);
router.post("/:id/like", verifyToken, toggleGameLike);
router.post("/:id/dislike", verifyToken, toggleGameDislike);
router.post("/:id/favorite", verifyToken, toggleGameFavorite);
router.post("/:id/play", verifyToken, recordGamePlay);
router.get("/:id/comments", getGameComments);
router.post("/:id/comments", verifyToken, createCommentLimiter, createGameComment);
router.post("/:id/comments/:commentId/reply", verifyToken, createCommentLimiter, replyToGameComment);
router.delete("/:id/comments/:commentId", verifyToken, deleteGameComment);
router.delete("/:id/comments/:commentId/replies/:replyId", verifyToken, deleteGameCommentReply);
router.get("/:id/passes", getGamePasses);
router.post("/:id/passes", verifyToken, createGamePass);
router.get("/:id/servers", getGameServers);
export default router;
