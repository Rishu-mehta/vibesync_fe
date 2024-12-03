import React, { useState } from 'react';
import { Box, Typography, Button, AppBar, Toolbar, IconButton, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { apiCall } from './api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [joinRoomId, setJoinRoomId] = useState('');

  const token = localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    navigate('/');
  };

  const handleCreateRoom = async () => {
    if (!token) {
      alert('Please log in first.');
      return;
    }

    try {
      const response = await apiCall('create-room/', 'POST', null, {
        Authorization: `Bearer ${token}`,
      });
      setCreatedRoomId(response.room_id);
    } catch (error) {
      console.error('Error creating room:', error.message);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId) {
      alert('Please enter a Room ID to join.');
      return;
    }

    if (!token) {
      alert('Please log in first.');
      return;
    }

    navigate(`/room/${joinRoomId}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="sticky" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <AccountCircleIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 2,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '600px',
            p: 3,
            mb: 3,
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 100, color: '#1976d2', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            Welcome, User
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here is your profile information.
          </Typography>
        </Box>

        <Box sx={{ mb: 3, width: '100%', maxWidth: '600px' }}>
          <Button variant="contained" color="primary" fullWidth onClick={handleCreateRoom}>
            Create Room
          </Button>
          {createdRoomId && (
            <Typography sx={{ mt: 2, textAlign: 'center', color: '#1976d2' }}>
              Room ID: {createdRoomId}
            </Typography>
          )}
        </Box>

        <Box sx={{ width: '100%', maxWidth: '600px' }}>
          <TextField
            label="Room ID"
            variant="outlined"
            fullWidth
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" fullWidth onClick={handleJoinRoom}>
            Join Room
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
