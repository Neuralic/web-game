import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';

const getRealIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '0.0.0.0';
};

const limitReached = (message: string) => (_req: Request, res: Response) => {
  res.status(429).json({ success: false, message });
};

// Signup: 5 accounts per IP per hour
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => ipKeyGenerator(getRealIp(req)),
  handler: limitReached('Too many accounts created from this IP. Try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Login: 10 attempts per IP per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => ipKeyGenerator(getRealIp(req)),
  handler: limitReached('Too many login attempts. Try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Group creation: 3 groups per user per hour (keyed by auth header to survive proxy)
export const createGroupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req: Request): string => {
    const auth = req.headers['authorization'];
    if (auth) return auth;
    return ipKeyGenerator(getRealIp(req));
  },
  handler: limitReached('You are creating groups too fast. Limit is 3 per hour.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 200 requests per IP per minute (DDoS guard)
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  keyGenerator: (req) => ipKeyGenerator(getRealIp(req)),
  handler: limitReached('Too many requests. Slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});
