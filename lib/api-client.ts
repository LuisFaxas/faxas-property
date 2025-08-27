import axios from 'axios';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Store the current user token
let currentToken: string | null = null;

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      currentToken = await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      currentToken = null;
    }
  } else {
    currentToken = null;
  }
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    // First try to use the stored token
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    } else {
      // If no stored token, try to get from current user
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        currentToken = token;
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => {
    // If the response has a standard API structure with data property, extract it
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      // Return just the data array, not the wrapper
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh the token once before redirecting
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true); // Force refresh
          currentToken = newToken;
          
          // Retry the request with new token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Only redirect if we can't refresh the token
          window.location.href = '/login';
        }
      } else {
        // No user, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;