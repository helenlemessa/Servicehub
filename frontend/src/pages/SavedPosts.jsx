import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/services/saved');
      setSavedPosts(data);
    } catch (error) {
      console.error('Fetch saved posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await axios.post(`/services/${postId}/like`);
      setSavedPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, likes: data.liked ? [...post.likes, user._id] : post.likes.filter(id => id !== user._id), likeCount: data.likeCount }
          : post
      ));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      const { data } = await axios.post(`/services/${postId}/comment`, { text });
      setSavedPosts(prev => prev.map(post =>
        post._id === postId
          ? { ...post, comments: [...(post.comments || []), data], commentCount: (post.comments?.length || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleRepost = async (postId) => {
    try {
      const { data } = await axios.post(`/services/${postId}/repost`);
      setSavedPosts(prev => prev.map(post =>
        post._id === postId
          ? { ...post, reposts: data.reposted ? [...(post.reposts || []), { user: user._id }] : (post.reposts || []).filter(r => r.user !== user._id), repostCount: data.repostCount }
          : post
      ));
    } catch (error) {
      console.error('Repost error:', error);
    }
  };

  const handleShare = async (postId) => {
    const url = `${window.location.origin}/services/${postId}`;
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3">
          <FaBookmark className="text-2xl text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Saved Posts</h1>
            <p className="text-gray-500 text-sm">Posts you've saved for later</p>
          </div>
        </div>
      </div>

      {savedPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaRegBookmark className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved posts yet</h3>
          <p className="text-gray-500 mb-4">
            When you save a post, it will appear here.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Browse Posts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onLike={handleLike}
              onComment={handleComment}
              onRepost={handleRepost}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;