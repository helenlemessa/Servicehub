import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { FaFire, FaArrowTrendUp, FaChartLine, FaClock } from 'react-icons/fa6';

const Trending = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const { user } = useAuth();

  useEffect(() => {
    fetchTrendingPosts();
  }, [timeframe]);

  const fetchTrendingPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/services/trending/posts?limit=20&timeframe=${timeframe}`);
      setPosts(data);
    } catch (error) {
      console.error('Fetch trending posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    // ... your like logic
  };

  const handleComment = async (postId, text) => {
    // ... your comment logic
  };

  const handleRepost = async (postId) => {
    // ... your repost logic
  };

  const handleShare = async (postId) => {
    const url = `${window.location.origin}/services/${postId}`;
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FaFire className="text-red-500" /> Trending Now
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Most popular posts based on engagement
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeframe('day')}
              className={`px-3 py-1 rounded-full text-sm transition ${
                timeframe === 'day' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FaClock className="inline mr-1" size={12} />
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 rounded-full text-sm transition ${
                timeframe === 'week' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 rounded-full text-sm transition ${
                timeframe === 'month' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {loading ? (
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
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No trending posts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post._id} className="relative">
              {index < 3 && (
                <div className="absolute -left-4 top-4 z-10">
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-red-500 text-white' :
                    index === 1 ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    #{index + 1} Trending
                  </div>
                </div>
              )}
              <PostCard
                post={post}
                currentUser={user}
                onLike={handleLike}
                onComment={handleComment}
                onRepost={handleRepost}
                onShare={handleShare}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;