import axios from 'axios';

const isDev = process.env.NODE_ENV !== 'production';
const api = axios.create({
  baseURL: isDev ? 'http://localhost:5000/api/v1' : 'https://bizerp-api.vercel.app/api/v1',
  headers: { 
    'Content-Type': 'application/json'
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('erp_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
