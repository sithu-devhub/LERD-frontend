// authService.js
import http, { loginHttp } from './http';

// Login
export const login = (username, password) =>
  loginHttp.post('/Auth/login', { username, password });

// Refresh Access Token
export const refreshToken = (refreshToken) =>
  http.post('/Auth/refresh', { refreshToken });

// Logout
export const logout = () =>
  http.post('/Auth/logout');

// Get all users
export const getAllUsers = (params = {}) =>
  http.get('/user-management/users', { params });

// Create User
export const createUser = (payload) =>
  http.post('/user-management/users', payload);