import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';

const VideoPlayer = ({ ws }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const playerRef = useRef(null);
  const [showUrlInput, setShowUrlInput] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const keepAliveIntervalRef = useRef(null);

  useEffect(() => {
  if (!ws) return;

  const handleMessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'video_control') {
      handleVideoControl(data);
    } else if (data.type === 'video_share') {
      setVideoUrl(data.video_url);
      setShowUrlInput(false); // Hide URL input for all users
    }
  };

  ws.onmessage = handleMessage;
  keepAliveIntervalRef.current = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
      console.log("Sent keep-alive ping to server.");
    }
  }, 60000); // Send a ping every 60 seconds

  return () => {
    ws.onmessage = null; // Cleanup on component unmount
    clearInterval(keepAliveIntervalRef.current);
  };
}, [ws]);
useEffect(() => {
    const handlePlayerEvents = (event) => {
      if (!playerRef.current || event.source !== playerRef.current.contentWindow) return;
  
      const data = event.data;
      if (data.event === 'onStateChange') {
        switch (data.info) {
          case 1: // Playing
            sendVideoControl('play');
            break;
          case 2: // Paused
            sendVideoControl('pause');
            break;
        }
      } else if (data.event === 'onVideoProgress') {
        sendVideoControl('seek', { timestamp: data.time });
      }
    };
  
    window.addEventListener('message', handlePlayerEvents);
  
    return () => window.removeEventListener('message', handlePlayerEvents);
  }, [videoUrl]);
  
const handleVideoControl = (data) => {
  if (!playerRef.current) return;

  switch (data.action) {
    case 'play':
      playerRef.current.contentWindow.postMessage({ event: 'command', func: 'playVideo' }, '*');
      break;
    case 'pause':
      playerRef.current.contentWindow.postMessage({ event: 'command', func: 'pauseVideo' }, '*');
      break;
    case 'seek':
      playerRef.current.contentWindow.postMessage(
        { event: 'command', func: 'seekTo', args: [data.timestamp] },
        '*'
      );
      break;
  }
};


const sendVideoControl = (action, additionalData = {}) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'video_control',
          action,
          video_url: videoUrl,
          timestamp: additionalData.timestamp || currentTime, // Send current time for seek actions
        })
      );
    }
  };

  const handleSubmitUrl = () => {
    if (videoUrl) {
      const processedUrl = getEmbedUrl(videoUrl);
      
      // Log the URL being sent
      console.log("Sending video URL to server:", processedUrl);

      // Send video_share message
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'share_video',
          video_url: processedUrl
        }));
      } else {
        console.error("WebSocket is not open. Cannot send video URL.");
      }

      setVideoUrl(processedUrl);
      setShowUrlInput(false);
    }
  };

  const getEmbedUrl = (url) => {
    const fileIdMatch = url.match(/\/d\/([^/]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview?enablejsapi=1`;
    }
    return url;
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== playerRef.current?.contentWindow) return;
      
      const data = event.data;
      if (typeof data === 'object' && data.event === 'onStateChange') {
        switch (data.info) {
          case 1: // playing
            sendVideoControl('play');
            break;
          case 2: // paused
            sendVideoControl('pause');
            break;
        }
      } else if (data.event === 'onVideoProgress') {
        sendVideoControl('seek', { time: data.time });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {showUrlInput ? (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Enter Google Drive Video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            helperText="Paste the Google Drive sharing URL"
          />
          <Button 
            variant="contained" 
            onClick={handleSubmitUrl}
            startIcon={<ShareIcon />}
          >
            Share
          </Button>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
          <Box
            component="iframe"
            ref={playerRef}
            src={videoUrl}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </Box>
      )}
    </Box>
  );
};

export default VideoPlayer; 