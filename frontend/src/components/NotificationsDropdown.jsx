import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { FaBell, FaUserPlus, FaEye, FaHeart, FaComment, FaRetweet, FaShoppingCart } from 'react-icons/fa';

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme } = useTheme();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);
    
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
    } else if (notification.targetId && notification.targetModel === 'Service') {
      navigate(`/services/${notification.targetId}`);
    } else if (notification.targetModel === 'Order') {
      navigate('/dashboard');
    }
    
    setIsOpen(false);
  };

  const handleProfileClick = (e, userId) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'follow': return <FaUserPlus className="text-green-500" />;
      case 'profile_view': return <FaEye className="text-blue-500" />;
      case 'like': return <FaHeart className="text-red-500" />;
      case 'comment': return <FaComment className="text-purple-500" />;
      case 'repost': return <FaRetweet className="text-green-500" />;
      case 'order_placed': return <FaShoppingCart className="text-orange-500" />;
      default: return <FaBell className="text-gray-500" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const isDark = theme === 'dark';
  const dropdownBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const unreadBg = isDark ? 'bg-gray-700' : 'bg-blue-50';

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile to close when clicking outside */}
          <div 
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={dropdownRef}
            className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-16 md:top-auto md:mt-2 w-auto md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
            style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'hidden' }}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <FaBell className="mx-auto text-2xl mb-2" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition ${
                      !notif.read ? 'bg-blue-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-2">
                      <div 
                        onClick={(e) => handleProfileClick(e, notif.sender?._id)}
                        className="flex-shrink-0 cursor-pointer hover:opacity-80"
                      >
                        {notif.sender?.profilePicture ? (
                          <img
                            src={notif.sender.profilePicture}
                            alt={notif.sender.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                            {notif.sender?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1">
                          <div className="mt-0.5 flex-shrink-0">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs break-words text-gray-700 dark:text-gray-300">
                              <button
                                onClick={(e) => handleProfileClick(e, notif.sender?._id)}
                                className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                              >
                                {notif.sender?.name}
                              </button>
                              {' '}
                              <span className="text-gray-600 dark:text-gray-400">{notif.content}</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatTime(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;