# Social Media Application

A full-stack social media application built with Next.js, MySQL, Express.js, and Node.js.

## Features

- User authentication (register/login)
- Create and view posts
- Like posts
- Follow other users
- Responsive UI with Material UI and Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the MySQL database:
   - Create a new database named `social_media`
   - Import the database schema from `database/schema.sql`

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the database credentials and JWT secret

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   └── api/             # API routes
├── database/            # Database schema and migrations
└── public/             # Static files
```

## API Endpoints

- POST /api/auth/register - Register a new user
- POST /api/auth/login - User login
- POST /api/posts - Create a new post
- GET /api/posts - Get all posts
- POST /api/posts/:id/like - Like a post
- POST /api/users/:id/follow - Follow a user

## Technologies Used

- Next.js
- MySQL
- Express.js
- Node.js
- Material UI
- Tailwind CSS
- JWT Authentication
