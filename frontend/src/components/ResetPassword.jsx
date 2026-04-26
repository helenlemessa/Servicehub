import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaLock, FaCheckCircle } from 'react-icons/fa';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-based classes
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const iconColor = isDark ? 'text-gray-500' : 'text-gray-400';
  const labelColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const errorBg = isDark ? 'bg-red-900/30' : 'bg-red-50';
  const errorBorder = isDark ? 'border-red-800' : 'border-red-200';
  const errorText = isDark ? 'text-red-400' : 'text-red-600';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Submitting password reset with token:', token);
      const response = await axios.post(`/auth/reset-password/${token}`, { password });
      console.log('Reset response:', response.data);
      setSuccess(true);
      toast.success('Password reset successful!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Reset error:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to reset password';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${bgColor} py-12 px-4 transition-colors duration-200`}>
        <div className={`max-w-md w-full ${cardBg} rounded-lg shadow-lg p-8 text-center transition-colors duration-200`}>
          <div className="flex justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>Password Reset Success!</h2>
          <p className={`${textSecondary} mb-4`}>
            Your password has been reset successfully.
          </p>
          <p className={`${textMuted} text-sm mb-6`}>
            Redirecting you to login page...
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${bgColor} py-12 px-4 transition-colors duration-200`}>
      <div className={`max-w-md w-full ${cardBg} rounded-lg shadow-lg p-8 transition-colors duration-200`}>
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${textPrimary}`}>Reset Password</h2>
          <p className={`${textSecondary} mt-2`}>Enter your new password below</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${labelColor} mb-2`}>
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className={`h-5 w-5 ${iconColor}`} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`block w-full pl-10 pr-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                placeholder="Enter new password"
              />
            </div>
            <p className={`text-xs ${textMuted} mt-1`}>Minimum 6 characters</p>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${labelColor} mb-2`}>
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className={`h-5 w-5 ${iconColor}`} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`block w-full pl-10 pr-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          
          {error && (
            <div className={`${errorBg} border ${errorBorder} rounded-lg p-3`}>
              <p className={`${errorText} text-sm`}>{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;