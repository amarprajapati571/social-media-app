# Social Media Backend

This is the backend for a social media application built with Node.js, Express.js, and MySQL.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=social_media
   JWT_SECRET=your_jwt_secret_key
   ```
5. Set up the database:
   - Create a new MySQL database named `social_media`
   - Run the SQL commands from `src/config/schema.sql` to create the necessary tables

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Posts
- POST `/api/posts` - Create a new post
- GET `/api/posts` - Get all posts (with pagination)
- POST `/api/posts/:postId/like` - Like/Unlike a post

### Users
- GET `/api/users/:userId` - Get user profile
- POST `/api/users/:userId/follow` - Follow/Unfollow user
- GET `/api/users/feed` - Get user's feed (posts from followed users)

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```
