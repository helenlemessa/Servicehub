// frontend/src/utils/authGuard.js
import toast from 'react-hot-toast';

export const requireAuth = (navigate, actionName = 'perform this action') => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    toast.error(`Please login to ${actionName}`);
    navigate('/login');
    return false;
  }
  return true;
};

export const withAuth = (callback, navigate, actionName) => {
  return (...args) => {
    if (requireAuth(navigate, actionName)) {
      return callback(...args);
    }
  };
};