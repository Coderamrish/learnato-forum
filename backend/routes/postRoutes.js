const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { postLimiter } = require('../middleware/rateLimiter');
const {
  createPost,
  getPosts,
  getPost,
  addReply,
  upvotePost,
  markPostAsAnswered,
  suggestSimilarQuestions
} = require('../controllers/postController');

const router = express.Router();

// Validation middleware
const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must not exceed 10000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const replyValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Reply must not exceed 5000 characters')
];

// Routes
router.post('/', protect, postLimiter, postValidation, createPost);
router.get('/', cacheMiddleware(300), getPosts);
router.get('/:id', cacheMiddleware(300), getPost);
router.post('/:id/reply', protect, postLimiter, replyValidation, addReply);
router.post('/:id/upvote', protect, upvotePost);
router.post('/:id/mark-answered', protect, authorize('instructor'), markPostAsAnswered);
router.post('/suggest', protect, postLimiter, suggestSimilarQuestions);

module.exports = router;
