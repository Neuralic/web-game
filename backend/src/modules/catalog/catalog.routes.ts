import { Router } from "express";
import {
  getCatalogItems,
  getCatalogItemById,
  getCatalogCategories,
  getCatalogSubcategories,
} from "./catalog.controller.js";

const router = Router();

// Public routes - no auth required
router.get("/items", getCatalogItems);
router.get("/items/:id", getCatalogItemById);
router.get("/categories", getCatalogCategories);
router.get("/subcategories/:category", getCatalogSubcategories);

export default router;
