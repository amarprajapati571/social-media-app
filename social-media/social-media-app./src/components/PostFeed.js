'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  PersonAdd as PersonAddIcon,
  PersonAddDisabled as PersonAddDisabledIcon,
} from '@mui/icons-material';

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNum) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }

      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to like post');
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                like_count: post.like_count + (data.message.includes('unliked') ? -1 : 1),
              }
            : post
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to follow user');
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.user_id === userId
            ? {
                ...post,
                follower_count:
                  post.follower_count + (data.message.includes('unfollowed') ? -1 : 1),
              }
            : post
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && page === 1) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" className="text-center">
        {error}
      </Typography>
    );
  }

  return (
    <Box className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="mb-4">
          <CardContent>
            <Box className="flex items-center mb-4">
              <Avatar
                src={post.profile_picture}
                alt={post.username}
                className="mr-2"
              />
              <Box className="flex-1">
                <Typography variant="h6">{post.full_name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  @{post.username}
                </Typography>
              </Box>
              <IconButton
                onClick={() => handleFollow(post.user_id)}
                color="primary"
              >
                {post.follower_count > 0 ? (
                  <PersonAddDisabledIcon />
                ) : (
                  <PersonAddIcon />
                )}
              </IconButton>
            </Box>
            <Typography variant="body1" className="mb-2">
              {post.content}
            </Typography>
            {post.image_url && (
              <Box className="mt-2">
                <img
                  src={post.image_url}
                  alt="Post"
                  className="max-w-full rounded-lg"
                />
              </Box>
            )}
          </CardContent>
          <Divider />
          <CardActions>
            <Button
              startIcon={
                post.like_count > 0 ? <FavoriteIcon /> : <FavoriteBorderIcon />
              }
              onClick={() => handleLike(post.id)}
              color="secondary"
            >
              {post.like_count} Likes
            </Button>
          </CardActions>
        </Card>
      ))}
      {hasMore && (
        <Box className="text-center mt-4">
          <Button
            variant="outlined"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
} 