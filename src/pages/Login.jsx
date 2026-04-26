import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authService'; // use the login service


// Decode JWT payload safely
function parseJwt(token) {
  try {
    // Extract and decode the payload part of the token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (error) {
    // Handle invalid token format
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // === REAL API LOGIN via authService ===
      const res = await login(formData.username, formData.password);
      const data = res.data;

      if (data.accessToken) {
        // Save tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);


        // Decode token - Save user info (with userId)
        const claims = parseJwt(data.accessToken);

        const userId =
          claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;

        const username =
          claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || formData.username;

        const isActive =
          String(claims?.is_active).toLowerCase() === 'true';

        const isAdmin =
          String(claims?.is_admin).toLowerCase() === "true";

        // normalize role
        const userRole = isAdmin ? "admin" : "employee";

        localStorage.setItem(
          "user",
          JSON.stringify({
            userId,
            username,
            fullName: data.fullName || username,
            userRole,
            isActive
          })
        );

        navigate('/dashboard');
      } else {
        throw new Error('Login failed. No token returned.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="flex-1 bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 flex flex-col justify-between p-12 text-white relative">
        <div className="flex flex-col justify-center flex-1">
          <h1 className="text-5xl font-bold mb-6">Customer Experience Dashboard</h1>
          <p className="text-xl opacity-90 max-w-md leading-relaxed">
            Empowering smarter decisions through a unified, insightful, and intuitive
            dashboard experience.
          </p>
        </div>
        <div className="flex items-center">
          <img src="/curtin_icon.png" alt="Curtin University" className="h-50 md:h-60 opacity-100 object-contain" />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-white flex flex-col justify-center px-12 relative">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Hello!</h2>
            <p className="text-gray-600 text-lg">Welcome Back</p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {/* Team logo under the form */}
          <div className="flex justify-center mt-8 select-none pointer-events-none">
            <img src="/team_icon.PNG" alt="Lived Experience Team" className="h-20 md:h-24 opacity-90 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
