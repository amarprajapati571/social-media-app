'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActions,
} from '@mui/material';
import { Favorite, FavoriteBorder, Send } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const fetchPosts = async (isLoadMore = false) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/posts?limit=5&offset=${isLoadMore ? offset : 0}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();

      if (isLoadMore) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setHasMore(data.hasMore);
      setOffset(isLoadMore ? offset + 5 : 5);
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPosts();
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setPostImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !postImage) return;

    const formData = new FormData();
    formData.append('content', newPost);
    if (postImage) {
      formData.append('image', postImage);
    }

    try {
      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      setNewPost('');
      setPostImage(null);
      setPreviewUrl('');
      // Refresh posts after creating a new one
      fetchPosts();
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      setPosts(posts.map(post =>
        post.id === postId
          ? {
              ...post,
              like_count: post.user_liked ? post.like_count - 1 : post.like_count + 1,
              user_liked: !post.user_liked,
            }
          : post
      ));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchPosts(true);
  };

  const handleProfileClick = (userId) => {
    router.push(`/profile/${userId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={user?.profileImage ? `http://localhost:3001${user.profileImage}` : undefined}
              alt={user?.username}
              sx={{ mr: 2 }}
            />
            <TextField
              fullWidth
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              multiline
              maxRows={4}
            />
          </Box>
          {previewUrl && (
            <Box sx={{ mb: 2, position: 'relative' }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxHeight: '200px', borderRadius: '8px' }}
              />
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
                onClick={() => {
                  setPostImage(null);
                  setPreviewUrl('');
                }}
              >
                ×
              </IconButton>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="post-image-upload"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="post-image-upload">
              <Button component="span" color="primary">
                Add Image
              </Button>
            </label>
            <Button
              type="submit"
              variant="contained"
              disabled={!newPost.trim() && !postImage}
            >
              Post
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : posts?.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No posts yet. Create your first post or follow some users to see their posts!
          </Typography>
        </Box>
      ) : (
        <>
          {posts?.map((post) => (
            <Card key={post.id} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={post.user_profile_image ? `http://localhost:3001${post.user_profile_image}` : undefined}
                    alt={post.user_username || 'User'}
                    sx={{ mr: 2, cursor: 'pointer' }}
                    onClick={() => handleProfileClick(post.user_id)}
                  />
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleProfileClick(post.user_id)}
                    >
                      {post.user_username || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(post.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {post.content}
                </Typography>
                {post.image_url && (
                  <CardMedia
                    component="img"
                    image={post.image_url.startsWith('http') ? post.image_url : `http://localhost:3001${post.image_url}`}
                    alt="Post image"
                    sx={{ maxHeight: 400, objectFit: 'contain' }}
                  />
                )}
              </CardContent>
              <CardActions>
                <IconButton 
                  onClick={() => handleLike(post.id)}
                  color={post.user_liked ? "error" : "default"}
                >
                  {post.user_liked ? (
                    <Favorite />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
                </Typography>
              </CardActions>
            </Card>
          ))}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? <CircularProgress size={24} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
