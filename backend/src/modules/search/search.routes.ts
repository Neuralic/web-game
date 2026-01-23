import { Router } from "express";
import { searchUsers, quickSearch } from './search.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Search routes with optional auth (to show friendship status if logged in)
router.get("/users", optionalAuth, searchUsers);
router.get("/quick", quickSearch);

export default router;
