import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SettingsIcon from '@mui/icons-material/Settings';

const VideoCall = ({ ws ,connectedUsers}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRefs = useRef({});

  useEffect(() => {
    // Get user media
    const initMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Signal to join video call
      ws.send(
        JSON.stringify({
          type: 'sfu_signal',
          signal: { action: 'join_video_call' },
        })
      );
    };

    initMedia();

    // Handle WebSocket messages for signaling
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sfu_signal') {
        // Handle incoming signaling for SFU
        handleSignaling(data.signal, data.username);
      }
    };

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [ws]);

  const handleSignaling = (signal, username) => {
    // Implement signaling logic with SFU
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1200,
      }}
    >
      {/* Local Video */}
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'grey.200',
          mb: 2,
        }}
      >
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%' }} />
      </Box>

      {/* Remote Videos */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {Object.keys(remoteStreams).map((username, idx) => (
          <Box
            key={idx}
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'grey.300',
            }}
          >
            <video
              ref={(el) => (remoteVideoRefs.current[username] = el)}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        ))}
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Tooltip title={isVideoMuted ? 'Unmute Video' : 'Mute Video'}>
          <IconButton onClick={toggleVideo}>
            {isVideoMuted ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}>
          <IconButton onClick={toggleAudio}>
            {isAudioMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default VideoCall;
