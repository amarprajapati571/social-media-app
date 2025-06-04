'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      setContent('');
      setSuccess('Post created successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Paper className="p-4 mb-8">
      <Box component="form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" className="mb-4">
            {success}
          </Alert>
        )}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          className="mt-2"
        >
          Post
        </Button>
      </Box>
    </Paper>
  );
} 