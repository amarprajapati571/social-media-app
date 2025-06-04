'use client';

import { useState, useEffect } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import PostFeed from '@/components/PostFeed';
import CreatePost from '@/components/CreatePost';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleAuth = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" className="py-8">
        <Box className="text-center mb-8">
          <Typography variant="h3" component="h1" className="mb-4">
            Welcome to Social Media App
          </Typography>
          <Button
            variant="text"
            onClick={() => setShowLogin(!showLogin)}
            className="mb-4"
          >
            {showLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </Button>
        </Box>
        {showLogin ? (
          <LoginForm onAuth={handleAuth} />
        ) : (
          <RegisterForm onAuth={handleAuth} />
        )}
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      <Box className="flex justify-between items-center mb-8">
        <Typography variant="h4" component="h1">
          Welcome, {user?.username}!
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <CreatePost />
      <PostFeed />
    </Container>
  );
} 