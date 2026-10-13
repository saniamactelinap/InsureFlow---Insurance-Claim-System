import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('insureflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If expired, clear token if not already on login/register
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register')) {
        localStorage.removeItem('insureflow_token');
        localStorage.removeItem('insureflow_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
