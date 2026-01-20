import { Request, Response, NextFunction } from "express";

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  message?: string;
}

/**
 * Rate limiting middleware
 * Limits requests per IP address
 */
export const rateLimitMiddleware = (options: RateLimitOptions = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxRequests = options.maxRequests || 100; // 100 requests default
  const message =
    options.message || "Too many requests, please try again later.";

  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    // Get or create request count for this IP
    let record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(ip, record);
      return next();
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000), // seconds
      });
    }

    next();
  };
};

/**
 * Strict rate limiter for auth endpoints
 */
export const authRateLimiter = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts
  message: "Too many login attempts, please try again later.",
});

/**
 * Standard rate limiter for API endpoints
 */
export const apiRateLimiter = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests
});

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute
