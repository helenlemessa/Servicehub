import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaUsers, FaUserCheck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Helper function to get following IDs (handles both string arrays and object arrays)
  const getFollowingIds = useCallback(() => {
    if (!user || !user.following) return [];
    
    // Handle both formats:
    // 1. Array of strings: ['id1', 'id2']
    // 2. Array of objects: [{ _id: 'id1', name: 'John' }, ...]
    return user.following.map(f => {
      if (typeof f === 'string') return f;
      return f._id || f;
    }).filter(Boolean);
  }, [user]);

  const fetchSuggestions = useCallback(async () => {
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const followingIds = getFollowingIds();
      console.log('Following IDs for filtering:', followingIds);
      console.log('User.following raw:', user.following);
      
      const { data } = await axios.get('/users/suggestions/friends');
      console.log('Raw suggestions:', data.map(u => ({ name: u.name, id: u._id })));
      
      // Filter out: own account + already followed users
      const filteredSuggestions = data.filter(suggestion => {
        const isSelf = suggestion._id === user._id;
        const isFollowed = followingIds.includes(suggestion._id);
        
        if (isFollowed) {
          console.log(`❌ Removing ${suggestion.name} - already followed`);
        }
        if (isSelf) {
          console.log(`❌ Removing ${suggestion.name} - is self`);
        }
        
        return !isSelf && !isFollowed;
      });
      
      console.log(`✅ Final suggestions: ${filteredSuggestions.length} users`);
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Fetch suggestions error:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading, getFollowingIds]);

  // Fetch when auth loads or when following changes
  useEffect(() => {
    if (!authLoading && user) {
      fetchSuggestions();
    }
  }, [authLoading, user, fetchSuggestions]);

  // Also fetch when following array changes (after follow/unfollow)
  useEffect(() => {
    if (!authLoading && user && user.following) {
      fetchSuggestions();
    }
  }, [user?.following, authLoading, fetchSuggestions]);

  const handleFollow = async (userId) => {
    try {
      const { data } = await axios.post(`/users/${userId}/follow`);
      
      if (data.following) {
        toast.success('Following!');
        // Immediately remove from suggestions
        setSuggestions(prev => prev.filter(u => u._id !== userId));
      } else {
        toast.success('Unfollowed');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    }
  };

  // Show loading skeleton while auth is loading
  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">People You May Know</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">People You May Know</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">People You May Know</h3>
        <div className="text-center py-6">
          <FaUsers className="mx-auto text-3xl text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">No suggestions available</p>
          <p className="text-xs text-gray-400 mt-1">Follow more people to get suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">People You May Know</h3>
        <button
          onClick={fetchSuggestions}
          className="text-xs text-blue-500 hover:text-blue-600 transition"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-4">
        {suggestions.slice(0, 5).map((suggestedUser) => (
          <div key={suggestedUser._id} className="flex items-start gap-3">
            <Link to={`/profile/${suggestedUser._id}`} className="flex-shrink-0">
              {suggestedUser.profilePicture ? (
                <img
                  src={suggestedUser.profilePicture}
                  alt={suggestedUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  {suggestedUser.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${suggestedUser._id}`} className="hover:underline">
                <p className="font-semibold text-sm truncate">{suggestedUser.name}</p>
              </Link>
              <p className="text-xs text-gray-500 truncate">
                {suggestedUser.headline || 'No headline'}
              </p>
              
              {suggestedUser.mutualFriendsCount > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <FaUsers className="text-gray-400 text-xs" />
                  <span className="text-xs text-gray-400">
                    {suggestedUser.mutualFriendsCount} mutual {suggestedUser.mutualFriendsCount === 1 ? 'friend' : 'friends'}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleFollow(suggestedUser._id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600"
            >
              <FaUserPlus size={10} /> Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;