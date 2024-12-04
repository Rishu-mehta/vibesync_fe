import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText } from '@mui/material';
import { useParams } from 'react-router-dom';

const RoomPage = () => {
  const { roomId } = useParams(); // Room ID from URL
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const token = localStorage.getItem('access_token'); // Authentication token

  useEffect(() => {
    if (!roomId || !token) return;

    let isSubscribed = true; // Add cleanup flag
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/room/${roomId}/?token=${token}`);

    // Only set the WebSocket if the component is still mounted
    if (isSubscribed) {
      setWs(socket);
    }

    // Handle WebSocket events
    socket.onopen = () => {
      console.log(`Connected to room: ${roomId}`);
      // Optionally add a ping mechanism to keep connection alive
      // const pingInterval = setInterval(() => {
      //   if (socket.readyState === WebSocket.OPEN) {
      //     socket.send(JSON.stringify({ type: 'ping' }));
      //   }
      // }, 30000); // Send ping every 30 seconds

      // Clean up ping interval when socket closes
      socket.addEventListener('close', () => clearInterval(pingInterval));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message from server:', data);
      if (data.type === 'chat_message') {
        setChatMessages((prev) => [...prev, { username: data.username, message: data.message }]);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket closed:', event);
      if (isSubscribed) {
        setWs(null);
        // Optionally implement reconnection logic here
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on component unmount
    return () => {
      isSubscribed = false;
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [roomId, token]);

  const handleSendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      ws.send(JSON.stringify({ type: 'chat_message', message }));
      setMessage('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Room: {roomId}</Typography>

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Messages</Typography>
        <List>
          {chatMessages.map((msg, idx) => (
            <ListItem key={idx}>
              <ListItemText primary={`${msg.username}: ${msg.message}`} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <TextField
          label="Message"
          variant="outlined"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default RoomPage;
