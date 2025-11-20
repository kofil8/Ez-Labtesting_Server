import rateLimit from "express-rate-limit";

/**
 * Default rate limiter for general API usage
 * In test environment, use a more permissive limit
 */
export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 100, // Very high limit for tests
  message: {
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter limiter for login attempts
 * In test environment, use a more permissive limit
 */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Very high limit for tests
  message: {
    message: "Too many login attempts. Please try again after 10 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom limiter builder (if needed dynamically)
 */
export const createRateLimiter = (max: number, minutes: number) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    message: {
      message: `Too many requests. Try again after ${minutes} minutes.`
    }
  });
