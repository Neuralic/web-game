import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  userId: string;
  username: string;
}

interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

/**
 * Middleware to verify JWT token
 */
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Response | void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Attach user info to request
      req.userId = decoded.userId;
      req.username = decoded.username;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.userId = decoded.userId;
        req.username = decoded.username;
      } catch (error) {
        // Token invalid but continue anyway
        console.log("Invalid token in optional auth");
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Alias for verifyToken
export const authMiddleware = verifyToken;
