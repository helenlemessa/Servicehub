// frontend/src/pages/Chat.jsx - COMPLETE FIXED VERSION WITH DARK MODE
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { FaPaperPlane, FaArrowLeft, FaImage, FaPaperclip, FaMicrophone, FaBars } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Message from '../components/Message';
import VoiceRecorder from '../components/VoiceRecorder';

// MessageInput component with dark mode support
const MessageInputComponent = ({ 
  onSendMessage, 
  onSendImage, 
  onSendFile, 
  onVoiceMessage,
  uploadingMedia,
  sending,
  isDark 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Theme-based classes
  const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const borderColor = isDark ? 'border-gray-600' : 'border-gray-300';
  const buttonHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const iconColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const iconHover = isDark ? 'hover:text-blue-400' : 'hover:text-blue-500';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div className={`${bgColor} border-t ${isDark ? 'border-gray-700' : ''} p-3 flex-shrink-0 transition-colors duration-200`}>
      {showVoiceRecorder ? (
        <VoiceRecorder
          onSend={onVoiceMessage}
          onCancel={() => setShowVoiceRecorder(false)}
          isDark={isDark}
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) onSendImage(e.target.files[0]);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingMedia}
            className={`p-2 ${iconColor} ${iconHover} transition disabled:opacity-50 rounded-full ${buttonHover}`}
            title="Send Image"
          >
            <FaImage size={20} />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files[0]) onSendFile(e.target.files[0]);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
            className={`p-2 ${iconColor} ${iconHover} transition disabled:opacity-50 rounded-full ${buttonHover}`}
            title="Send File"
          >
            <FaPaperclip size={20} />
          </button>
          
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            disabled={uploadingMedia}
            className={`p-2 ${iconColor} ${iconHover} transition disabled:opacity-50 rounded-full ${buttonHover}`}
            title="Voice Message"
          >
            <FaMicrophone size={20} />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || uploadingMedia}
            className={`flex-1 px-4 py-2 border ${borderColor} rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || uploadingMedia}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition disabled:opacity-50"
          >
            {sending || uploadingMedia ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaPaperPlane size={16} />
            )}
          </button>
        </form>
      )}
    </div>
  );
};

const Chat = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { getUnreadCountForConversation, markConversationAsRead } = useUnreadMessages();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const isDark = theme === 'dark';

  // Theme-based classes for chat components
  const bgPrimary = isDark ? 'bg-gray-900' : 'bg-gray-100';
  const bgSecondary = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const activeBg = isDark ? 'bg-gray-700' : 'bg-blue-50';
  const chatBg = isDark ? 'bg-gray-800' : 'bg-white';

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getConversationId = useCallback((user1Id, user2Id) => {
    return [user1Id, user2Id].sort().join('_');
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get('/messages/conversations');
      const uniqueConversations = [];
      const conversationMap = new Map();
      
      data.forEach(msg => {
        if (!conversationMap.has(msg.conversationId)) {
          conversationMap.set(msg.conversationId, msg);
          uniqueConversations.push(msg);
        }
      });
      
      setConversations(uniqueConversations);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!userId || !user) return;
    
    setLoading(true);
    const conversationId = getConversationId(user._id, userId);
    
    try {
      const { data } = await axios.get(`/messages/${conversationId}`);
      setMessages(data);
    } catch (error) {
      console.error('Fetch messages error:', error);
      if (error.response?.status === 404) {
        setMessages([]);
      } else {
        toast.error('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, user, getConversationId]);

  const fetchUserDetails = useCallback(async () => {
    try {
      const { data } = await axios.get(`/users/${userId}`);
      setSelectedUser(data);
    } catch (error) {
      console.error('Fetch user error:', error);
      toast.error('User not found');
      navigate('/dashboard');
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId && user) {
      const conversationId = getConversationId(user._id, userId);
      markConversationAsRead(conversationId);
    }
  }, [userId, user, markConversationAsRead, getConversationId]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (userId && user) {
      fetchUserDetails();
      fetchMessages();
    }
  }, [userId, user, fetchUserDetails, fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const currentConvId = getConversationId(user?._id, userId);
      if (message.conversationId === currentConvId) {
        setMessages(prev => [...prev, message]);
      }
      fetchConversations();
    };

    const handleMessageSent = (message) => {
      setMessages(prev => [...prev, message]);
      setSending(false);
      setUploadingMedia(false);
      fetchConversations();
    };

    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, read: true, readAt: data.readAt }
          : msg
      ));
    };

    const handleMessageEdited = (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
      fetchConversations();
    };

    const handleMessageDeleted = (data) => {
      if (data.deletedForEveryone) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, deletedForEveryone: true }
            : msg
        ));
      } else {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
      fetchConversations();
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_read', handleMessageRead);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_read', handleMessageRead);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, user, userId, getConversationId, fetchConversations]);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text) => {
    if (!socket) {
      toast.error('Connection error. Please refresh the page.');
      return;
    }

    setSending(true);
    const conversationId = getConversationId(user._id, userId);
    
    const messageData = {
      conversationId,
      senderId: user._id,
      receiverId: userId,
      text: text.trim(),
      messageType: 'text',
    };

    socket.emit('send_message', messageData);
  };

  const handleSendImage = async (file) => {
    if (!file) return;
    
    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('type', 'image');
    
    try {
      const { data: uploadData } = await axios.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const conversationId = getConversationId(user._id, userId);
      const messageData = {
        conversationId,
        receiverId: userId,
        mediaUrl: uploadData.url,
        mediaName: file.name,
        mediaSize: file.size,
        messageType: 'image',
      };
      
      const { data: message } = await axios.post('/messages/media', messageData);
      setMessages(prev => [...prev, message]);
      fetchConversations();
      
      toast.success('Image sent successfully');
    } catch (error) {
      console.error('Send image error:', error);
      toast.error('Failed to send image');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSendFile = async (file) => {
    if (!file) return;
    
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB');
      return;
    }
    
    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('type', 'file');
    
    try {
      const { data: uploadData } = await axios.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const conversationId = getConversationId(user._id, userId);
      const messageData = {
        conversationId,
        receiverId: userId,
        mediaUrl: uploadData.url,
        mediaName: file.name,
        mediaSize: file.size,
        messageType: 'file',
      };
      
      const { data: message } = await axios.post('/messages/media', messageData);
      setMessages(prev => [...prev, message]);
      fetchConversations();
      
      toast.success('File sent successfully');
    } catch (error) {
      console.error('Send file error:', error);
      toast.error('Failed to send file');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleVoiceMessage = async (audioBlob, duration) => {
    const file = new File([audioBlob], `voice_${Date.now()}.mp3`, { type: 'audio/mp3' });
    
    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('type', 'voice');
    
    try {
      const { data: uploadData } = await axios.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const conversationId = getConversationId(user._id, userId);
      const messageData = {
        conversationId,
        receiverId: userId,
        mediaUrl: uploadData.url,
        mediaName: file.name,
        mediaSize: file.size,
        messageType: 'voice',
        mediaDuration: duration,
      };
      
      const { data: message } = await axios.post('/messages/media', messageData);
      setMessages(prev => [...prev, message]);
      fetchConversations();
      
      toast.success('Voice message sent');
    } catch (error) {
      console.error('Send voice error:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleEditMessage = (messageId, newText) => {
    if (socket) {
      socket.emit('edit_message', {
        messageId,
        text: newText,
        userId: user._id,
      });
    }
  };

  const handleDeleteForMe = (messageId) => {
    if (socket) {
      socket.emit('delete_message', {
        messageId,
        userId: user._id,
        deleteForEveryone: false,
      });
    }
  };

  const handleDeleteForEveryone = (messageId) => {
    if (socket) {
      socket.emit('delete_message', {
        messageId,
        userId: user._id,
        deleteForEveryone: true,
      });
    }
  };

  // ========== DESKTOP VIEW ==========
  if (isDesktop) {
    if (!userId) {
      return (
        <div className={`flex h-screen ${bgPrimary}`}>
          <div className={`w-80 ${bgSecondary} border-r ${borderColor} flex flex-col`}>
            <div className={`p-4 border-b ${borderColor}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className={`p-4 text-center ${textMuted}`}>No conversations yet</div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = conv.sender._id === user._id ? conv.receiver : conv.sender;
                  const unreadCount = getUnreadCountForConversation(conv.conversationId);
                  
                  return (
                    <div
                      key={conv._id}
                      onClick={() => navigate(`/chat/${otherUser._id}`)}
                      className={`p-4 border-b ${borderColor} cursor-pointer ${hoverBg} transition`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {otherUser.profilePicture ? (
                            <img src={otherUser.profilePicture} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                              {otherUser.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${textPrimary}`}>{otherUser.name}</p>
                          <p className={`text-sm ${textMuted} truncate`}>
                            {conv.messageType !== 'text' ? (
                              conv.messageType === 'image' ? '📷 Photo' :
                              conv.messageType === 'voice' ? '🎤 Voice message' : '📎 File'
                            ) : (
                              <>{conv.sender._id === user._id ? 'You: ' : ''}{conv.text}</>
                            )}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className={`flex-1 flex items-center justify-center ${bgPrimary}`}>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className={`text-lg font-medium ${textPrimary}`}>Your messages</h3>
              <p className={`${textMuted} mt-1`}>Select a conversation to start chatting</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex h-screen ${bgPrimary}`}>
        <div className={`w-80 ${bgSecondary} border-r ${borderColor} flex flex-col`}>
          <div className={`p-4 border-b ${borderColor}`}>
            <h2 className={`text-xl font-semibold ${textPrimary}`}>Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
              const otherUser = conv.sender._id === user._id ? conv.receiver : conv.sender;
              const isActive = selectedUser?._id === otherUser._id;
              const unreadCount = getUnreadCountForConversation(conv.conversationId);
              
              return (
                <div
                  key={conv._id}
                  onClick={() => navigate(`/chat/${otherUser._id}`)}
                  className={`p-4 border-b ${borderColor} cursor-pointer ${hoverBg} transition ${isActive ? activeBg : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {otherUser.profilePicture ? (
                        <img src={otherUser.profilePicture} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                          {otherUser.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${textPrimary}`}>{otherUser.name}</p>
                      <p className={`text-sm ${textMuted} truncate`}>
                        {conv.messageType !== 'text' ? (
                          conv.messageType === 'image' ? '📷 Photo' :
                          conv.messageType === 'voice' ? '🎤 Voice message' : '📎 File'
                        ) : (
                          <>{conv.sender._id === user._id ? 'You: ' : ''}{conv.text}</>
                        )}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${chatBg}`}>
          <div className={`${bgSecondary} border-b ${borderColor} px-4 py-3 flex items-center gap-3 flex-shrink-0`}>
            <Link to={`/profile/${selectedUser?._id}`} className="flex items-center gap-3">
              {selectedUser?.profilePicture ? (
                <img src={selectedUser.profilePicture} alt={selectedUser?.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  {selectedUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className={`font-semibold ${textPrimary}`}>{selectedUser?.name}</h2>
                <p className={`text-xs ${textMuted}`}>
                  {selectedUser?.role === 'seller' ? 'Service Provider' : 'Client'}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className={textMuted}>Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className={textMuted}>No messages yet</p>
                <p className={`text-sm ${textMuted} mt-1`}>Send a message to start the conversation</p>
              </div>
            ) : (
              messages.map((msg) => (
                <Message
                  key={msg._id}
                  message={msg}
                  isSender={msg.sender?._id === user._id}
                  onEdit={handleEditMessage}
                  onDeleteForMe={handleDeleteForMe}
                  onDeleteForEveryone={handleDeleteForEveryone}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <MessageInputComponent
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            onSendFile={handleSendFile}
            onVoiceMessage={handleVoiceMessage}
            uploadingMedia={uploadingMedia}
            sending={sending}
            isDark={isDark}
          />
        </div>
      </div>
    );
  }

  // ========== MOBILE VIEW (simplified) ==========
  if (!userId) {
    return (
      <div className={`flex flex-col h-screen ${bgPrimary}`}>
        <div className={`${bgSecondary} border-b ${borderColor} px-4 py-3 sticky top-0 z-10`}>
          <h1 className={`text-xl font-semibold ${textPrimary}`}>Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className={textMuted}>No messages yet</p>
              <p className={`text-sm ${textMuted} mt-1`}>Start a conversation by messaging someone</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = conv.sender._id === user._id ? conv.receiver : conv.sender;
              const unreadCount = getUnreadCountForConversation(conv.conversationId);
              
              return (
                <div
                  key={conv._id}
                  onClick={() => navigate(`/chat/${otherUser._id}`)}
                  className={`${bgSecondary} border-b ${borderColor} px-4 py-3 active:${hoverBg} cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {otherUser.profilePicture ? (
                        <img src={otherUser.profilePicture} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                          {otherUser.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${textPrimary}`}>{otherUser.name}</p>
                      <p className={`text-sm ${textMuted} truncate`}>
                        {conv.messageType !== 'text' ? (
                          conv.messageType === 'image' ? '📷 Photo' :
                          conv.messageType === 'voice' ? '🎤 Voice message' : '📎 File'
                        ) : (
                          <>{conv.sender._id === user._id ? 'You: ' : ''}{conv.text}</>
                        )}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${bgPrimary}`}>
      <div className={`${bgSecondary} border-b ${borderColor} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/chat')} className={`p-2 ${hoverBg} rounded-full`}>
            <FaArrowLeft className={textPrimary} />
          </button>
          <button onClick={() => setShowMobileSidebar(true)} className={`p-2 ${hoverBg} rounded-full`}>
            <FaBars className={textPrimary} />
          </button>
          <Link to={`/profile/${selectedUser?._id}`} className="flex items-center gap-3">
            {selectedUser?.profilePicture ? (
              <img src={selectedUser.profilePicture} alt={selectedUser?.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                {selectedUser?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className={`font-semibold ${textPrimary}`}>{selectedUser?.name}</h2>
              <p className={`text-xs ${textMuted}`}>
                {selectedUser?.role === 'seller' ? 'Service Provider' : 'Client'}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {showMobileSidebar && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowMobileSidebar(false)} />
          <div className={`fixed left-0 top-0 bottom-0 w-80 ${bgSecondary} z-50 shadow-xl overflow-y-auto`}>
            <div className={`p-4 border-b ${borderColor} flex justify-between items-center sticky top-0 ${bgSecondary}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Messages</h2>
              <button onClick={() => setShowMobileSidebar(false)} className={`p-2 ${hoverBg} rounded-full`}>
                ✕
              </button>
            </div>
            <div>
              {conversations.map((conv) => {
                const otherUser = conv.sender._id === user._id ? conv.receiver : conv.sender;
                const unreadCount = getUnreadCountForConversation(conv.conversationId);
                
                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      navigate(`/chat/${otherUser._id}`);
                      setShowMobileSidebar(false);
                    }}
                    className={`p-4 border-b ${borderColor} cursor-pointer ${hoverBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {otherUser.profilePicture ? (
                          <img src={otherUser.profilePicture} alt={otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                            {otherUser.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${textPrimary}`}>{otherUser.name}</p>
                        <p className={`text-sm ${textMuted} truncate`}>
                          {conv.messageType !== 'text' ? (
                            conv.messageType === 'image' ? '📷 Photo' :
                            conv.messageType === 'voice' ? '🎤 Voice message' : '📎 File'
                          ) : (
                            <>{conv.sender._id === user._id ? 'You: ' : ''}{conv.text}</>
                          )}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className={textMuted}>Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className={textMuted}>No messages yet</p>
            <p className={`text-sm ${textMuted} mt-1`}>Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg._id}
              message={msg}
              isSender={msg.sender?._id === user._id}
              onEdit={handleEditMessage}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForEveryone={handleDeleteForEveryone}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInputComponent
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        onSendFile={handleSendFile}
        onVoiceMessage={handleVoiceMessage}
        uploadingMedia={uploadingMedia}
        sending={sending}
        isDark={isDark}
      />
    </div>
  );
};

export default Chat;