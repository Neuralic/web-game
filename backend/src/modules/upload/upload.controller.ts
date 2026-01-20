import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { uploadFile } from "../../lib/storage";
import { generateUniqueFilename } from "../../lib/multer";

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload an image to Supabase Storage
 * @access  Private
 */
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = req.file;
    const { type } = req.body; // 'icon', 'cover', 'avatar', etc.

    // Determine bucket and path based on type
    let bucket = "group-images";
    let folder = "general";

    switch (type) {
      case "icon":
      case "emblem":
        folder = "icons";
        break;
      case "cover":
        folder = "covers";
        break;
      case "avatar":
        bucket = "avatars";
        folder = "user";
        break;
      default:
        folder = "general";
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.originalname, `${userId}_`);
    const filePath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const publicUrl = await uploadFile(
      bucket,
      filePath,
      file.buffer,
      file.mimetype
    );

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: publicUrl,
        filename: filename,
        type: file.mimetype,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/upload/multiple
 * @desc    Upload multiple images
 * @access  Private
 */
export const uploadMultipleImages = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const files = req.files as Express.Multer.File[];
    const { type } = req.body;

    let bucket = "group-images";
    let folder = "general";

    switch (type) {
      case "icon":
      case "emblem":
        folder = "icons";
        break;
      case "cover":
        folder = "covers";
        break;
      case "avatar":
        bucket = "avatars";
        folder = "user";
        break;
      default:
        folder = "general";
    }

    // Upload all files
    const uploadPromises = files.map(async (file) => {
      const filename = generateUniqueFilename(file.originalname, `${userId}_`);
      const filePath = `${folder}/${filename}`;

      const publicUrl = await uploadFile(
        bucket,
        filePath,
        file.buffer,
        file.mimetype
      );

      return {
        url: publicUrl,
        filename: filename,
        type: file.mimetype,
        size: file.size,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      data: {
        files: uploadedFiles,
      },
    });
  } catch (error) {
    console.error("Upload multiple error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload files",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
