// frontend/src/components/RepostCard.jsx - WITH AUTH PROTECTION
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaRetweet, FaShare } from 'react-icons/fa';
import CommentSection from './CommentSection';
import RepostModal from './RepostModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';

const RepostCard = ({ 
  repost, 
  originalPost, 
  currentUser, 
  onLike, 
  onComment, 
  onShare,
  onDeleteComment,
  onLikeComment,
  onAddReply,
  onDeleteReply,
  onLikeReply,
  onRepostUpdate
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [localIsReposted, setLocalIsReposted] = useState(false);
  const [localRepostCount, setLocalRepostCount] = useState(0);
  
  useEffect(() => {
    if (currentUser && originalPost?.reposts) {
      const hasReposted = originalPost.reposts.some(r => {
        const userId = r.user?._id || r.user;
        return userId === currentUser._id;
      });
      setLocalIsReposted(hasReposted);
    }
    setLocalRepostCount(originalPost?.repostCount || originalPost?.reposts?.length || 0);
  }, [originalPost?.reposts, originalPost?.repostCount, currentUser]);
  
  const isLiked = currentUser && originalPost?.likes?.includes(currentUser._id);
  const reposter = repost?.user || repost;
  const repostComment = repost?.withComment || '';

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

  const handleRepostClick = () => {
    if (!requireAuth(navigate, 'repost')) return;
    if (localIsReposted) {
      removeRepost();
    } else {
      setShowRepostModal(true);
    }
  };

  const handleLikeClick = () => {
    if (!requireAuth(navigate, 'like this post')) return;
    onLike(originalPost._id);
  };

  const handleCommentClick = () => {
    if (!requireAuth(navigate, 'comment')) return;
    setShowComments(!showComments);
  };

  const handleShareClick = () => {
    if (!requireAuth(navigate, 'share this post')) return;
    onShare(originalPost._id);
  };

  const removeRepost = async () => {
    try {
      const { data } = await axios.delete(`/services/${originalPost._id}/repost`);
      toast.success('Repost removed');
      setLocalIsReposted(false);
      setLocalRepostCount(data.repostCount);
      
      if (onRepostUpdate) {
        onRepostUpdate(originalPost._id, { reposted: false, repostCount: data.repostCount });
      }
    } catch (error) {
      console.error('Remove repost error:', error);
      toast.error('Failed to remove repost');
    }
  };

  const addRepostWithComment = async (comment) => {
    try {
      const { data } = await axios.post(`/services/${originalPost._id}/repost`, { comment });
      toast.success('Reposted!');
      setLocalIsReposted(true);
      setLocalRepostCount(data.repostCount);
      setShowRepostModal(false);
      await refreshUser();
      
      if (onRepostUpdate) {
        onRepostUpdate(originalPost._id, { reposted: true, repostCount: data.repostCount, comment });
      }
    } catch (error) {
      console.error('Repost error:', error);
      if (error.response?.status === 400) {
        toast.error('You have already reposted this post');
      } else {
        toast.error('Failed to repost');
      }
    }
  };

  if (!originalPost) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition">
      <div className="p-3 sm:p-4">
        {/* Repost Header - Who reposted */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 dark:text-green-400 mb-2">
          <FaRetweet size={12} />
          <Link to={`/profile/${reposter?._id}`} className="font-medium hover:underline">
            {reposter?.name}
          </Link>
          <span>reposted</span>
          {repostComment && repostComment !== originalPost._id && (
            <span className="text-gray-500 dark:text-gray-400">· {repostComment}</span>
          )}
        </div>
        
        {/* Original Post Header */}
        <div className="flex justify-between">
          <Link to={`/profile/${originalPost.seller?._id}`} className="flex gap-2 sm:gap-3">
            {originalPost.seller?.profilePicture ? (
              <img src={originalPost.seller.profilePicture} alt={originalPost.seller.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg sm:text-xl">
                {originalPost.seller?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm sm:text-base hover:underline dark:text-white">{originalPost.seller?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{originalPost.seller?.role === 'seller' ? 'Service Provider' : 'Client'} • {formatTime(originalPost.createdAt)}</p>
            </div>
          </Link>
        </div>
        
        {/* Original Post Content */}
        <div className="mt-3">
          <p className="text-gray-800 dark:text-gray-200 text-sm sm:text-base whitespace-pre-wrap">{originalPost.description}</p>
          {originalPost.price > 0 && (
            <div className="mt-2 inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs sm:text-sm">{originalPost.price} ETB</div>
          )}
        </div>
        
        {/* Original Post Images */}
        {originalPost.images && originalPost.images.length > 0 && (
          <div className={`mt-3 grid gap-2 ${originalPost.images.length === 1 ? 'grid-cols-1' : originalPost.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {originalPost.images.map((img, idx) => (
              <img key={idx} src={img} alt={`Post ${idx}`} className="w-full h-48 sm:h-64 object-cover rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(img, '_blank')} />
            ))}
          </div>
        )}
        
        {/* Engagement Stats */}
        <div className="flex gap-4 mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>{originalPost.likeCount || originalPost.likes?.length || 0} likes</span>
          <span>{originalPost.commentCount || originalPost.comments?.length || 0} comments</span>
          <span>{localRepostCount} reposts</span>
        </div>
        
        {/* Action Buttons - REPOST BUTTON ENABLED */}
        <div className="flex justify-between mt-3 pt-3 border-t dark:border-gray-700">
          <button 
            onClick={handleLikeClick} 
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg transition ${isLiked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            {isLiked ? <FaHeart className="fill-current text-sm sm:text-base" /> : <FaRegHeart className="text-sm sm:text-base" />}
            <span className="text-xs sm:text-sm">Like</span>
          </button>
          
          <button 
            onClick={handleCommentClick} 
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FaComment className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm">Comment</span>
          </button>
          
          <button 
            onClick={handleRepostClick} 
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg transition ${
              localIsReposted 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 font-medium' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FaRetweet className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm">{localIsReposted ? 'Reposted ✓' : 'Repost'}</span>
          </button>
          
          <button 
            onClick={handleShareClick} 
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FaShare className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm">Share</span>
          </button>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <CommentSection
            postId={originalPost._id}
            comments={originalPost.comments || []}
            currentUser={currentUser}
            onComment={onComment}
            onDeleteComment={onDeleteComment}
            onLikeComment={onLikeComment}
            onAddReply={onAddReply}
            onDeleteReply={onDeleteReply}
            onLikeReply={onLikeReply}
          />
        )}
      </div>
      
      <RepostModal 
        isOpen={showRepostModal} 
        onClose={() => setShowRepostModal(false)} 
        onRepost={addRepostWithComment} 
        post={originalPost} 
      />
    </div>
  );
};

export default RepostCard;