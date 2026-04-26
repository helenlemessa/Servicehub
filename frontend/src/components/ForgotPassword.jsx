import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
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
  const alertBg = isDark ? 'bg-blue-900/30' : 'bg-blue-50';
  const alertText = isDark ? 'text-blue-300' : 'text-blue-800';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/auth/forgot-password', { email });
      console.log('Forgot password response:', data);
      console.log('Reset URL (copy this if email not received):', data.resetUrl);
      setSent(true);
      toast.success('Password reset link sent! Check your email.');
    } catch (error) {
      console.error('Forgot password error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${bgColor} py-12 px-4 transition-colors duration-200`}>
        <div className={`max-w-md w-full ${cardBg} rounded-lg shadow-lg p-8 text-center transition-colors duration-200`}>
          <div className="flex justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>Check Your Email</h2>
          <p className={`${textSecondary} mb-4`}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <div className={`${alertBg} p-4 rounded-lg mb-4`}>
            <p className={`text-sm ${alertText}`}>
              📧 Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${bgColor} py-12 px-4 transition-colors duration-200`}>
      <div className={`max-w-md w-full ${cardBg} rounded-lg shadow-lg p-8 transition-colors duration-200`}>
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${textPrimary}`}>Forgot Password?</h2>
          <p className={`${textSecondary} mt-2`}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${labelColor} mb-2`}>
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className={`h-5 w-5 ${iconColor}`} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`block w-full pl-10 pr-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;