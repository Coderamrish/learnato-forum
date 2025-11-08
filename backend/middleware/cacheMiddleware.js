const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const redisClient = getRedisClient();
    if (!redisClient) {
      return next();
    }

    try {
      // Create a unique key based on the URL and query params
      const key = `cache:${req.originalUrl || req.url}`;
      
      // Try to get cached response
      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        const parsedResponse = JSON.parse(cachedResponse);
        return res.json(parsedResponse);
      }

      // Store the original send function
      const originalSend = res.json;

      // Override res.json method
      res.json = function(body) {
        // Store the response in cache
        redisClient.setEx(key, duration, JSON.stringify(body))
          .catch(err => logger.error('Redis cache error:', err));

        // Call the original send function
        originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = {
  cacheMiddleware
};
