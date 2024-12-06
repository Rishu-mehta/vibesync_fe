import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';

const VideoCall = ({ ws, connectedUsers }) => {
  const localVideoRef = useRef(null);
  const containerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [cameraAnchorEl, setCameraAnchorEl] = useState(null);
  const [micAnchorEl, setMicAnchorEl] = useState(null);
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState(null);

  const [position, setPosition] = useState({ x: 16, y: window.innerHeight / 2 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const getLocalStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;
      setLocalStream(stream);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      const microphones = devices.filter((device) => device.kind === 'audioinput');

      setDevices({ cameras, microphones });

      if (cameras.length > 0) setSelectedCamera(cameras[0]);
      if (microphones.length > 0) setSelectedMicrophone(microphones[0]);
    };
    getLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoMuted(!videoTrack.enabled);
  };

  const toggleAudio = () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioMuted(!audioTrack.enabled);
  };

  const handleDeviceSelection = async (device, type) => {
    const constraints =
      type === 'video'
        ? { video: { deviceId: { exact: device.deviceId } } }
        : { audio: { deviceId: { exact: device.deviceId } } };
    const newStream = await navigator.mediaDevices.getUserMedia(constraints);

    const track = newStream.getTracks()[0];
    const sender = localStream.getSenders().find((s) => s.track.kind === type);
    sender.replaceTrack(track);

    if (type === 'video') {
      setSelectedCamera(device);
    } else {
      setSelectedMicrophone(device);
    }
  };

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStart]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 2,
        borderRadius: '8px',
        color: 'white',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: 160,
          height: 160,
          borderRadius: '8px',
          border: '2px solid white',
          objectFit: 'cover',
        }}
      />
    
      <Box>
        <IconButton onClick={toggleVideo} color={isVideoMuted ? 'secondary' : 'primary'}>
          {isVideoMuted ? <VideocamOffIcon /> : <VideocamIcon />}
        </IconButton>
        <IconButton onClick={toggleAudio} color={isAudioMuted ? 'secondary' : 'primary'}>
          {isAudioMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        {/* <IconButton onClick={(e) => setCameraAnchorEl(e.currentTarget)}>
          <VideocamIcon />
        </IconButton> */}
        <Menu
          anchorEl={cameraAnchorEl}
          open={Boolean(cameraAnchorEl)}
          onClose={() => setCameraAnchorEl(null)}
        >
          {devices.cameras.map((camera) => (
            <MenuItem
              key={camera.deviceId}
              onClick={() => {
                handleDeviceSelection(camera, 'video');
                setCameraAnchorEl(null);
              }}
            >
              {camera.label}
            </MenuItem>
          ))}
        </Menu>
        {/* <IconButton onClick={(e) => setMicAnchorEl(e.currentTarget)}>
          <MicIcon />
        </IconButton> */}
        <Menu
          anchorEl={micAnchorEl}
          open={Boolean(micAnchorEl)}
          onClose={() => setMicAnchorEl(null)}
        >
          {devices.microphones.map((mic) => (
            <MenuItem
              key={mic.deviceId}
              onClick={() => {
                handleDeviceSelection(mic, 'audio');
                setMicAnchorEl(null);
              }}
            >
              {mic.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
};

export default VideoCall;
