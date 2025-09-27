// http.js

// http.js
import axios from 'axios';

const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL;
const LOGIN_BASE = import.meta.env.VITE_LOGIN_API_BASE_URL || DEFAULT_BASE;

const http = axios.create({
  baseURL: DEFAULT_BASE,
  withCredentials: false,
});

export const loginHttp = axios.create({
  baseURL: LOGIN_BASE,
  withCredentials: false,
});

// Attach token before every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    console.log("🔑 Using access token:", token); // ✅ log current token
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes('/Auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("⚠️ Access token expired. Retrying:", originalRequest.url);

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await http.post('/Auth/refresh', { refreshToken });
        const newAccessToken = res.data.accessToken;

        console.log("✅ Token refreshed. New access token:", newAccessToken);

        localStorage.setItem('accessToken', newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("🔁 Retrying original request:", originalRequest.url);
        return http(originalRequest);
      } catch (err) {
        console.error("❌ Refresh failed. Logging out...");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


export default http;
