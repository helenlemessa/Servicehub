import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || '/api';
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
const refreshUser = async () => {
  await fetchProfile();
};
  // Configure axios
  axios.defaults.baseURL = API_URL;
  axios.defaults.withCredentials = true;

  // Check for token on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Initial token found:', !!token);
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);
const fetchProfile = async () => {
  try {
    console.log('Fetching profile...');
    const { data } = await axios.get('/auth/profile');
    console.log('Profile fetched:', data);
    
    // Make sure following is an array even if undefined
    const userData = {
      ...data,
      following: data.following || [],
      followers: data.followers || []
    };
    
    console.log('User following list (IDs):', userData.following.map(f => f._id || f));
    console.log('User following list (names):', userData.following.map(f => f.name || 'Unknown'));
    setUser(userData);
    
    // Also update localStorage to keep following list
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...storedUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
  } catch (error) {
    console.error('Fetch profile error:', error.response?.data);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  } finally {
    setLoading(false);
  }
};

  const register = async (userData) => {
    try {
      console.log('Registering with:', userData);
      const { data } = await axios.post('/auth/register', userData);
      console.log('Register response:', data);
      
      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser({ ...data, following: [], followers: [] });
      
      toast.success('Registered successfully!');
      return { success: true };
    } catch (error) {
      console.error('Register error:', error.response?.data);
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

 const login = async (email, password) => {
  try {
    console.log('Logging in with:', email);
    const { data } = await axios.post('/auth/login', { email, password });
    console.log('Login response:', data);
    
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser({ ...data, following: data.following || [], followers: data.followers || [] });
    
    toast.success('Logged in successfully!');
    return { success: true };
  } catch (error) {
    console.error('Login error:', error.response?.data);
    // Get the specific error message from the backend
    const message = error.response?.data?.message || 'Login failed';
    toast.error(message);
    return { success: false, error: message };
  }
};
  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out');
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    refreshUser, // Add this line
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};