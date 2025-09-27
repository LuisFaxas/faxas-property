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

// Listen for auth state changes and refresh token periodically
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      currentToken = await user.getIdToken();
      
      // Also listen for token refresh events
      user.getIdToken().then(token => {
        currentToken = token;
      });
    } catch (error) {
      console.error('Error getting auth token:', error);
      currentToken = null;
    }
  } else {
    currentToken = null;
  }
});

// Add auth token and project ID to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      // Always get a fresh token to avoid expiration issues
      // getIdToken() returns cached token if still valid, or refreshes if expired
      const token = await user.getIdToken();
      currentToken = token;
      config.headers.Authorization = `Bearer ${token}`;
    } else if (currentToken) {
      // Fallback to stored token if no current user
      config.headers.Authorization = `Bearer ${currentToken}`;
    }

    // Add project ID if available (from localStorage or context)
    const projectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
    if (projectId) {
      config.headers['x-project-id'] = projectId;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    // If token refresh fails, try with stored token as last resort
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
  }
  return config;
});

// Track retry attempts to prevent infinite loops
const retryAttempts = new Map<string, number>();

// Handle responses
apiClient.interceptors.response.use(
  (response) => {
    // Clear retry attempts on successful response
    const requestId = `${response.config.method}-${response.config.url}`;
    retryAttempts.delete(requestId);

    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('[API Client] Received HTML response instead of JSON:', response.config.url);
      throw new Error('Server returned HTML instead of JSON - likely an authentication error');
    }

    // If the response has a standard API structure with data property, extract it
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      // Return just the data array, not the wrapper
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestId = `${originalRequest?.method}-${originalRequest?.url}`;
    
    // Handle 401 errors (unauthorized/token expired)
    if (error.response?.status === 401 && originalRequest) {
      // Check if we've already retried this request
      const attempts = retryAttempts.get(requestId) || 0;
      
      if (attempts >= 2) {
        // Max retries reached, clear attempts and redirect
        retryAttempts.delete(requestId);
        console.error('Max token refresh attempts reached, redirecting to login');
        
        // Show user-friendly message before redirect
        if (typeof window !== 'undefined') {
          const message = 'Your session has expired. Please log in again.';
          // Try to show toast if available
          try {
            const event = new CustomEvent('show-toast', { 
              detail: { message, type: 'error' } 
            });
            window.dispatchEvent(event);
          } catch (e) {
            // Fallback to alert if toast system not available
            alert(message);
          }
          
          // Small delay to allow message to be seen
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        return Promise.reject(error);
      }
      
      // Increment retry counter
      retryAttempts.set(requestId, attempts + 1);
      
      // Try to refresh the token
      const user = auth.currentUser;
      if (user) {
        try {
          console.log(`Token refresh attempt ${attempts + 1} for ${requestId}`);
          
          // Force token refresh
          const newToken = await user.getIdToken(true);
          currentToken = newToken;
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Add a flag to identify this as a retry
          originalRequest._retry = true;
          
          // Retry the request
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Try one more time with user reload
          if (attempts === 0) {
            try {
              await user.reload();
              const newToken = await user.getIdToken(true);
              currentToken = newToken;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return apiClient(originalRequest);
            } catch (reloadError) {
              console.error('User reload and token refresh failed:', reloadError);
            }
          }
          
          // All attempts failed, clear counter and redirect
          retryAttempts.delete(requestId);
          
          if (typeof window !== 'undefined') {
            const message = 'Unable to refresh your session. Please log in again.';
            try {
              const event = new CustomEvent('show-toast', { 
                detail: { message, type: 'error' } 
              });
              window.dispatchEvent(event);
            } catch (e) {
              alert(message);
            }
            
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          }
        }
      } else {
        // No user, clear attempts and redirect to login
        retryAttempts.delete(requestId);
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // Check if error response is HTML instead of JSON
    if (error.response) {
      const contentType = error.response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.error('[API Client] Server returned HTML error page:', error.response.status);
        error.response.data = {
          success: false,
          error: `Server error (${error.response.status}) - received HTML instead of JSON`,
          message: 'Authentication or server configuration issue'
        };
      }
    }

    // For other errors, clear retry attempts and reject
    if (requestId) {
      retryAttempts.delete(requestId);
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;