const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const auth = require('../middleware/auth');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/posts';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    const imageUrl = req.file ? `http://localhost:3001/uploads/posts/${req.file.filename}` : null;

    if (!content && !imageUrl) {
      return res.status(400).json({ message: 'Post must have either content or an image' });
    }

    const [result] = await db.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [userId, content, imageUrl]
    );

    const [newPost] = await db.query(
      `SELECT 
        p.*,
        u.username as user_username,
        u.full_name as user_full_name,
        u.profile_image as user_profile_image,
        0 as like_count,
        false as user_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newPost[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts (for feed)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5; // Default 5 posts per page
    const offset = parseInt(req.query.offset) || 0;

    // Get total count of posts
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as total FROM posts'
    );

    // Get paginated posts
    const [posts] = await db.query(
      `SELECT 
        p.*,
        u.username as user_username,
        u.full_name as user_full_name,
        u.profile_image as user_profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id) as user_is_following
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, userId, limit, offset]
    );

    res.json({
      posts,
      hasMore: offset + posts.length < totalCount[0].total,
      total: totalCount[0].total
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/Unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const [existing] = await db.query(
      'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existing.length > 0) {
      // Unlike
      await db.query(
        'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
        [userId, postId]
      );
      return res.json({ message: 'Post unliked' });
    }

    // Like
    await db.query(
      'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
      [userId, postId]
    );

    res.json({ message: 'Post liked' });
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 