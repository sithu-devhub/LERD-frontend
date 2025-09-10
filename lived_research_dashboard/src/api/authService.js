// authService.js

import http, { loginHttp } from './http';

// Use the loginHttp instance for login
export const login = (username, password) =>
  loginHttp.post('/auth/login', { username, password });

// Use default http for other APIs
