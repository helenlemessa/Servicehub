import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const FollowersModal = ({ userId, isOpen, onClose, currentUser }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowers();
    }
  }, [isOpen, userId]);

  const fetchFollowers = async () => {
    try {
      const { data } = await axios.get(`/users/${userId}/followers`);
      setFollowers(data);
      
      const status = {};
      data.forEach(follower => {
        status[follower._id] = currentUser?.following?.includes(follower._id);
      });
      setFollowingStatus(status);
    } catch (error) {
      console.error('Fetch followers error:', error);
      toast.error('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

// Update the handleFollow function in both modals
const handleFollow = async (followerId) => {
  try {
    const { data } = await axios.post(`/users/${followerId}/follow`);
    setFollowingStatus(prev => ({
      ...prev,
      [followerId]: data.following
    }));
    toast.success(data.following ? 'Following!' : 'Unfollowed');
    
    // Also update the current user's following list in localStorage
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
      if (data.following) {
        currentUser.following = [...(currentUser.following || []), followerId];
      } else {
        currentUser.following = (currentUser.following || []).filter(id => id !== followerId);
      }
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  } catch (error) {
    toast.error('Failed to update follow status');
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Followers</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : followers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No followers yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {followers.map((follower) => (
                <div key={follower._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <Link to={`/profile/${follower._id}`} className="flex items-center gap-3 flex-1" onClick={onClose}>
                    {follower.profilePicture ? (
                      <img
                        src={follower.profilePicture}
                        alt={follower.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        {follower.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{follower.name}</p>
                      <p className="text-sm text-gray-500">{follower.headline || 'No headline'}</p>
                    </div>
                  </Link>
                  
                  {currentUser && currentUser._id !== follower._id && (
                    <button
                      onClick={() => handleFollow(follower._id)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        followingStatus[follower._id]
                          ? 'border border-blue-500 text-blue-500 hover:bg-blue-50'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {followingStatus[follower._id] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;