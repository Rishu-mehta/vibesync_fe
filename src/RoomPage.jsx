import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Drawer } from '@mui/material';
import { useParams } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import VideoPlayer from './components/VideoPlayer';
import VideoCall from './components/VideoCall';

const RoomPage = () => {
  const { roomId } = useParams();
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false); // State to toggle chat box
  const token = localStorage.getItem('access_token');
  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    if (!roomId || !token) return;

    let isSubscribed = true;
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/room/${roomId}/?token=${token}`);

    if (isSubscribed) {
      setWs(socket);
    }

    socket.onopen = () => {
      console.log(`Connected to room: ${roomId}`);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'user_list_update') {
        setConnectedUsers(data.users);
      }
      if (data.type === 'chat') {
        setChatMessages((prev) => {
          const newMessage = {
            username: data.username,
            message: data.message, // Direct access to message
            timestamp: Date.now()
          };
          
          const isDuplicate = prev.some(
            msg => msg.username === newMessage.username && 
                  msg.message === newMessage.message
          );
          
          if (isDuplicate) return prev;
          return [...prev, newMessage];
        });
      }
    };
    socket.onclose = (event) => {
      console.log('WebSocket closed:', event);
      if (isSubscribed) {
        setWs(null);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      isSubscribed = false;
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [roomId, token]);

  const handleSendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      const messageData = {
        type: 'chat',
        message: message, // Send message directly
        username: localStorage.getItem('username')
      };
      
      ws.send(JSON.stringify(messageData));
      setMessage('');
    }
  };
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Room: {roomId}</Typography>
      <Box sx={{ mb: 3 }}>
        <VideoPlayer ws={ws} />
        
      </Box>
      <Box sx={{ mb: 3 }}>
        
        <VideoCall ws={ws} connectedUsers={connectedUsers} />
      </Box>
      <IconButton 
        onClick={toggleChat} 
        sx={{ 
          position: 'fixed', 
          right: 16, 
          bottom: 16,
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          zIndex: 1000
        }}
      >
        <ChatIcon />
      </IconButton>
  
      <Drawer 
        anchor="right" 
        open={isChatOpen} 
        onClose={toggleChat}
        sx={{
          '& .MuiDrawer-paper': {
            width: {
              xs: '100%',
              sm: 350
            }
          }
        }}
      >
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider'
          }}>
            <Typography variant="h6">Chat Room</Typography>
          </Box>
  
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {chatMessages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  backgroundColor: msg.username === localStorage.getItem('username') 
                    ? 'primary.main' 
                    : 'grey.100',
                  color: msg.username === localStorage.getItem('username') 
                    ? 'white' 
                    : 'text.primary',
                  p: 1.5,
                  borderRadius: 2,
                  maxWidth: '75%',
                  alignSelf: msg.username === localStorage.getItem('username') 
                    ? 'flex-end' 
                    : 'flex-start',
                  position: 'relative',
                  wordBreak: 'break-word', // Add word breaking
                  overflowWrap: 'break-word', // Ensure long words wrap
                  whiteSpace: 'pre-wrap' // Preserve line breaks and wrap text
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: msg.username === localStorage.getItem('username') 
                      ? 'white' 
                      : 'primary.main',
                    fontSize: '0.75rem',
                    mb: 0.5
                  }}
                >
                  {msg.username}
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {msg.message}
                </Typography>
              </Box>
            ))}
          </Box>
  
          <Box sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Message"
                variant="outlined"
                size="small"
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    maxHeight: '100px',
                    overflow: 'auto'
                  }
                }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSendMessage}
                sx={{
                  minWidth: '64px',
                  height: 'fit-content'
                }}
              >
                Send
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default RoomPage;