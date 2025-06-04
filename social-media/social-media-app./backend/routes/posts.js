const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all posts with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [posts] = await pool.execute(
      `SELECT p.*, u.username, u.full_name, u.profile_picture,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = p.user_id) as follower_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [total] = await pool.execute('SELECT COUNT(*) as count FROM posts');

    res.json({
      posts,
      pagination: {
        total: total[0].count,
        page,
        limit,
        totalPages: Math.ceil(total[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [req.user.userId, content, imageUrl]
    );

    res.status(201).json({
      message: 'Post created successfully',
      postId: result.insertId,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Like/Unlike a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists
    const [posts] = await pool.execute(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already liked
    const [existingLikes] = await pool.execute(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [req.user.userId, postId]
    );

    if (existingLikes.length > 0) {
      // Unlike the post
      await pool.execute(
        'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
        [req.user.userId, postId]
      );
      return res.json({ message: 'Post unliked successfully' });
    }

    // Like the post
    await pool.execute(
      'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
      [req.user.userId, postId]
    );

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post' });
  }
});

module.exports = router; 