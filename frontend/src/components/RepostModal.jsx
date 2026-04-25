// frontend/src/components/RepostModal.jsx
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const RepostModal = ({ isOpen, onClose, onRepost, post }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-based classes
  const modalBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const previewBg = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const buttonHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const cancelHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  const handleSubmit = async () => {
    if (!post || !post._id) return;
    setLoading(true);
    try {
      await onRepost(comment);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Repost error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${modalBg} rounded-lg max-w-md w-full transition-colors duration-200`}>
        <div className={`p-4 border-b ${borderColor} flex justify-between items-center`}>
          <h2 className={`text-xl font-semibold ${textPrimary}`}>Repost</h2>
          <button onClick={onClose} className={`${textMuted} hover:${textSecondary}`}>
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4">
          <div className={`flex items-start gap-3 mb-4 p-3 ${previewBg} rounded-lg`}>
            {post?.seller?.profilePicture ? (
              <img
                src={post.seller.profilePicture}
                alt={post.seller.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                {post?.seller?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className={`font-semibold text-sm ${textPrimary}`}>{post?.seller?.name}</p>
              <p className={`text-sm ${textSecondary} line-clamp-2`}>{post?.description}</p>
            </div>
          </div>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment to your repost (optional)"
            className={`w-full p-3 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
            rows="3"
          />
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 border ${borderColor} rounded-lg ${textSecondary} ${cancelHover} transition`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? 'Reposting...' : 'Repost'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepostModal;