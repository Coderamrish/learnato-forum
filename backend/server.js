require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

let app, connectDB, connectRedis, logger;

try {
  app = require('./app');
  connectDB = require('./config/db');
  ({ connectRedis } = require('./config/redis'));
  logger = require('./utils/logger');
  console.log(" All core modules loaded successfully");
} catch (err) {
  console.error(" Error loading core modules:", err);
  process.exit(1);
}

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Setup Socket.io
let io;
try {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    next();
  });

  io.on('connection', (socket) => {
    logger.info(` User connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });

  app.set('io', io);
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
} catch (err) {
  console.error(" Socket.io setup failed:", err);
}

// Start server with database + redis
const startServer = async () => {
  console.log(" Starting Learnato Forum backend...");
  try {
    console.log(" Connecting to MongoDB...");
    await connectDB();
    console.log(" MongoDB connected successfully");

    console.log(" Connecting to Redis...");
    connectRedis();
    console.log(" Redis connection initialized");

    server.listen(port, () => {
      console.log(` Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error(" Server startup failed:", error);
    logger.error("Server startup error", error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log(" Shutting down server gracefully...");
  logger.info("Shutting down server...");

  server.close(() => {
    console.log(" HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(" Could not close connections in time, forcing shutdown");
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start
startServer();
