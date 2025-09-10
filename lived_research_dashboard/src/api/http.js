// http.js
import axios from 'axios';

// Pick the correct base URL depending on the request
const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL;
const LOGIN_BASE = import.meta.env.VITE_LOGIN_API_BASE_URL || DEFAULT_BASE;

// Create the default axios instance for all requests
const http = axios.create({
  baseURL: DEFAULT_BASE,
  withCredentials: false,
});

// Interceptor to inject token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Export both: 
// - default http for normal API calls
// - loginHttp for login override
export const loginHttp = axios.create({
  baseURL: LOGIN_BASE,
  withCredentials: false,
});

export default http;
