import { Router } from "express";
import { searchUsers, quickSearch } from "./search.controller";
import { optionalAuth } from "../../middleware/auth.middleware";

const router = Router();

// Search routes with optional auth (to show friendship status if logged in)
router.get("/users", optionalAuth, searchUsers);
router.get("/quick", quickSearch);

export default router;
