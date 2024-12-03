import axios from 'axios';

// Base URL for the API
const BASE_URL = 'http://127.0.0.1:8000/api/';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get a cookie value
const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
};

// Add request interceptor for CSRF tokens and Authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const csrfToken = getCookie('csrftoken');

    if (token && !['/users/login/', '/users/register/'].includes(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration or logout scenarios
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized! Clearing local storage and redirecting to login.');
      localStorage.removeItem('token');
      window.location.href = '/login'; // Adjust as per your app's login route
    }
    return Promise.reject(error);
  }
);

// Generic API function
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const response = await apiClient({
      url: endpoint,
      method,
      data,
    });
    return response.data;
  } catch (error) {
    console.error('API Call Error:', error.response?.data || error.message);
    throw error;
  }
};

// Login function
const login = async (credentials) => {
  try {
    const response = await apiCall('/users/login/', 'POST', credentials);
    if (response.access) {
      localStorage.setItem('token', response.access);
      console.log('Login successful. Token saved to localStorage.');
    }
    return response;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Register function
const register = async (userData) => {
  try {
    const response = await apiCall('/users/register/', 'POST', userData);
    console.log('Registration successful:', response);
    return response;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
};

// Logout function
const logout = () => {
  localStorage.removeItem('token');
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  console.log('Logged out successfully.');
};

// Export functions
export { apiCall, login, register, logout };
