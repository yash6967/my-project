import axios from 'axios';
// const axios = require('axios');

/**
 * Frontend API Service
 * This service acts as a bridge between React components and the backend API.
 * It handles:
 * 1. Making HTTP requests to the backend
 * 2. Managing authentication tokens in the browser
 * 3. Providing a clean interface for components to interact with the API
 * 4. Handling common error cases
 */

// Backend API URL - this points to our Express server
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Token management in browser's localStorage
const TokenService = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('user'),
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically add authentication token to requests
api.interceptors.request.use(
  (config) => {
    const token = TokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized, clear tokens and redirect to login
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      TokenService.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Authentication API interface for React components
export const auth = {
  // Register new user
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      if (response.data.success && response.data.token) {
        TokenService.setToken(response.data.token);
        TokenService.setUser(response.data.user);
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { message: 'An error occurred during signup' };
    }
  },

  // Login existing user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success && response.data.token) {
        TokenService.setToken(response.data.token);
        TokenService.setUser(response.data.user);
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { message: 'An error occurred during login' };
    }
  },

  // Logout user
  logout: () => {
    TokenService.clear();
  },

  // Get current user's data
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        TokenService.clear();
      }
      throw error.response?.data || { message: 'Error fetching user data' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = TokenService.getToken();
    const user = TokenService.getUser();
    return !!(token && user);
  }
};

export default api; 
