const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
      redisClient = null;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed through app termination');
      }
      process.exit(0);
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
};

module.exports = {
  connectRedis,
  getRedisClient
};
