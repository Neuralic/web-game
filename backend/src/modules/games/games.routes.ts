import { Router } from "express";
import {
  getGames,
  getGameById,
  publishGame,
} from "./games.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", getGames);
router.get("/:id", getGameById);
router.post("/publish", verifyToken, publishGame);

export default router;
