import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import { FaEnvelope, FaTimes } from 'react-icons/fa';

const UnreadMessagesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, unreadConversations } = useUnreadMessages();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (unreadCount === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-700 hover:text-blue-600 transition p-2 rounded-full hover:bg-gray-100"
      >
        <FaEnvelope className="text-xl" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Unread Messages</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {unreadConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No unread messages
              </div>
            ) : (
              unreadConversations.map((conv) => (
                <Link
                  key={conv.conversationId}
                  to={`/chat/${conv.sender._id}`}
                  onClick={() => setIsOpen(false)}
                  className="block p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="flex items-center">
                    {conv.sender.profilePicture ? (
                      <img
                        src={conv.sender.profilePicture}
                        alt={conv.sender.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {conv.sender.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm">{conv.sender.name}</p>
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="p-2 border-t">
            <Link
              to="/chat"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-blue-600 hover:text-blue-800 py-1"
            >
              View All Messages
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnreadMessagesDropdown;