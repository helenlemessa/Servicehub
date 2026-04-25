import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaTrash, FaReply } from 'react-icons/fa';
import { parseMentions } from '../utils/mentions';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { requireAuth } from '../utils/authGuard';
const CommentSection = ({ postId, comments, currentUser, onComment, onDeleteComment, onLikeComment, onAddReply, onDeleteReply, onLikeReply }) => {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyStates, setReplyStates] = useState({});
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-based classes
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const borderColor = isDark ? 'border-gray-600' : 'border-gray-300';
  const commentBg = isDark ? 'bg-gray-700' : 'bg-gray-100';
  const replyBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-700';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setLoading(true);
    await onComment(postId, newComment);
    setNewComment('');
    setLoading(false);
  };

  const handleSubmitReply = async (e, commentId) => {
    e.preventDefault();
    const replyText = replyStates[commentId]?.text || '';
    if (!replyText.trim()) return;
    
    setLoading(true);
    await onAddReply(postId, commentId, replyText);
    setReplyStates(prev => ({
      ...prev,
      [commentId]: { ...prev[commentId], text: '', showReplyInput: false }
    }));
    setLoading(false);
  };

  const toggleReplyInput = (commentId) => {
    setReplyStates(prev => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        showReplyInput: !prev[commentId]?.showReplyInput,
        text: prev[commentId]?.text || ''
      }
    }));
  };

  const updateReplyText = (commentId, text) => {
    setReplyStates(prev => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        text: text
      }
    }));
  };

  const toggleReplies = (commentId) => {
    setReplyStates(prev => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        showReplies: !prev[commentId]?.showReplies
      }
    }));
  };
const navigate = useNavigate();

const handleCommentClick = async (e) => {
  e.preventDefault();
  if (!requireAuth(navigate, 'comment')) return;
  await handleSubmitComment(e);
};
  // Reply Component with full features
  const Reply = ({ reply, commentId }) => {
    const [showActions, setShowActions] = useState(false);
    const [showReplyToReply, setShowReplyToReply] = useState(false);
    const [replyToReplyText, setReplyToReplyText] = useState('');
    const isLiked = reply.likes?.includes(currentUser?._id);
    const isOwner = reply.user?._id === currentUser?._id;

    const handleReplyToReply = async (e) => {
      e.preventDefault();
      if (!replyToReplyText.trim()) return;
      
      await onAddReply(postId, commentId, `@${reply.user?.name} ${replyToReplyText}`);
      setReplyToReplyText('');
      setShowReplyToReply(false);
    };

    return (
      <div 
        className="flex gap-3 mt-3 ml-9"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <Link to={`/profile/${reply.user?._id}`} className="flex-shrink-0">
          {reply.user?.profilePicture ? (
            <img
              src={reply.user.profilePicture}
              alt={reply.user.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
              {reply.user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </Link>
        
        <div className="flex-1">
          <div className={`${replyBg} rounded-lg p-2`}>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                to={`/profile/${reply.user?._id}`}
                className={`font-semibold text-xs ${textPrimary} hover:underline`}
              >
                {reply.user?.name || 'Unknown User'}
              </Link>
              <span className={`text-xs ${textMuted}`}>
                {formatTime(reply.createdAt)}
              </span>
              {reply.edited && (
                <span className={`text-xs ${textMuted}`}>(edited)</span>
              )}
            </div>
            <p className={`text-xs ${textSecondary} break-words`}>
              {parseMentions(reply.text)}
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-1 ml-1">
            <button
              onClick={() => onLikeReply?.(postId, commentId, reply._id)}
              className={`flex items-center gap-1 text-xs transition ${
                isLiked ? 'text-red-500' : `${textMuted} hover:text-red-500`
              }`}
            >
              {isLiked ? <FaHeart size={8} /> : <FaRegHeart size={8} />}
              <span>{reply.likes?.length || 0}</span>
            </button>
            
            <button
              onClick={() => setShowReplyToReply(!showReplyToReply)}
              className={`flex items-center gap-1 text-xs ${textMuted} hover:text-blue-500 transition`}
            >
              <FaReply size={8} />
              <span>Reply</span>
            </button>
            
            {isOwner && (
              <button
                onClick={() => onDeleteReply?.(postId, commentId, reply._id)}
                className={`flex items-center gap-1 text-xs ${textMuted} hover:text-red-500 transition`}
              >
                <FaTrash size={8} />
                <span>Delete</span>
              </button>
            )}
          </div>
          
          {showReplyToReply && (
            <div className="mt-2">
              <form onSubmit={handleReplyToReply} className="flex gap-2">
                {currentUser?.profilePicture ? (
                  <img
                    src={currentUser.profilePicture}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="text"
                    value={replyToReplyText}
                    onChange={(e) => setReplyToReplyText(e.target.value)}
                    placeholder={`Reply to ${reply.user?.name}...`}
                    className={`w-full px-2 py-1 border ${borderColor} rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs ${inputBg} ${inputText} ${placeholderColor}`}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!replyToReplyText.trim()}
                  className="px-2 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 text-xs"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplyToReply(false)}
                  className={`px-2 py-1 ${textMuted} hover:${textSecondary} text-xs`}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
        
        {showActions && !isOwner && (
          <button
            onClick={() => setShowReplyToReply(true)}
            className={`${textMuted} hover:text-blue-500 transition`}
            title="Reply"
          >
            <FaReply size={10} />
          </button>
        )}
      </div>
    );
  };

  // Main Comment Component
  const Comment = ({ comment }) => {
    const [showActions, setShowActions] = useState(false);
    const isLiked = comment.likes?.includes(currentUser?._id);
    const isOwner = comment.user?._id === currentUser?._id;
    const replyCount = comment.replies?.length || 0;
    const showReplyInput = replyStates[comment._id]?.showReplyInput || false;
    const replyText = replyStates[comment._id]?.text || '';
    const showReplies = replyStates[comment._id]?.showReplies || false;
    
    return (
      <div className="mb-4">
        <div 
          className="flex gap-3"
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <Link to={`/profile/${comment.user?._id}`} className="flex-shrink-0">
            {comment.user?.profilePicture ? (
              <img
                src={comment.user.profilePicture}
                alt={comment.user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                {comment.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </Link>
          
          <div className="flex-1">
            <div className={`${commentBg} rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  to={`/profile/${comment.user?._id}`}
                  className={`font-semibold text-sm ${textPrimary} hover:underline`}
                >
                  {comment.user?.name || 'Unknown User'}
                </Link>
                <span className={`text-xs ${textMuted}`}>
                  {formatTime(comment.createdAt)}
                </span>
                {comment.edited && (
                  <span className={`text-xs ${textMuted}`}>(edited)</span>
                )}
              </div>
              <p className={`text-sm ${textSecondary} break-words`}>
                {parseMentions(comment.text)}
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-1 ml-1">
              <button
                onClick={() => onLikeComment?.(postId, comment._id)}
                className={`flex items-center gap-1 text-xs transition ${
                  isLiked ? 'text-red-500' : `${textMuted} hover:text-red-500`
                }`}
              >
                {isLiked ? <FaHeart size={10} /> : <FaRegHeart size={10} />}
                <span>{comment.likes?.length || 0}</span>
              </button>
              
              <button
                onClick={() => toggleReplyInput(comment._id)}
                className={`flex items-center gap-1 text-xs ${textMuted} hover:text-blue-500 transition`}
              >
                <FaReply size={10} />
                <span>Reply</span>
              </button>
              
              {replyCount > 0 && (
                <button
                  onClick={() => toggleReplies(comment._id)}
                  className={`text-xs ${textMuted} hover:text-blue-500 transition`}
                >
                  {showReplies ? 'Hide' : 'Show'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
              
              {isOwner && (
                <button
                  onClick={() => onDeleteComment?.(postId, comment._id)}
                  className={`flex items-center gap-1 text-xs ${textMuted} hover:text-red-500 transition`}
                >
                  <FaTrash size={10} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
          
          {showActions && !isOwner && (
            <button
              onClick={() => toggleReplyInput(comment._id)}
              className={`${textMuted} hover:text-blue-500 transition`}
              title="Reply"
            >
              <FaReply size={12} />
            </button>
          )}
        </div>
        
        {showReplyInput && (
          <div className="mt-2 ml-11">
            <form onSubmit={(e) => handleSubmitReply(e, comment._id)} className="flex gap-2">
              {currentUser?.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => updateReplyText(comment._id, e.target.value)}
                  placeholder={`Reply to ${comment.user?.name}...`}
                  className={`w-full px-3 py-1 border ${borderColor} rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} ${placeholderColor}`}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !replyText.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 text-xs"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => toggleReplyInput(comment._id)}
                className={`px-3 py-1 ${textMuted} hover:${textSecondary} text-xs`}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
        
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply, idx) => (
              <Reply key={idx} reply={reply} commentId={comment._id} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`mt-4 pt-4 border-t ${borderColor}`}>
      {/* Main Comment Input */}
      <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
        {currentUser?.profilePicture ? (
          <img
            src={currentUser.profilePicture}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className={`w-full px-3 py-2 border ${borderColor} rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} ${placeholderColor}`}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
      
      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {!comments || comments.length === 0 ? (
          <div className="text-center py-4">
            <p className={`text-sm ${textMuted}`}>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Comment key={comment._id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;