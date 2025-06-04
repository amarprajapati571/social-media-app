import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, email, password, fullName } = await req.json();

    // Validate input
    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, fullName]
    );

    // Generate JWT token
    const token = generateToken(result.insertId);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        token,
        user: {
          id: result.insertId,
          username,
          email,
          fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Error registering user' },
      { status: 500 }
    );
  }
} 