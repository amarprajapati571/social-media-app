'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Grid,
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Input,
  DialogActions,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import Image from 'next/image';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function UserProfile({ params }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const userId = params.id;

  useEffect(() => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    fetchUserProfile();
    fetchUserPosts();
  }, [userId, authUser]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const data = await response.json();
      console.log('User profile data:', data); // Debug log
      setUser(data);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/posts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user posts');
      const data = await response.json();
      console.log('User posts data:', data); // Debug log
      setPosts(data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to follow user');
      }
      
      const data = await response.json();
      console.log(data.message);
      setUser(prev => ({
        ...prev,
        is_following: !prev.is_following,
        followers_count: prev.is_following ? prev.followers_count - 1 : prev.followers_count + 1
      }));
      toast.success(user.is_following ? 'Unfollowed successfully' : 'Followed successfully');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error(error.message);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      setPosts(posts.map(post =>
        post.id === postId
          ? {
              ...post,
              likes_count: post.likes_count + (post.is_liked ? -1 : 1),
              is_liked: !post.is_liked,
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error(error.message);
    }
  };

  const handleUserClick = (e, userId) => {
    e.stopPropagation();
    router.push(`/profile/${userId}`);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      if (newPost.image) {
        formData.append('image', newPost.image);
      }

      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create post');
      
      // Reset form and refresh posts
      setNewPost({ content: '', image: null });
      setImagePreview(null);
      fetchUserPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          User not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box display="flex" alignItems="center" gap={3} mb={4}>
          <Avatar
            src={user.profile_image ? `http://localhost:3001${user.profile_image}` : undefined}
            alt={user.full_name}
            sx={{ width: 100, height: 100 }}
          />
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h4">{user.full_name}</Typography>
              {authUser.id !== user.id && (
                <Button
                  variant={user.is_following ? "outlined" : "contained"}
                  onClick={handleFollow}
                  size="small"
                >
                  {user.is_following ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </Box>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              @{user.username}
            </Typography>
            {user.bio && (
              <Typography variant="body1" sx={{ mt: 1 }}>
                {user.bio}
              </Typography>
            )}
            <Box display="flex" gap={4} mt={2}>
              <Box>
                <Typography variant="h6" component="span">
                  {user.posts_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                  posts
                </Typography>
              </Box>
              <Box sx={{ cursor: 'pointer' }}>
                <Typography variant="h6" component="span">
                  {user.followers_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                  followers
                </Typography>
              </Box>
              <Box sx={{ cursor: 'pointer' }}>
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

        <Divider sx={{ mb: 3 }} />

        {/* Create Post Section */}
        {authUser.id === user.id && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                multiline
                rows={3}
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                fullWidth
              />
              
              {imagePreview && (
                <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                  <IconButton
                    onClick={() => {
                      setImagePreview(null);
                      setNewPost(prev => ({ ...prev, image: null }));
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  component="label"
                  startIcon={<AddPhotoAlternateIcon />}
                  variant="outlined"
                >
                  Add Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreatePost}
                  disabled={!newPost.content.trim() && !newPost.image}
                >
                  Post
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Posts" />
        </Tabs>

        {posts.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography variant="h6" color="text.secondary">
              No posts yet
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {posts.map((post) => (
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
                  <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                    <CardMedia
                      component="img"
                      image={post.image_url ? (post.image_url.startsWith('http') ? post.image_url : `http://localhost:3001${post.image_url}`) : '/placeholder-image.jpg'}
                      alt={post.content}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      {post.is_liked ? (
                        <Favorite color="error" fontSize="small" />
                      ) : (
                        <FavoriteBorder fontSize="small" />
                      )}
                      <Typography variant="body2">{post.likes_count}</Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 1 }}>
                    <Typography variant="body2" noWrap>
                      {post.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(post.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPost && (
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ position: 'relative' }}>
              <IconButton
                onClick={() => setSelectedPost(null)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  zIndex: 1,
                }}
              >
                <CloseIcon />
              </IconButton>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                <Box
                  sx={{
                    width: { xs: '100%', md: '60%' },
                    position: 'relative',
                    paddingTop: { xs: '100%', md: '60%' },
                  }}
                >
                  <Image
                    src={selectedPost.image_url ? (selectedPost.image_url.startsWith('http') ? selectedPost.image_url : `http://localhost:3001${selectedPost.image_url}`) : '/placeholder-image.jpg'}
                    alt="Post"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Box sx={{ p: 2, width: { xs: '100%', md: '40%' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={user.profile_image ? `http://localhost:3001${user.profile_image}` : undefined}
                      alt={user.full_name}
                      sx={{ width: 40, height: 40, mr: 1, cursor: 'pointer' }}
                      onClick={(e) => handleUserClick(e, selectedPost.user_id)}
                    />
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={(e) => handleUserClick(e, selectedPost.user_id)}
                      >
                        {user.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{user.username}
                      </Typography>
                    </Box>
                    {authUser.id !== selectedPost.user_id && (
                      <Button
                        variant={selectedPost.user_is_following ? "outlined" : "contained"}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow();
                        }}
                        sx={{ ml: 'auto' }}
                      >
                        {selectedPost.user_is_following ? 'Unfollow' : 'Follow'}
                      </Button>
                    )}
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedPost.content}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(selectedPost.id);
                      }}
                      color={selectedPost.is_liked ? "error" : "default"}
                    >
                      {selectedPost.is_liked ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    <Typography variant="body2">
                      {selectedPost.likes_count} likes
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Container>
  );
} 