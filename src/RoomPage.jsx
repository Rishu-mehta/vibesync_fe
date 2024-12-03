import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, TextField, List, ListItem, ListItemText } from '@mui/material';
import { useParams } from 'react-router-dom';

const RoomPage = () => {
  const { roomId } = useParams(); 
  const [ws, setWs] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [webSocket, setWebSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const videoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const token = localStorage.getItem('access_token'); 
  
  // WebRTC configuration
  const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:your-turn-server.com',
            username: 'your-username',
            credential: 'your-credential',
        },
    ],
};

useEffect(() => {
    if (!roomId || !token) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/room/${roomId}/?token=${token}`);
    setWs(ws);

    ws.onopen = () => {
      console.log(`Connected to room: ${roomId}`);
    };
    ws.onmessage = (event) => {
        console.log("Message from server: ", event.data);
      };
      
      ws.onclose = (event) => {
        console.log("WebSocket closed: ", event);
      };
      
      ws.onerror = (error) => {
        console.log("WebSocket error: ", error);
      };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setChatMessages((prev) => [...prev, { username: data.username, message: data.message }]);
      } else if (data.type === 'video_control') {
        handleVideoControl(data);
      } else if (data.type === 'offer') {
        handleOffer(data.offer);
      } else if (data.type === 'answer') {
        handleAnswer(data.answer);
      } else if (data.type === 'ice_candidate') {
        handleNewICECandidate(data.candidate);
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId, token]);  // Dependency on roomId and token
  
  const handleVideoControl = ({ control, timestamp }) => {
    const video = videoRef.current;
    if (control === 'play') video.play();
    else if (control === 'pause') video.pause();
    if (timestamp !== undefined) video.currentTime = timestamp;
  };

  const handleChatSubmit = () => {
    if (webSocket && message.trim()) {
      webSocket.send(JSON.stringify({ type: 'chat_message', message }));
      setMessage('');
    }
  };

  const handleVideoSubmit = () => {
    if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.load();
        videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error);
            alert('Interaction required to play the video.');
        });
        webSocket.send(JSON.stringify({ type: 'video_control', control: 'play', timestamp: 0 }));
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection(iceServers);

      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

      peerConnection.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          webSocket.send(
            JSON.stringify({ type: 'ice_candidate', candidate: event.candidate })
          );
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      webSocket.send(JSON.stringify({ type: 'offer', offer }));
    } catch (error) {
      console.error('Error starting video call:', error);
    }
  };

  const handleOffer = async (offer) => {
    try {
      peerConnection.current = new RTCPeerConnection(iceServers);

      peerConnection.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          webSocket.send(
            JSON.stringify({ type: 'ice_candidate', candidate: event.candidate })
          );
        }
      };

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      webSocket.send(JSON.stringify({ type: 'answer', answer }));
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleNewICECandidate = async (candidate) => {
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling new ICE candidate:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Room: {roomId}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <video ref={videoRef} controls width="600" />
        <Box>
          <TextField
            label="Video URL"
            variant="outlined"
            fullWidth
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" fullWidth onClick={handleVideoSubmit}>
            Load Video
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexGrow: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">Chat</Typography>
          <List>
            {chatMessages.map((msg, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={`${msg.username}: ${msg.message}`} />
              </ListItem>
            ))}
          </List>
          <TextField
            label="Type a message"
            variant="outlined"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button variant="contained" color="primary" fullWidth onClick={handleChatSubmit}>
            Send
          </Button>
        </Box>

        <Box>
          <Typography variant="h6">Video Call</Typography>
          <video ref={localVideoRef} autoPlay muted width="300" />
          <video ref={remoteVideoRef} autoPlay width="300" />
          <Button variant="contained" color="primary" fullWidth onClick={startVideoCall}>
            Start Video Call
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RoomPage;
