const jwt = require('jsonwebtoken');
const logger = require('./logger');

const generateToken = (userId, role) => {
  try {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  } catch (error) {
    logger.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('Token verification error:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};
