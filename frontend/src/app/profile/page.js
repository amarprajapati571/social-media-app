'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  Button,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const router = useRouter();
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    fetchUserProfile();
  }, [authUser]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Profile response:', response.data);
      setUser(response.data);
      await fetchUserPosts();
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.response?.data?.message || 'Error fetching profile');
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/users/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Posts response:', response.data);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error(error.response?.data?.message || 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchUserPosts();
      toast.success('Post liked successfully');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error(error.response?.data?.message || 'Error liking post');
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Profile not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={user.profile_image || '/default-avatar.png'}
            alt={user.full_name}
            sx={{ width: 100, height: 100, mr: 3 }}
          />
          <Box>
            <Typography variant="h4" gutterBottom>
              {user.full_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              @{user.username}
            </Typography>
            {user.bio && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.bio}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="h6" component="span">
                  {user.posts_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                  posts
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="span">
                  {user.followers_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                  followers
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="span">
                  {user.following_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                  following
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Tabs value={selectedTab} onChange={handleTabChange} centered>
          <Tab icon={<PhotoLibraryIcon />} label="POSTS" />
        </Tabs>
      </Paper>

      {selectedTab === 0 && (
        <Grid container spacing={2}>
          {posts.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No posts yet
                </Typography>
              </Box>
            </Grid>
          ) : (
            posts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.9 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => setSelectedPost(post)}
                >
                  {post.image_url && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.image_url}
                      alt="Post image"
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>
                      {post.content}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        color={post.user_liked ? 'primary' : 'default'}
                      >
                        {post.user_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                      <Typography variant="body2" color="text.secondary">
                        {post.like_count || 0} likes
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      <Dialog
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedPost && (
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedPost.image_url && (
                <img
                  src={selectedPost.image_url}
                  alt="Post"
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
              )}
              <Typography variant="body1">{selectedPost.content}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(selectedPost.created_at).toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleLike(selectedPost.id)}
                  color={selectedPost.user_liked ? 'primary' : 'default'}
                >
                  {selectedPost.user_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  {selectedPost.like_count || 0} likes
                </Typography>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Container>
  );
} 