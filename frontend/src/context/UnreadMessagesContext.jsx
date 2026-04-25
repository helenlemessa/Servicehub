import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import axios from 'axios';

const UnreadMessagesContext = createContext();

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};

export const UnreadMessagesProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByConversation, setUnreadByConversation] = useState({});
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  // Fetch unread count from server
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const { data } = await axios.get('/messages/unread/count');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated, user]);

  // Fetch unread messages grouped by conversation
  const fetchUnreadConversations = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const { data } = await axios.get('/messages/unread');
      const counts = {};
      data.forEach(conv => {
        counts[conv.conversationId] = conv.unreadCount;
      });
      setUnreadByConversation(counts);
    } catch (error) {
      console.error('Error fetching unread conversations:', error);
    }
  }, [isAuthenticated, user]);

  // Get unread count for a specific conversation
  const getUnreadCountForConversation = useCallback((conversationId) => {
    return unreadByConversation[conversationId] || 0;
  }, [unreadByConversation]);

  // Mark messages as read for a conversation
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      await axios.put(`/messages/read/${conversationId}`);
      setUnreadByConversation(prev => ({
        ...prev,
        [conversationId]: 0
      }));
      // Recalculate total unread count
      const totalUnread = Object.values(unreadByConversation).reduce((sum, count) => sum + count, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [unreadByConversation]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Only increment if message is for current user and not from self
      if (message.receiver._id === user?._id && message.sender._id !== user?._id) {
        console.log('🔴 New unread message received!');
        
        // Update unread count for this conversation
        setUnreadByConversation(prev => {
          const currentCount = prev[message.conversationId] || 0;
          const newCount = currentCount + 1;
          return {
            ...prev,
            [message.conversationId]: newCount
          };
        });
        
        // Update total unread count
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, user]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
      fetchUnreadConversations();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchUnreadConversations();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchUnreadCount, fetchUnreadConversations]);

  const value = {
    unreadCount,
    unreadByConversation,
    getUnreadCountForConversation,
    markConversationAsRead,
    refreshUnreadCount: fetchUnreadCount,
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};