const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;
let retryCount = 0;
const maxRetries = 5;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }

  try {
    // Use MongoDB memory server for development if regular MongoDB is not available
    logger.info('Attempting to connect to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnato';
    
    // Add retry logic
    while (retryCount < maxRetries) {
      try {
    
        const conn = await mongoose.connect(mongoUri, {
          maxPoolSize: 10,
          minPoolSize: 2,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 5000,
          retryWrites: true,
        });

        isConnected = true;
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
          logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
          isConnected = false;
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed through app termination');
          process.exit(0);
        });

        // successful connection, exit retry loop
        break;

      } catch (error) {
        retryCount++;
        logger.error('MongoDB connection failed:', error.message);

        if (retryCount >= maxRetries) {
          logger.error(`Failed to connect to MongoDB after ${retryCount} attempts.`);
          process.exit(1);
        }

        logger.warn(`Retrying MongoDB connection (${retryCount}/${maxRetries})...`);
        // wait a bit before next retry
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  } catch (err) {
    logger.error('Unexpected error during MongoDB setup:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
      
      if (retryCount < maxRetries) {
        logger.info(`Retrying in ${retryInterval/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } else {
        logger.warn('Max retry attempts reached. Starting application without MongoDB...');
        return; // Continue without MongoDB, application should handle this case
      }
    ;

module.exports = connectDB;