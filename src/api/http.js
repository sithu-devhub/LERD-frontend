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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};


// Attach token before every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers || {};
    console.log("🔑 Using access token:", token);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';

    if (requestUrl.includes('/Auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log("🔁 Retrying queued request:", requestUrl);
          return http(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      console.warn("⚠️ Access token expired. Refreshing once...");
      const res = await axios.post(`${DEFAULT_BASE}/Auth/refresh`, { refreshToken });

      const newAccessToken = res.data.accessToken;
      if (!newAccessToken) {
        throw new Error('No access token returned from refresh');
      }

      console.log("✅ Token refreshed. New access token:", newAccessToken);

      localStorage.setItem('accessToken', newAccessToken);
      http.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      console.log("🔁 Retrying original request:", requestUrl);

      return http(originalRequest);
    } catch (err) {
      processQueue(err, null);

      console.error("❌ Refresh failed. Logging out...");
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);


export default http;
