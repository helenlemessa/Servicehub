// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Theme-based classes
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textError = isDark ? 'text-red-400' : 'text-red-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const iconColor = isDark ? 'text-gray-500' : 'text-gray-400';
  const inputBorderError = 'border-red-500';
  const focusRingError = 'focus:ring-red-500';

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors({ ...errors, password: '' });
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  const result = await login(email, password);
  
  if (result.success) {
    toast.success('Logged in successfully!');
    navigate('/dashboard');
  } else {
    // Display specific error message
    const errorMsg = result.error || 'Login failed';
    
    // Better error detection
    const lowerError = errorMsg.toLowerCase();
    
    if (lowerError.includes('user not found') || 
        lowerError.includes('no user') || 
        lowerError.includes('invalid email') ||
        lowerError.includes('account not found')) {
      setErrors({ email: 'No account found with this email address. Please sign up first.' });
      toast.error('No account found with this email address');
    } else if (lowerError.includes('password') || lowerError.includes('credentials')) {
      setErrors({ password: 'Incorrect password. Please try again.' });
      toast.error('Incorrect password');
    } else {
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    }
  }
  setLoading(false);
};

  return (
    <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${bgColor} py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${textPrimary}`}>
            Sign in to your account
          </h2>
          <p className={`mt-2 text-center text-sm ${textSecondary}`}>
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        <form className={`mt-8 space-y-6 ${cardBg} p-8 rounded-lg shadow-md transition-colors duration-200`} onSubmit={handleSubmit}>
          {/* General Error Message */}
          {errors.general && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'} ${textError} text-sm text-center`}>
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className={`h-5 w-5 ${errors.email ? 'text-red-500' : iconColor}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${errors.email ? inputBorderError : borderColor} ${inputBg} ${inputText} ${placeholderColor} rounded-lg focus:outline-none focus:ring-2 ${errors.email ? focusRingError : 'focus:ring-blue-500'} focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200`}
                  placeholder="Email address"
                />
              </div>
              {errors.email && (
                <p className={`mt-1 text-xs ${textError}`}>{errors.email}</p>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`h-5 w-5 ${errors.password ? 'text-red-500' : iconColor}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border ${errors.password ? inputBorderError : borderColor} ${inputBg} ${inputText} ${placeholderColor} rounded-lg focus:outline-none focus:ring-2 ${errors.password ? focusRingError : 'focus:ring-blue-500'} focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FaEyeSlash className={`h-5 w-5 ${iconColor} hover:${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  ) : (
                    <FaEye className={`h-5 w-5 ${iconColor} hover:${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className={`mt-1 text-xs ${textError}`}>{errors.password}</p>
              )}
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;