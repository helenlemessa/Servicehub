// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { UnreadMessagesProvider } from './context/UnreadMessagesContext';
import { NotificationProvider } from './context/NotificationContext';
import { AudioProvider } from './context/AudioContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ServiceDetails from './pages/ServiceDetails';
import CreateService from './pages/CreateService';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Trending from './pages/Trending';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SavedPosts from './pages/SavedPosts';
import OrderPage from './pages/OrderPage';
import Search from './pages/Search';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="dark:bg-gray-900 dark:text-white">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/services/:id" element={<ServiceDetails />} />
      <Route path="/search" element={<Search />} />
      <Route
        path="/create-service"
        element={
          <PrivateRoute>
            {user?.role === 'seller' || user?.role === 'both' ? (
              <CreateService />
            ) : (
              <Navigate to="/" />
            )}
          </PrivateRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      <Route
        path="/chat/:userId?"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/saved"
        element={
          <PrivateRoute>
            <SavedPosts />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/services/:id/order"
        element={
          <PrivateRoute>
            <OrderPage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/profile/:userId"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      
      <Route path="/trending" element={<Trending />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <UnreadMessagesProvider>
                <AudioProvider>
                  <div className="min-h-screen bg-gray-50 ">
                    <Navbar />
                    <AppRoutes />
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        className: 'dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700',
                        style: {
                          background: 'var(--toast-bg, #fff)',
                          color: 'var(--toast-color, #333)',
                        },
                      }}
                    />
                  </div>
                </AudioProvider>
              </UnreadMessagesProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;