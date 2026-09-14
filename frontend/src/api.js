// frontend/src/api.js
import axios from 'axios';

export const BACKEND_BASE = 'http://localhost:4000'; // change if backend is on other host/port
const API = axios.create({ baseURL: BACKEND_BASE + '/api' });

// attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Convert backend stored path (local /uploads or absolute S3/http URL) to usable src
export function fullImageUrl(path) {
  if (!path) return '/default-avatar.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // if path starts with '/', assume server-local (uploads served at /uploads)
  if (path.startsWith('/')) return BACKEND_BASE + path;
  // otherwise join
  return BACKEND_BASE + '/' + path;
}

export default API;
