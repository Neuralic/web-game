import { Router } from "express";
import { uploadImage, uploadMultipleImages } from "./upload.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../lib/multer";

const router = Router();

// All upload routes require authentication
router.post("/image", authMiddleware, upload.single("file"), uploadImage);
router.post(
  "/multiple",
  authMiddleware,
  upload.array("files", 10),
  uploadMultipleImages
);

export default router;
