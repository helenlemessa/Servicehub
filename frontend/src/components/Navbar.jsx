// frontend/src/components/Navbar.jsx - COMPLETELY FIXED
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import { useTheme } from '../context/ThemeContext';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import {
  FaUser,
  FaBriefcase,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaEnvelope,
  FaBookmark,
  FaHome,
  FaChartLine,
  FaBell,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import NotificationsDropdown from './NotificationsDropdown';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (isAuthenticated) {
      logout();
    }
    navigate('/');
    setMobileSidebarOpen(false);
  };

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  const navbarBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const hoverColor = theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600';
  const activeColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const sidebarBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={`${navbarBg} shadow-md sticky top-0 z-50 hidden md:block transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>ServiceHub</span>
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} hidden sm:inline`}>Ethiopia</span>
            </Link>

            <div className="flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link to="/" className={`${textColor} ${hoverColor} transition px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? activeColor : ''}`}>
                Home
              </Link>

              {isAuthenticated && (
                <Link to="/dashboard" className={`${textColor} ${hoverColor} transition px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard') ? activeColor : ''}`}>
                  Dashboard
                </Link>
              )}

              <Link to="/trending" className={`${textColor} ${hoverColor} transition px-3 py-2 rounded-md text-sm font-medium ${isActive('/trending') ? activeColor : ''}`}>
                Trending
              </Link>

              {isAuthenticated && <NotificationsDropdown />}

              {isAuthenticated && (
                <Link to="/chat" className={`relative ${textColor} ${hoverColor} transition p-2 rounded-full hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Messages">
                  <FaEnvelope className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              <ThemeToggle />

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {(user?.role === 'seller' || user?.role === 'both') && (
                    <Link to="/create-service" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
                      + Sell Service
                    </Link>
                  )}

                  <div className="relative group">
                    <button className="flex items-center space-x-2 focus:outline-none">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`text-sm font-medium ${textColor} hidden lg:block`}>
                        {user?.name?.split(' ')[0]}
                      </span>
                    </button>

                    <div className={`absolute right-0 mt-2 w-48 ${sidebarBg} rounded-lg shadow-lg border ${borderColor} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                      <div className="py-2">
                        <Link to="/profile" className={`flex items-center px-4 py-2 text-sm ${textColor} hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <FaUser className="mr-2" /> Profile
                        </Link>
                        <Link to="/dashboard" className={`flex items-center px-4 py-2 text-sm ${textColor} hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <FaBriefcase className="mr-2" /> Dashboard
                        </Link>
                        <Link to="/chat" className={`flex items-center px-4 py-2 text-sm ${textColor} hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <FaEnvelope className="mr-2" /> Messages
                          {unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2">{unreadCount}</span>}
                        </Link>
                        <Link to="/saved" className={`flex items-center px-4 py-2 text-sm ${textColor} hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <FaBookmark className="mr-2" /> Saved Posts
                        </Link>
                        <hr className={`my-1 ${borderColor}`} />
                        <button onClick={handleLogout} className={`flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <FaSignOutAlt className="mr-2" /> Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login" className={`flex items-center ${textColor} ${hoverColor} transition px-3 py-2 rounded-md text-sm font-medium`}>
                    <FaSignInAlt className="mr-1" /> Login
                  </Link>
                  <Link to="/register" className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                    <FaUserPlus className="mr-1" /> Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header - FIXED with Login/Signup buttons */}
      <div className={`md:hidden ${navbarBg} shadow-md sticky top-0 z-50 transition-colors duration-200`}>
        <div className="px-3 py-2">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>ServiceHub</span>
            </Link>
            
            <div className="flex items-center gap-1">
              <ThemeToggle />
              
              {isAuthenticated && <NotificationsDropdown />}
              
              {isAuthenticated && (
                <Link to="/chat" className="relative p-2">
                  <FaEnvelope className={`text-xl ${textColor}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              
              {isAuthenticated ? (
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <FaBars className={`text-xl ${textColor}`} />
                </button>
              ) : (
                // Login/Signup buttons for non-authenticated users on mobile
                <div className="flex items-center gap-1">
                  <Link
                    to="/login"
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${textColor} ${hoverColor}`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 pb-2">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isAuthenticated && mobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className={`fixed right-0 top-0 bottom-0 w-80 ${sidebarBg} z-50 shadow-xl overflow-y-auto md:hidden transition-colors duration-200`}>
            <div className={`p-4 border-b ${borderColor} flex justify-between items-center sticky top-0 ${sidebarBg}`}>
              <div className="flex items-center gap-3">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <FaTimes className={`${textColor}`} />
              </button>
            </div>
            
            <div className="py-2">
              <Link to="/" onClick={() => setMobileSidebarOpen(false)} className={`flex items-center px-4 py-3 ${textColor} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                <FaHome className="mr-3 text-xl" /> Home
              </Link>
              <Link to="/trending" onClick={() => setMobileSidebarOpen(false)} className={`flex items-center px-4 py-3 ${textColor} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                <FaChartLine className="mr-3 text-xl" /> Trending
              </Link>
              <Link to="/dashboard" onClick={() => setMobileSidebarOpen(false)} className={`flex items-center px-4 py-3 ${textColor} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                <FaBriefcase className="mr-3 text-xl" /> Dashboard
              </Link>
              <Link to="/profile" onClick={() => setMobileSidebarOpen(false)} className={`flex items-center px-4 py-3 ${textColor} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                <FaUser className="mr-3 text-xl" /> Profile
              </Link>
              <Link to="/saved" onClick={() => setMobileSidebarOpen(false)} className={`flex items-center px-4 py-3 ${textColor} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                <FaBookmark className="mr-3 text-xl" /> Saved Posts
              </Link>
              {(user?.role === 'seller' || user?.role === 'both') && (
                <Link to="/create-service" onClick={() => setMobileSidebarOpen(false)} className={`flex items-center px-4 py-3 ${textColor} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                  <FaBriefcase className="mr-3 text-xl" /> Create Service
                </Link>
              )}
              <hr className={`my-2 ${borderColor}`} />
              <button onClick={handleLogout} className={`flex items-center w-full px-4 py-3 text-red-600 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                <FaSignOutAlt className="mr-3 text-xl" /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;