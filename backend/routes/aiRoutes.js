const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { postLimiter } = require('../middleware/rateLimiter');
const { generateAIResponse } = require('../utils/groqClient');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get similar questions suggestions
// @route   POST /api/ai/suggest
// @access  Private
router.post('/suggest',
  protect,
  postLimiter,
  [body('title').trim().isLength({ min: 10 }).withMessage('Title must be at least 10 characters')],
  async (req, res, next) => {
    try {
      const { title } = req.body;
      const suggestions = await generateAIResponse(title, 'suggest');
      
      res.json({
        success: true,
        data: {
          suggestions: JSON.parse(suggestions)
        }
      });
    } catch (error) {
      logger.error('AI suggestion error:', error);
      next(error);
    }
  }
);

// @desc    Summarize thread
// @route   POST /api/ai/summarize
// @access  Private
router.post('/summarize',
  protect,
  postLimiter,
  [body('content').trim().isLength({ min: 50 }).withMessage('Content must be at least 50 characters')],
  async (req, res, next) => {
    try {
      const { content } = req.body;
      const summary = await generateAIResponse(content, 'summarize');
      
      res.json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      logger.error('AI summarization error:', error);
      next(error);
    }
  }
);

module.exports = router;