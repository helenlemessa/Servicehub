// frontend/src/components/PostCard.jsx - WITH AUTH PROTECTION
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaRetweet, FaShare, FaEllipsisH, FaEdit, FaTrash, FaBookmark, FaRegBookmark, FaFlag, FaShoppingCart } from 'react-icons/fa';
import CommentSection from './CommentSection';
import axios from 'axios';
import toast from 'react-hot-toast';
import RepostModal from './RepostModal';
import ReportModal from './ReportModal';
import { useAuth } from '../context/AuthContext';
import { requireAuth } from '../utils/authGuard';

const PostCard = ({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onShare,
  onDeleteComment,
  onLikeComment,
  onAddReply,
  onDeleteReply,
  onLikeReply,
  onEditPost,
  onDeletePost,
  onRepostUpdate, 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.description);
  const [editPrice, setEditPrice] = useState(post.price);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSaved, setIsSaved] = useState(post.savedBy?.includes(currentUser?._id));
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  
  useEffect(() => {
    if (currentUser && post.reposts) {
      const hasReposted = post.reposts.some(r => {
        const userId = r.user?._id || r.user;
        return userId === currentUser._id;
      });
      setIsReposted(hasReposted);
    }
    setRepostCount(post.repostCount || post.reposts?.length || 0);
  }, [post.reposts, post.repostCount, currentUser]);
  
  const isLiked = currentUser && post.likes?.includes(currentUser._id);
  const isOwner = currentUser && post.seller?._id === currentUser._id;
  const canOrder = currentUser && post.seller?._id !== currentUser._id;

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

  const handleEditSubmit = async () => {
    if (!requireAuth(navigate, 'edit this post')) return;
    try {
      await axios.put(`/services/${post._id}`, { description: editText, price: editPrice });
      toast.success('Post updated!');
      setIsEditing(false);
      if (onEditPost) onEditPost(post._id, { description: editText, price: editPrice });
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!requireAuth(navigate, 'delete this post')) return;
    const postId = post._id;
    console.log('Attempting to delete post with ID:', postId);
    
    if (!postId) {
      console.error('No post ID found!');
      toast.error('Cannot delete: Post ID missing');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await axios.delete(`/services/${postId}`);
        console.log('Delete response:', response);
        
        if (response.status === 200) {
          toast.success('Post deleted successfully!');
          if (onDeletePost) {
            onDeletePost(postId);
          }
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Delete error:', error.response?.data || error);
          toast.error(error.response?.data?.message || 'Failed to delete post');
        } else {
          console.log('Post already deleted (404), updating UI');
          if (onDeletePost) {
            onDeletePost(postId);
          }
        }
      }
    }
  };

  const handleSave = async () => {
    if (!requireAuth(navigate, 'save this post')) return;
    try {
      const { data } = await axios.post(`/services/${post._id}/save`);
      setIsSaved(data.saved);
      toast.success(data.saved ? 'Post saved!' : 'Post unsaved');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleOrder = () => {
    if (!requireAuth(navigate, 'place an order')) return;
    navigate(`/services/${post._id}/order`);
  };

  const handleRepostClick = () => {
    if (!requireAuth(navigate, 'repost')) return;
    if (isReposted) {
      removeRepost();
    } else {
      setShowRepostModal(true);
    }
  };

  const removeRepost = async () => {
    try {
      const { data } = await axios.delete(`/services/${post._id}/repost`);
      setIsReposted(false);
      setRepostCount(data.repostCount);
      toast.success('Repost removed');
      
      if (onRepostUpdate) {
        onRepostUpdate(post._id, { reposted: false, repostCount: data.repostCount });
      }
    } catch (error) {
      console.error('Remove repost error:', error);
      toast.error('Failed to remove repost');
    }
  };

  const addRepostWithComment = async (comment) => {
    try {
      const { data } = await axios.post(`/services/${post._id}/repost`, { comment: comment || '' });
      setIsReposted(true);
      setRepostCount(data.repostCount);
      toast.success('Reposted!');
      await refreshUser();
      
      if (onRepostUpdate) {
        onRepostUpdate(post._id, { reposted: true, repostCount: data.repostCount, comment });
      }
    } catch (error) {
      console.error('Repost error:', error);
      if (error.response?.status === 400) {
        toast.error('You have already reposted this post');
      } else {
        toast.error('Failed to repost');
      }
      throw error;
    }
  };

  const handleLikeClick = () => {
    if (!requireAuth(navigate, 'like this post')) return;
    onLike(post._id);
  };

  const handleShareClick = () => {
    if (!requireAuth(navigate, 'share this post')) return;
    onShare(post._id);
  };

  const handleCommentClick = () => {
    if (!requireAuth(navigate, 'comment')) return;
    setShowComments(!showComments);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition">
      <div className="p-3 sm:p-4">
        {post.repostedBy && post.repostedBy._id !== currentUser?._id && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-2 ml-12">
            <FaRetweet size={12} />
            <Link to={`/profile/${post.repostedBy._id}`} className="font-medium hover:underline">
              {post.repostedBy.name}
            </Link>
            <span>reposted</span>
            {post.repostComment && post.repostComment !== post._id && (
              <span className="text-gray-500 dark:text-gray-400">· {post.repostComment}</span>
            )}
          </div>
        )}
        
        <div className="flex justify-between">
          <Link to={`/profile/${post.seller?._id}`} className="flex gap-2 sm:gap-3">
            {post.seller?.profilePicture ? (
              <img src={post.seller.profilePicture} alt={post.seller.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg sm:text-xl">
                {post.seller?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm sm:text-base hover:underline dark:text-white">{post.seller?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{post.seller?.role === 'seller' ? 'Service Provider' : 'Client'} • {formatTime(post.createdAt)}</p>
            </div>
          </Link>
          
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <FaEllipsisH className="text-sm sm:text-base dark:text-gray-300" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                {canOrder && post.price > 0 && (
                  <>
                    <button onClick={() => { handleOrder(); setShowMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 text-green-600 dark:text-green-400">
                      <FaShoppingCart size={14} /> Order This Service
                    </button>
                    <hr className="my-1 dark:border-gray-700" />
                  </>
                )}
                {isOwner && (
                  <>
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 dark:text-gray-300">
                      <FaEdit size={14} /> Edit Post
                    </button>
                    <button onClick={handleDelete} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <FaTrash size={14} /> Delete Post
                    </button>
                    <hr className="my-1 dark:border-gray-700" />
                  </>
                )}
                <button onClick={() => { handleSave(); setShowMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 dark:text-gray-300">
                  {isSaved ? <FaBookmark size={14} className="text-yellow-500" /> : <FaRegBookmark size={14} />}
                  {isSaved ? 'Unsave Post' : 'Save Post'}
                </button>
                <button onClick={() => { setShowReportModal(true); setShowMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <FaFlag size={14} /> Report Post
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="mt-3 space-y-3">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="4" />
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Price (ETB)</label>
              <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleEditSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Save Changes</button>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3">
              <p className="text-gray-800 dark:text-gray-200 text-sm sm:text-base whitespace-pre-wrap">{post.description}</p>
              {post.price > 0 && (
                <div className="mt-2 inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs sm:text-sm">{post.price} ETB</div>
              )}
            </div>
            
            {post.images && post.images.length > 0 && (
              <div className={`mt-3 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {post.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`Post ${idx}`} className="w-full h-48 sm:h-64 object-cover rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(img, '_blank')} />
                ))}
              </div>
            )}
          </>
        )}
        
        <div className="flex gap-4 mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>{post.likeCount || post.likes?.length || 0} likes</span>
          <span>{post.commentCount || post.comments?.length || 0} comments</span>
          <span>{repostCount} reposts</span>
        </div>
        
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
              isReposted 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 font-medium' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FaRetweet className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm">{isReposted ? 'Reposted ✓' : 'Repost'}</span>
          </button>
          
          <button 
            onClick={handleShareClick} 
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FaShare className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm">Share</span>
          </button>
        </div>
        
        {showComments && (
          <CommentSection
            postId={post._id}
            comments={post.comments || []}
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
        post={post} 
      />
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        postId={post._id} 
      />
    </div>
  );
};

export default PostCard;