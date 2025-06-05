const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get user profile with counts
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching own profile for user:', userId);

    // Get user profile with counts
    const [users] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.profile_image,
        u.bio,
        u.created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
      FROM users u
      WHERE u.id = ?`,
      [userId]
    );

    const user = users[0];
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User profile data:', {
      id: user.id,
      username: user.username,
      posts_count: user.posts_count,
      followers_count: user.followers_count,
      following_count: user.following_count
    });

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's posts
router.get('/posts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching posts for user:', userId);

    const [posts] = await db.query(
      `SELECT 
        p.*,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
      FROM posts p
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [userId, userId]
    );

    console.log('Found posts:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get other user's profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    console.log('Fetching profile for user:', userId, 'Current user:', currentUserId);

    // Check if userId is a number or username
    const isNumeric = /^\d+$/.test(userId);
    const query = isNumeric 
      ? 'u.id = ?'
      : 'u.username = ?';

    // Get user profile with counts and following status
    const [users] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.full_name,
        u.profile_image,
        u.bio,
        u.created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
      FROM users u
      WHERE ${query}`,
      [currentUserId, userId]
    );

    const user = users[0];
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User profile data:', {
      id: user.id,
      username: user.username,
      posts_count: user.posts_count,
      followers_count: user.followers_count,
      following_count: user.following_count,
      is_following: user.is_following
    });

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get other user's posts
router.get('/:userId/posts', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    console.log('Fetching posts for user:', userId, 'Current user:', currentUserId);

    // Check if userId is a number or username
    const isNumeric = /^\d+$/.test(userId);
    const query = isNumeric 
      ? 'p.user_id = ?'
      : 'u.username = ?';

    const [posts] = await db.query(
      `SELECT 
        p.*,
        u.full_name as user_full_name,
        u.username as user_username,
        u.profile_image as user_profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id) as user_is_following
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE ${query}
      ORDER BY p.created_at DESC`,
      [currentUserId, currentUserId, userId]
    );

    console.log('Found posts:', posts.length);
    console.log('First post sample:', posts[0] ? {
      id: posts[0].id,
      content: posts[0].content,
      like_count: posts[0].like_count,
      user_liked: posts[0].user_liked,
      user_is_following: posts[0].user_is_following
    } : 'No posts');

    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow a user
router.post('/:userId/follow', auth, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    if (isNaN(followingId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if user exists
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [followingId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    const [existing] = await db.query(
      'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    if (existing.length > 0) {
      // Unfollow
      await db.query(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
      );
      return res.json({ message: 'Unfollowed successfully' });
    }

    // Follow
    await db.query(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 