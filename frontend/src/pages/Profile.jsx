import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaGlobe, 
  FaLinkedin, FaTwitter, FaGithub, FaEdit, FaCamera, 
  FaUsers, FaUserPlus, FaUserCheck, FaEnvelope, FaPlus, FaTrash 
} from 'react-icons/fa';
import FollowersModal from '../components/FollowersModal';
import FollowingModal from '../components/FollowingModal';
import PostCard from '../components/PostCard';
import { useTheme } from '../context/ThemeContext';

const Profile = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const nameFromUrl = searchParams.get('name');
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const hasTrackedView = useRef(false);
  const isOwnProfile = !userId && !nameFromUrl ? true : (userId === currentUser?._id);
  const profileId = isOwnProfile ? currentUser?._id : userId;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Skill input modal states - MOVED INSIDE the component
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Theme-based classes
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-700';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const labelColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const iconColor = isDark ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => {
    if (nameFromUrl) {
      fetchUserByName();
    } else if (profileId) {
      fetchProfile();
      fetchUserPosts();
      fetchUserReposts();
    } else if (currentUser) {
      fetchProfile();
      fetchUserPosts();
      fetchUserReposts();
    }
  }, [profileId, nameFromUrl, currentUser]);

  const openFollowersModal = () => setShowFollowersModal(true);
  const openFollowingModal = () => setShowFollowingModal(true);
  const closeModals = () => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
  };

  const fetchUserByName = async () => {
    try {
      const { data } = await axios.get(`/users/search?name=${encodeURIComponent(nameFromUrl)}`);
      setProfileUser(data);
      setFollowerCount(data.followers?.length || 0);
      setIsFollowing(data.followers?.some(f => f._id === currentUser?._id));
      setEditForm({
        name: data.name || '',
        headline: data.headline || '',
        bio: data.bio || '',
        phone: data.phone || '',
        website: data.website || '',
        location: data.location || { city: '', subCity: '', country: 'Ethiopia' },
        skills: data.skills || [],
        socialLinks: data.socialLinks || { linkedin: '', twitter: '', github: '', portfolio: '' },
        experience: data.experience || [],
        education: data.education || [],
      });
      setLoading(false);
    } catch (error) {
      console.error('Fetch user by name error:', error);
      toast.error('User not found');
      navigate('/');
    }
  };

  const fetchProfile = async () => {
    if (!profileId) return;
  
    try {
      const { data } = await axios.get(`/users/${profileId}`);
      setProfileUser(data);
      setFollowerCount(data.followers?.length || 0);
      
      const isUserFollowing = data.followers?.some(
        follower => follower._id === currentUser?._id
      );
      
      setIsFollowing(isUserFollowing);
      setEditForm({
        name: data.name || '',
        headline: data.headline || '',
        bio: data.bio || '',
        phone: data.phone || '',
        website: data.website || '',
        location: data.location || { city: '', subCity: '', country: 'Ethiopia' },
        skills: data.skills || [],
        socialLinks: data.socialLinks || { linkedin: '', twitter: '', github: '', portfolio: '' },
        experience: data.experience || [],
        education: data.education || [],
      });
      
      if (!isOwnProfile && currentUser && !hasTrackedView.current) {
        hasTrackedView.current = true;
        try {
          await axios.post(`/users/${profileId}/view`);
        } catch (viewError) {
          console.error('View tracking error:', viewError);
        }
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!profileId) return;
    
    try {
      const { data } = await axios.get(`/services/seller/${profileId}`);
      setPosts(data);
    } catch (error) {
      console.error('Fetch posts error:', error);
    }
  };

  const fetchUserReposts = async () => {
    if (!profileId) return;
    
    try {
      const { data } = await axios.get(`/users/${profileId}/reposts`);
      setReposts(data);
    } catch (error) {
      console.error('Fetch reposts error:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const { data } = await axios.post(`/users/${profileId}/follow`);
      setIsFollowing(data.following);
      setFollowerCount(data.followerCount);
      toast.success(data.following ? 'Following!' : 'Unfollowed');
      
      if (currentUser) {
        const updatedUser = { ...currentUser };
        if (data.following) {
          updatedUser.following = [...(currentUser.following || []), profileId];
        } else {
          updatedUser.following = (currentUser.following || []).filter(id => id !== profileId);
        }
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const { data } = await axios.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileUser(data);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error('Failed to update profile picture');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('coverPhoto', file);
    
    try {
      const { data } = await axios.post('/users/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileUser({ ...profileUser, coverPhoto: data.coverPhoto });
      toast.success('Cover photo updated!');
    } catch (error) {
      console.error('Cover upload error:', error);
      toast.error('Failed to update cover photo');
    }
  };

const handleUpdateProfile = async () => {
  console.log('=== SENDING UPDATE ===');
  console.log('Skills being sent:', editForm.skills);
  console.log('Experience being sent:', editForm.experience);
  console.log('Education being sent:', editForm.education);
  
  const formData = new FormData();
  
  if (editForm.name) formData.append('name', editForm.name);
  if (editForm.headline) formData.append('headline', editForm.headline);
  if (editForm.bio) formData.append('bio', editForm.bio);
  if (editForm.phone) formData.append('phone', editForm.phone);
  if (editForm.website) formData.append('website', editForm.website);
  
  if (editForm.location) {
    formData.append('location', JSON.stringify(editForm.location));
  }
  
  if (editForm.skills && editForm.skills.length) {
    formData.append('skills', JSON.stringify(editForm.skills));
  } else {
    formData.append('skills', JSON.stringify([]));
  }
  
  if (editForm.socialLinks) {
    formData.append('socialLinks', JSON.stringify(editForm.socialLinks));
  }
  
  if (editForm.experience && editForm.experience.length) {
    // Clean up experience data before sending
    const cleanExperience = editForm.experience.map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || null,
      endDate: exp.current ? null : (exp.endDate || null),
      current: exp.current || false,
      description: exp.description || ''
    }));
    formData.append('experience', JSON.stringify(cleanExperience));
  } else {
    formData.append('experience', JSON.stringify([]));
  }
  
  if (editForm.education && editForm.education.length) {
    // Clean up education data before sending
    const cleanEducation = editForm.education.map(edu => ({
      school: edu.school || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: edu.startDate || null,
      endDate: edu.current ? null : (edu.endDate || null),
      current: edu.current || false
    }));
    formData.append('education', JSON.stringify(cleanEducation));
  } else {
    formData.append('education', JSON.stringify([]));
  }
  
  try {
    const { data } = await axios.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setProfileUser(data);
    setIsEditing(false);
    toast.success('Profile updated!');
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error);
    toast.error(error.response?.data?.message || 'Failed to update profile');
  }
};

  // Experience handlers
  const addExperience = () => {
    setEditForm({
      ...editForm,
      experience: [...(editForm.experience || []), {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    });
  };

  const updateExperience = (index, field, value) => {
    const updated = [...(editForm.experience || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, experience: updated });
  };

  const removeExperience = (index) => {
    const updated = [...(editForm.experience || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, experience: updated });
  };

  // Education handlers
  const addEducation = () => {
    setEditForm({
      ...editForm,
      education: [...(editForm.education || []), {
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        current: false
      }]
    });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...(editForm.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, education: updated });
  };

  const removeEducation = (index) => {
    const updated = [...(editForm.education || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, education: updated });
  };

  // Skills handlers
  const addSkill = () => {
    if (newSkill.trim()) {
      setEditForm({
        ...editForm,
        skills: [...(editForm.skills || []), newSkill.trim()]
      });
      setNewSkill('');
      setShowSkillInput(false);
    }
  };

  const removeSkill = (index) => {
    const updated = [...(editForm.skills || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, skills: updated });
  };

  const handleEditPost = async (postId, newData) => {
    try {
      await axios.put(`/services/${postId}`, newData);
      toast.success('Post updated!');
      fetchUserPosts();
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`/services/${postId}`);
      toast.success('Post deleted!');
      fetchUserPosts();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await axios.post(`/services/${postId}/like`);
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, likes: data.liked ? [...(post.likes || []), currentUser._id] : (post.likes || []).filter(id => id !== currentUser._id), likeCount: data.likeCount }
          : post
      ));
      setReposts(prev => prev.map(repost => 
        repost._id === postId 
          ? { ...repost, likes: data.liked ? [...(repost.likes || []), currentUser._id] : (repost.likes || []).filter(id => id !== currentUser._id), likeCount: data.likeCount }
          : repost
      ));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      const { data } = await axios.post(`/services/${postId}/comment`, { text });
      setPosts(prev => prev.map(post =>
        post._id === postId
          ? { ...post, comments: [...(post.comments || []), data], commentCount: (post.comments?.length || 0) + 1 }
          : post
      ));
      setReposts(prev => prev.map(repost =>
        repost._id === postId
          ? { ...repost, comments: [...(repost.comments || []), data], commentCount: (repost.comments?.length || 0) + 1 }
          : repost
      ));
      toast.success('Comment added!');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async (postId) => {
    const url = `${window.location.origin}/services/${postId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await axios.delete(`/services/${postId}/comment/${commentId}`);
      setPosts(prev => prev.map(post =>
        post._id === postId
          ? { ...post, comments: (post.comments || []).filter(c => c._id !== commentId), commentCount: (post.commentCount || 0) - 1 }
          : post
      ));
      setReposts(prev => prev.map(repost =>
        repost._id === postId
          ? { ...repost, comments: (repost.comments || []).filter(c => c._id !== commentId), commentCount: (repost.commentCount || 0) - 1 }
          : repost
      ));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLikeComment = async (postId, commentId) => {
    try {
      const { data } = await axios.post(`/services/${postId}/comment/${commentId}/like`);
      const updateComments = (comments) => comments.map(comment =>
        comment._id === commentId
          ? { ...comment, likes: data.liked ? [...(comment.likes || []), currentUser._id] : (comment.likes || []).filter(id => id !== currentUser._id) }
          : comment
      );
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, comments: updateComments(post.comments || []) } : post));
      setReposts(prev => prev.map(repost => repost._id === postId ? { ...repost, comments: updateComments(repost.comments || []) } : repost));
    } catch (error) {
      console.error('Like comment error:', error);
    }
  };

  const handleAddReply = async (postId, commentId, text) => {
    try {
      const { data } = await axios.post(`/services/${postId}/comment/${commentId}/reply`, { text });
      const updateReplies = (comments) => comments.map(comment =>
        comment._id === commentId
          ? { ...comment, replies: [...(comment.replies || []), data] }
          : comment
      );
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, comments: updateReplies(post.comments || []) } : post));
      setReposts(prev => prev.map(repost => repost._id === postId ? { ...repost, comments: updateReplies(repost.comments || []) } : repost));
      toast.success('Reply added!');
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Failed to add reply');
    }
  };

  const handleDeleteReply = async (postId, commentId, replyId) => {
    try {
      await axios.delete(`/services/${postId}/comment/${commentId}/reply/${replyId}`);
      const updateReplies = (comments) => comments.map(comment =>
        comment._id === commentId
          ? { ...comment, replies: (comment.replies || []).filter(r => r._id !== replyId) }
          : comment
      );
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, comments: updateReplies(post.comments || []) } : post));
      setReposts(prev => prev.map(repost => repost._id === postId ? { ...repost, comments: updateReplies(repost.comments || []) } : repost));
      toast.success('Reply deleted');
    } catch (error) {
      console.error('Delete reply error:', error);
      toast.error('Failed to delete reply');
    }
  };

  const handleLikeReply = async (postId, commentId, replyId) => {
    try {
      const { data } = await axios.post(`/services/${postId}/comment/${commentId}/reply/${replyId}/like`);
      const updateReplies = (comments) => comments.map(comment =>
        comment._id === commentId
          ? {
              ...comment,
              replies: (comment.replies || []).map(reply =>
                reply._id === replyId
                  ? { ...reply, likes: data.liked ? [...(reply.likes || []), currentUser._id] : (reply.likes || []).filter(id => id !== currentUser._id) }
                  : reply
              )
            }
          : comment
      );
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, comments: updateReplies(post.comments || []) } : post));
      setReposts(prev => prev.map(repost => repost._id === postId ? { ...repost, comments: updateReplies(repost.comments || []) } : repost));
    } catch (error) {
      console.error('Like reply error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-500 hover:underline"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Cover Photo */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg overflow-hidden">
        {profileUser.coverPhoto ? (
          <img
            src={profileUser.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
        )}
        
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full cursor-pointer hover:bg-opacity-75">
            <FaCamera />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </label>
        )}
      </div>
      
      {/* Profile Info */}
      <div className={`${cardBg} rounded-b-lg shadow-lg px-6 pb-6`}>
        <div className="relative -mt-20 mb-4">
          <div className="relative inline-block">
            {profileUser.profilePicture ? (
              <img
                src={profileUser.profilePicture}
                alt={profileUser.name}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div 
              className="w-32 h-32 rounded-full border-4 border-white bg-blue-500 text-white flex items-center justify-center text-4xl font-bold"
              style={{ display: profileUser.profilePicture ? 'none' : 'flex' }}
            >
              {profileUser.name?.charAt(0).toUpperCase()}
            </div>
            
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                <FaCamera size={12} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                />
              </label>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>{profileUser.name}</h1>
            <p className={textSecondary}>{profileUser.headline || 'No headline yet'}</p>
            <div className={`flex items-center gap-4 mt-2 text-sm ${textMuted} flex-wrap`}>
              {profileUser.location?.city && (
                <span className="flex items-center gap-1">
                  <FaMapMarkerAlt /> {profileUser.location.city}, {profileUser.location.country}
                </span>
              )}
              <button 
                onClick={openFollowersModal}
                className="flex items-center gap-1 hover:text-blue-600 transition"
              >
                <FaUsers /> {followerCount} followers
              </button>
              <button 
                onClick={openFollowingModal}
                className="flex items-center gap-1 hover:text-blue-600 transition"
              >
                <FaUsers /> {profileUser.following?.length || 0} following
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isOwnProfile && (
              <>
                <button
                  onClick={() => navigate(`/chat/${profileUser._id}`)}
                  className="px-6 py-2 rounded-full font-medium transition border border-blue-500 text-blue-500 hover:bg-blue-50 flex items-center gap-2"
                >
                  <FaEnvelope /> Message
                </button>
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    isFollowing
                      ? 'border border-blue-500 text-blue-500 hover:bg-blue-50'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? <FaUserCheck className="inline mr-2" /> : <FaUserPlus className="inline mr-2" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
              >
                <FaEdit className="inline mr-2" /> Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {profileUser.bio && (
          <p className={`mt-4 ${textSecondary}`}>{profileUser.bio}</p>
        )}
        
        {/* Social Links */}
        {profileUser.socialLinks && Object.values(profileUser.socialLinks).some(link => link) && (
          <div className="flex gap-3 mt-4">
            {profileUser.socialLinks.linkedin && (
              <a href={profileUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                <FaLinkedin size={20} />
              </a>
            )}
            {profileUser.socialLinks.twitter && (
              <a href={profileUser.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                <FaTwitter size={20} />
              </a>
            )}
            {profileUser.socialLinks.github && (
              <a href={profileUser.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                <FaGithub size={20} />
              </a>
            )}
            {profileUser.website && (
              <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
                <FaGlobe size={20} />
              </a>
            )}
          </div>
        )}
      </div>
      
      {/* Rest of your tabs and content... (keeping same as before up to the edit modal) */}
      
      {/* Tabs */}
      <div className={`mt-6 border-b ${borderColor}`}>
        <div className="flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-1 font-medium transition whitespace-nowrap ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('reposts')}
            className={`py-3 px-1 font-medium transition whitespace-nowrap ${
              activeTab === 'reposts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reposts ({reposts.length})
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`py-3 px-1 font-medium transition whitespace-nowrap ${
              activeTab === 'experience'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Experience
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`py-3 px-1 font-medium transition whitespace-nowrap ${
              activeTab === 'education'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Education
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-3 px-1 font-medium transition whitespace-nowrap ${
              activeTab === 'skills'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Skills
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className={`${cardBg} rounded-lg shadow p-8 text-center`}>
                <p className={textMuted}>No posts yet</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/create-service')}
                    className="mt-3 text-blue-500 hover:underline"
                  >
                    Create your first post
                  </button>
                )}
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onDeleteComment={handleDeleteComment}
                  onLikeComment={handleLikeComment}
                  onAddReply={handleAddReply}
                  onDeleteReply={handleDeleteReply}
                  onLikeReply={handleLikeReply}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                />
              ))
            )}
          </div>
        )}
        
        {activeTab === 'reposts' && (
          <div className="space-y-4">
            {reposts.length === 0 ? (
              <div className={`${cardBg} rounded-lg shadow p-8 text-center`}>
                <p className={textMuted}>No reposts yet</p>
              </div>
            ) : (
              reposts.map(repost => (
                <PostCard
                  key={repost._id}
                  post={{
                    ...repost,
                    repostedBy: repost.repostedBy,
                    repostComment: repost.repostComment
                  }}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onDeleteComment={handleDeleteComment}
                  onLikeComment={handleLikeComment}
                  onAddReply={handleAddReply}
                  onDeleteReply={handleDeleteReply}
                  onLikeReply={handleLikeReply}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                />
              ))
            )}
          </div>
        )}
        
        {activeTab === 'experience' && (
          <div className={`${cardBg} rounded-lg shadow p-6`}>
            {profileUser.experience?.length === 0 ? (
              <p className={`${textMuted} text-center`}>No experience added yet</p>
            ) : (
              profileUser.experience?.map((exp, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="flex items-start gap-3">
                    <FaBriefcase className="text-blue-500 mt-1" />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${textPrimary}`}>{exp.title}</h3>
                      <p className={textSecondary}>{exp.company}</p>
                      {exp.location && <p className={`text-sm ${textMuted}`}>{exp.location}</p>}
                      <p className={`text-sm ${textMuted}`}>
                        {exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Start'} - 
                        {exp.current ? ' Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ' End')}
                      </p>
                      {exp.description && <p className={`${textSecondary} mt-2`}>{exp.description}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'education' && (
          <div className={`${cardBg} rounded-lg shadow p-6`}>
            {profileUser.education?.length === 0 ? (
              <p className={`${textMuted} text-center`}>No education added yet</p>
            ) : (
              profileUser.education?.map((edu, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="flex items-start gap-3">
                    <FaGraduationCap className="text-blue-500 mt-1" />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${textPrimary}`}>{edu.school}</h3>
                      <p className={textSecondary}>{edu.degree} in {edu.field}</p>
                      <p className={`text-sm ${textMuted}`}>
                        {edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Start'} - 
                        {edu.current ? ' Present' : (edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ' End')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div className={`${cardBg} rounded-lg shadow p-6`}>
            {profileUser.skills?.length === 0 ? (
              <p className={`${textMuted} text-center`}>No skills added yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileUser.skills?.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`p-4 border-b ${borderColor} flex justify-between items-center sticky top-0 ${cardBg}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className={textMuted}>
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${textPrimary}`}>Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Headline</label>
                    <input
                      type="text"
                      value={editForm.headline || ''}
                      onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                      placeholder="e.g., Senior Web Developer at XYZ Company"
                      className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                    />
                  </div>
                  
                 <div>
  <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Bio</label>
  <textarea
    value={editForm.bio || ''}
    onChange={(e) => {
      const newBio = e.target.value;
      if (newBio.length <= 2000) {  // Limit to 2000 characters
        setEditForm({ ...editForm, bio: newBio });
      } else {
        toast.error('Bio cannot exceed 2000 characters');
      }
    }}
    rows="3"
    placeholder="Tell us about yourself..."
    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
  />
  <p className={`text-xs mt-1 ${textMuted}`}>
    {editForm.bio?.length || 0}/2000 characters
  </p>
</div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Website</label>
                    <input
                      type="url"
                      value={editForm.website || ''}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Location</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editForm.location?.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, city: e.target.value } })}
                        placeholder="City"
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                      <input
                        type="text"
                        value={editForm.location?.country || 'Ethiopia'}
                        onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, country: e.target.value } })}
                        placeholder="Country"
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${textPrimary}`}>Social Links</h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>LinkedIn</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.linkedin || ''}
                      onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, linkedin: e.target.value } })}
                      placeholder="https://linkedin.com/in/username"
                      className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Twitter</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.twitter || ''}
                      onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, twitter: e.target.value } })}
                      placeholder="https://twitter.com/username"
                      className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelColor}`}>GitHub</label>
                    <input
                      type="url"
                      value={editForm.socialLinks?.github || ''}
                      onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, github: e.target.value } })}
                      placeholder="https://github.com/username"
                      className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Skills</h3>
                  <button
                    type="button"
                    onClick={() => setShowSkillInput(true)}
                    className="text-blue-500 text-sm hover:text-blue-600 flex items-center gap-1"
                  >
                    <FaPlus size={12} /> Add Skill
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.skills?.map((skill, idx) => (
                    <div key={idx} className={`${inputBg} rounded-full px-3 py-1 flex items-center gap-2 border ${borderColor}`}>
                      <span className={`text-sm ${inputText}`}>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                  {(!editForm.skills || editForm.skills.length === 0) && (
                    <p className={`text-sm ${textMuted}`}>No skills added yet</p>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Experience</h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="text-blue-500 text-sm hover:text-blue-600 flex items-center gap-1"
                  >
                    <FaPlus size={12} /> Add Experience
                  </button>
                </div>
                {editForm.experience?.map((exp, idx) => (
                  <div key={idx} className={`mb-4 p-4 border ${borderColor} rounded-lg`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className={`font-medium ${textPrimary}`}>Experience #{idx + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={exp.title || ''}
                        onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company || ''}
                        onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={exp.location || ''}
                        onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                          className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                        />
                        {!exp.current && (
                          <input
                            type="date"
                            value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                            className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                          />
                        )}
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exp.current || false}
                          onChange={(e) => updateExperience(idx, 'current', e.target.checked)}
                          className="rounded"
                        />
                        <span className={`text-sm ${labelColor}`}>I currently work here</span>
                      </label>
                      <textarea
                        placeholder="Description"
                        value={exp.description || ''}
                        onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                        rows="2"
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Education</h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="text-blue-500 text-sm hover:text-blue-600 flex items-center gap-1"
                  >
                    <FaPlus size={12} /> Add Education
                  </button>
                </div>
                {editForm.education?.map((edu, idx) => (
                  <div key={idx} className={`mb-4 p-4 border ${borderColor} rounded-lg`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className={`font-medium ${textPrimary}`}>Education #{idx + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="School / University"
                        value={edu.school || ''}
                        onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                      <input
                        type="text"
                        placeholder="Degree"
                        value={edu.degree || ''}
                        onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={edu.field || ''}
                        onChange={(e) => updateEducation(idx, 'field', e.target.value)}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor}`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateEducation(idx, 'startDate', e.target.value)}
                          className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                        />
                        {!edu.current && (
                          <input
                            type="date"
                            value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateEducation(idx, 'endDate', e.target.value)}
                            className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                          />
                        )}
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={edu.current || false}
                          onChange={(e) => updateEducation(idx, 'current', e.target.checked)}
                          className="rounded"
                        />
                        <span className={`text-sm ${labelColor}`}>I currently study here</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`p-4 border-t ${borderColor} flex justify-end gap-2 sticky bottom-0 ${cardBg}`}>
              <button
                onClick={() => setIsEditing(false)}
                className={`px-4 py-2 border ${borderColor} rounded-lg ${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Skill Input Modal */}
      {showSkillInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Add New Skill</h3>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Enter skill (e.g., React, Python, UI Design)"
              className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} mb-4`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSkillInput(false);
                  setNewSkill('');
                }}
                className={`px-4 py-2 border ${borderColor} rounded-lg ${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                Cancel
              </button>
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Followers Modal */}
      <FollowersModal
        userId={profileId}
        isOpen={showFollowersModal}
        onClose={closeModals}
        currentUser={currentUser}
      />

      {/* Following Modal */}
      <FollowingModal
        userId={profileId}
        isOpen={showFollowingModal}
        onClose={closeModals}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Profile;