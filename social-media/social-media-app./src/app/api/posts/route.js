import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authMiddleware } from '@/lib/auth';

// Get all posts with pagination
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
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

    return NextResponse.json({
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
    return NextResponse.json(
      { message: 'Error fetching posts' },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(req) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { content, imageUrl } = await req.json();

    if (!content) {
      return NextResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [user.userId, content, imageUrl]
    );

    return NextResponse.json(
      {
        message: 'Post created successfully',
        postId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: 'Error creating post' },
      { status: 500 }
    );
  }
} 