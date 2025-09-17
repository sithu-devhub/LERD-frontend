import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authService'; // ✅ use the login service

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
        // Save tokens + user (with dummy position if not provided)
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem(
          'user',
          JSON.stringify({
            username: formData.username,
            fullName: data.fullName,
            position: data.position || "Position"
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
          <div className="bg-yellow-400 px-4 py-2 rounded flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
              <span className="text-yellow-600 font-bold text-sm">CU</span>
            </div>
            <span className="text-black font-bold text-lg">Curtin University</span>
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default Login;
