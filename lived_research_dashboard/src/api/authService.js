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
