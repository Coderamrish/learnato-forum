const Post = require('../models/Post');
const { groqClient } = require('../utils/groqClient');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

// Cache keys
const POST_LIST_CACHE_KEY = 'posts:list';
const POST_DETAIL_CACHE_KEY = 'post:';

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    const post = await Post.create({
      title,
      content,
      tags: tags || [],
      author: req.user.id
    });

    // Invalidate posts list cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(POST_LIST_CACHE_KEY);
    }

    // Emit socket event
    req.io.emit('newPost', await post.populate('author', 'username'));

    res.status(201).json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const { search, sort = '-createdAt', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Try to get from cache first
    const redisClient = getRedisClient();
    const cacheKey = `${POST_LIST_CACHE_KEY}:${search || ''}:${sort}:${page}:${limit}`;
    
    if (redisClient) {
      const cachedPosts = await redisClient.get(cacheKey);
      if (cachedPosts) {
        return res.json({
          success: true,
          data: { posts: JSON.parse(cachedPosts) }
        });
      }
    }

    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [search.toLowerCase()] } }
        ]
      };
    }

    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Cache the results
    if (redisClient) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(posts)); // Cache for 5 minutes
    }

    res.json({
      success: true,
      data: { posts }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try cache first
    const redisClient = getRedisClient();
    if (redisClient) {
      const cachedPost = await redisClient.get(`${POST_DETAIL_CACHE_KEY}${id}`);
      if (cachedPost) {
        return res.json({
          success: true,
          data: { post: JSON.parse(cachedPost) }
        });
      }
    }

    const post = await Post.findById(id)
      .populate('author', 'username')
      .populate('replies.author', 'username')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment views
    await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Cache the post
    if (redisClient) {
      await redisClient.setEx(`${POST_DETAIL_CACHE_KEY}${id}`, 300, JSON.stringify(post));
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add reply to post
// @route   POST /api/posts/:id/reply
// @access  Private
const addReply = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const reply = {
      content,
      author: req.user.id
    };

    post.replies.push(reply);
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate('author', 'username')
      .populate('replies.author', 'username');

    // Invalidate cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`${POST_DETAIL_CACHE_KEY}${id}`);
    }

    // Emit socket event
    req.io.emit('newReply', {
      postId: id,
      reply: populatedPost.replies[populatedPost.replies.length - 1]
    });

    res.status(201).json({
      success: true,
      data: { post: populatedPost }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote post
// @route   POST /api/posts/:id/upvote
// @access  Private
const upvotePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already upvoted
    const alreadyUpvoted = post.upvotes.includes(req.user.id);

    if (alreadyUpvoted) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== req.user.id);
    } else {
      post.upvotes.push(req.user.id);
    }

    await post.save();

    // Invalidate cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`${POST_DETAIL_CACHE_KEY}${id}`);
    }

    // Emit socket event
    req.io.emit('upvoteUpdate', {
      postId: id,
      upvotes: post.upvotes.length
    });

    res.json({
      success: true,
      data: { upvotes: post.upvotes.length }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark post as answered
// @route   POST /api/posts/:id/mark-answered
// @access  Private (Instructor only)
const markPostAsAnswered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { replyId } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Ensure user is instructor
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can mark posts as answered'
      });
    }

    post.isAnswered = true;
    post.acceptedAnswer = replyId;
    await post.save();

    // Invalidate cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`${POST_DETAIL_CACHE_KEY}${id}`);
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get similar questions using Groq AI
// @route   POST /api/posts/suggest
// @access  Private
const suggestSimilarQuestions = async (req, res, next) => {
  try {
    const { title } = req.body;

    const prompt = `Find similar questions to: "${title}"\nProvide 3 similar questions that have been commonly asked in programming forums. Format as a JSON array of strings.`;

    const response = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 150,
    });

    const suggestions = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    logger.error('Error suggesting similar questions:', error);
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  addReply,
  upvotePost,
  markPostAsAnswered,
  suggestSimilarQuestions
};
