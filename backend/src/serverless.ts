import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import accountsRoutes from "./modules/accounts/accounts.routes";
import groupsRoutes from "./modules/groups/groups.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import friendsRoutes from "./modules/friends/friends.routes";
import searchRoutes from "./modules/search/search.routes";

// Load environment variables
dotenv.config();

// Create Express app (serverless - no Socket.IO)
const app: Application = express();

// Allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.FRONTEND_URL || "http://localhost:3000"];

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(apiRateLimiter); // Rate limiting

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AdventureBlox API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.get("/api/v1", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to AdventureBlox API v1",
    version: "1.0.0",
    documentation: "/api/v1/docs",
  });
});

// Auth routes
app.use("/api/v1/auth", authRoutes);

// Users routes
app.use("/api/v1/users", usersRoutes);

// Accounts routes
app.use("/api/v1/accounts", accountsRoutes);

// Groups routes
app.use("/api/v1/groups", groupsRoutes);

// Upload routes
app.use("/api/v1/upload", uploadRoutes);

// Friends routes
app.use("/api/v1/friends", friendsRoutes);

// Search routes
app.use("/api/v1/search", searchRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

export default app;
