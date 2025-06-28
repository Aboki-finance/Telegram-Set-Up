// src/middleware/rateLimiter.js
const logger = require('../utils/logger');

// Simple in-memory rate limiter
const userRequests = new Map();
const RATE_LIMIT = 10; // requests per minute
const WINDOW_MS = 60000; // 1 minute

const rateLimiter = (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();
  
  const now = Date.now();
  const userKey = userId.toString();
  
  if (!userRequests.has(userKey)) {
    userRequests.set(userKey, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }
  
  const userData = userRequests.get(userKey);
  
  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + WINDOW_MS;
    return next();
  }
  
  if (userData.count >= RATE_LIMIT) {
    logger.warn(`Rate limit exceeded for user: ${userId}`);
    return ctx.reply('Too many requests. Please wait a moment before trying again.');
  }
  
  userData.count++;
  return next();
};

module.exports = { rateLimiter };