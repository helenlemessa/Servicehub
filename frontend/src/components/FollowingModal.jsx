import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const FollowingModal = ({ userId, isOpen, onClose, currentUser }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowing();
    }
  }, [isOpen, userId]);

  const fetchFollowing = async () => {
    try {
      const { data } = await axios.get(`/users/${userId}/following`);
      setFollowing(data);
      
      const status = {};
      data.forEach(user => {
        status[user._id] = currentUser?.following?.includes(user._id);
      });
      setFollowingStatus(status);
    } catch (error) {
      console.error('Fetch following error:', error);
      toast.error('Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userIdToFollow) => {
    try {
      const { data } = await axios.post(`/users/${userIdToFollow}/follow`);
      setFollowingStatus(prev => ({
        ...prev,
        [userIdToFollow]: data.following
      }));
      toast.success(data.following ? 'Following!' : 'Unfollowed');
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Following</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : following.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Not following anyone yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {following.map((user) => (
                <div key={user._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <Link to={`/profile/${user._id}`} className="flex items-center gap-3 flex-1" onClick={onClose}>
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.headline || 'No headline'}</p>
                    </div>
                  </Link>
                  
                  {currentUser && currentUser._id !== user._id && (
                    <button
                      onClick={() => handleFollow(user._id)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        followingStatus[user._id]
                          ? 'border border-blue-500 text-blue-500 hover:bg-blue-50'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {followingStatus[user._id] ? 'Following' : 'Follow'}
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

export default FollowingModal;