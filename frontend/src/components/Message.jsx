// frontend/src/components/Message.jsx - UPDATED
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';
import MediaPreview from './MediaPreview';
import MessageContextMenu from './MessageContextMenu';
import LinkPreview from './LinkPreview';
import { extractUrls } from '../utils/linkUtils';

const Message = ({ message, onEdit, onDeleteForMe, onDeleteForEveryone, isSender }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const { user } = useAuth();
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuX = e.clientX;
    const menuY = e.clientY;
    
    setContextMenuPos({
      x: menuX,
      y: menuY
    });
    setShowContextMenu(true);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message._id, editText);
    }
    setIsEditing(false);
  };
  
  const handleDeleteForMe = () => {
    onDeleteForMe(message._id);
  };
  
  const handleDeleteForEveryone = () => {
    onDeleteForEveryone(message._id);
  };
  
  // Extract URLs from message text
  const urls = message.text ? extractUrls(message.text) : [];
  const hasMedia = (message.messageType !== 'text' || message.mediaUrl);
  
  // Format text with clickable links
  const formatTextWithLinks = (text) => {
    if (!text) return null;
    
    const parts = [];
    let lastIndex = 0;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      // Add the link
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline break-all ${isSender ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {match[0]}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }
    
    return parts;
  };
  
  // Check if message is deleted
  if (message.deletedForEveryone) {
    return (
      <div className="mb-4 flex justify-center">
        <div className="text-xs text-gray-400 italic">
          This message was deleted
        </div>
      </div>
    );
  }
  
  if (message.deletedFor?.includes(user?._id)) {
    return null;
  }
  
  return (
    <>
      <div 
        className={`mb-4 flex ${isSender ? 'justify-end' : 'justify-start'}`}
        onContextMenu={handleRightClick}
      >
        <div className={`max-w-[70%] ${isSender ? 'cursor-pointer' : ''}`}>
          <div
            className={`rounded-lg p-3 ${
              isSender
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800 shadow-sm'
            }`}
          >
            {/* Media Content */}
            {hasMedia && (
              <div className="mb-2">
                <MediaPreview message={message} isSender={isSender} />
              </div>
            )}
            
            {/* Text Content */}
            {message.text && (
              <>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-2 py-1 text-gray-800 rounded"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="break-words">
                      {formatTextWithLinks(message.text)}
                    </p>
                    {message.edited && (
                      <span className="text-xs opacity-70 ml-1">(edited)</span>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Link Previews - show for each URL found */}
            {!isEditing && urls.length > 0 && (
              <div className="mt-2 space-y-2">
                {urls.map((url, index) => (
                  <LinkPreview key={index} url={url} isSender={isSender} />
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className={`text-xs ${isSender ? 'text-blue-100' : 'text-gray-400'}`}>
                {formatTime(message.createdAt)}
              </span>
              
              {isSender && !isEditing && (
                <span className="text-xs">
                  {message.read ? (
                    <FaCheckDouble className="text-blue-200" title="Seen" />
                  ) : (
                    <FaCheck className="text-blue-200" title="Delivered" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showContextMenu && (
        <MessageContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setShowContextMenu(false)}
          onEdit={handleEdit}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          isSender={isSender}
        />
      )}
    </>
  );
};

export default Message;