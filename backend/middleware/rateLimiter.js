const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

// Safely require rate-limit-redis (some versions export default)
let RedisStore = null;
try {
  const mod = require('rate-limit-redis');
  RedisStore = mod && (mod.default || mod);
} catch (err) {
  logger.warn('rate-limit-redis not available or failed to load, falling back to memory store');
  RedisStore = null;
}

const createRedisStore = (prefix, windowMs) => {
  const client = getRedisClient();
  if (!client || !RedisStore) return undefined;

  try {
    // Some versions accept { client }, others expect sendCommand — ioredis supports client directly
    return new RedisStore({
      client,
      prefix,
      windowMs
    });
  } catch (err) {
    logger.warn('Failed to initialize RedisStore for rate limiter, using in-memory store', err.message || err);
    return undefined;
  }
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  store: createRedisStore('rl:api:', 15 * 60 * 1000)
});

// Auth routes rate limiter (login/signup)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login/signup attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after an hour.'
  },
  store: createRedisStore('rl:auth:', 60 * 60 * 1000)
});

// Post creation rate limiter
const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 post creations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many posts created from this IP, please try again later.'
  },
 store: createRedisStore('rl:post:', 60 * 60 * 1000)
});

module.exports = {
  apiLimiter,
  authLimiter,
  postLimiter
};
