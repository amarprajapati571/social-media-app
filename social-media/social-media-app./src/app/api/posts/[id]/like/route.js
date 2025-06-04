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

    const postId = params.id;

    // Check if post exists
    const [posts] = await pool.execute(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const [existingLikes] = await pool.execute(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [user.userId, postId]
    );

    if (existingLikes.length > 0) {
      // Unlike the post
      await pool.execute(
        'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
        [user.userId, postId]
      );
      return NextResponse.json({ message: 'Post unliked successfully' });
    }

    // Like the post
    await pool.execute(
      'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
      [user.userId, postId]
    );

    return NextResponse.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { message: 'Error liking post' },
      { status: 500 }
    );
  }
} 