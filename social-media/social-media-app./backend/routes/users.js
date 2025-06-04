const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Follow/Unfollow a user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const followingId = req.params.id;

    // Prevent self-following
    if (req.user.userId === parseInt(followingId)) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [followingId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    const [existingFollows] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.userId, followingId]
    );

    if (existingFollows.length > 0) {
      // Unfollow the user
      await pool.execute(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.user.userId, followingId]
      );
      return res.json({ message: 'User unfollowed successfully' });
    }

    // Follow the user
    await pool.execute(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [req.user.userId, followingId]
    );

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Error following user' });
  }
});

module.exports = router; 