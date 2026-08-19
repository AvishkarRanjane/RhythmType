const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

/**
 * Auth Endpoints Rate Limiter (Prevent Brute Force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login/registration attempts. Please try again after 15 minutes.' }
});

/**
 * Score Submission Rate Limiter (Max 1 submission per 10s per IP)
 */
const scoreSubmitLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Score submitted too quickly. Max 1 score submission per 10 seconds.' }
});

module.exports = {
  apiLimiter,
  authLimiter,
  scoreSubmitLimiter
};
