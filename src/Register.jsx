import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { register } from './api.js';
import { Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // Added success state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error state
    setSuccess(false); // Reset success state

    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }

    const userData = {
      username,
      password,
      password2,
      email,
      first_name: firstName,
      last_name: lastName,
    };

    try {
      const response = await register(userData);
      if (response.message === 'User registered successfully') {
        setSuccess(true); // Show success message
        setTimeout(() => {
          navigate('/'); // Navigate after success message
        }, 2000); // Delay navigation by 2 seconds
      } else {
        setError(response.message || 'Failed to register. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to register. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 3,
          width: 300,
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 2 }}>
          Register
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">User registered successfully!</Alert>}

        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="First Name"
          variant="outlined"
          fullWidth
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          label="Last Name"
          variant="outlined"
          fullWidth
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 1 }}
        >
          Register
        </Button>
        <Typography align="center" sx={{ mt: 2 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;
