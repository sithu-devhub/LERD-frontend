import http from './http';

// Try to restore session if accessToken missing but refreshToken exists
export async function initAuth() {
  const access = localStorage.getItem('accessToken');
  const refresh = localStorage.getItem('refreshToken');

  if (!access && refresh) {
    console.log("🔄 No access token, trying refresh...");
    try {
      const res = await http.post('/Auth/refresh', { refreshToken: refresh });
      console.log("✅ Refresh succeeded");
      localStorage.setItem('accessToken', res.data.accessToken);
      return true;
    } catch (err) {
      console.error("❌ Refresh failed");
      localStorage.clear();
      return false;
    }
  }

  console.log("🔑 Access token present:", !!access);
  return !!access;
}

