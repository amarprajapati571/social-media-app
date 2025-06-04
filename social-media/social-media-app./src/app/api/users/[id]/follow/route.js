import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authMiddleware } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const followingId = params.id;

    // Prevent self-following
    if (user.userId === parseInt(followingId)) {
      return NextResponse.json(
        { message: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [followingId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const [existingFollows] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [user.userId, followingId]
    );

    if (existingFollows.length > 0) {
      // Unfollow the user
      await pool.execute(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [user.userId, followingId]
      );
      return NextResponse.json({ message: 'User unfollowed successfully' });
    }

    // Follow the user
    await pool.execute(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [user.userId, followingId]
    );

    return NextResponse.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { message: 'Error following user' },
      { status: 500 }
    );
  }
} 