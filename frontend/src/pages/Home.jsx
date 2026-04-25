// frontend/src/pages/Home.jsx - COMPLETELY FIXED
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import RepostCard from '../components/RepostCard';
import CreatePost from '../components/CreatePost';
import TrendingTopics from '../components/TrendingTopics';
import Suggestions from '../components/Suggestions';
import { FaTimes } from 'react-icons/fa';

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  useEffect(() => {
    const category = searchParams.get('category');
    setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    fetchServices();
  }, [filter, selectedCategory, user]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Current filter:', filter);
      if (filter === 'trending') {
        const { data } = await axios.get('/services/trending/posts');
        setServices(data.map(post => ({ ...post, type: 'post', uniqueId: post._id })));
      } else if (filter === 'following' && user) {
        const { data } = await axios.get('/services/following');
        setServices(data.map(item => ({ 
          ...item, 
          type: item.type || 'post',
          uniqueId: `${item._id}_${item.type || 'post'}_${item.repostedBy?._id || 'original'}`
        })));
      } else {
        // For ALL POSTS feed - also fetch reposts from followed users
        let url = '/services';
        const params = new URLSearchParams();
        
        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const { data } = await axios.get(url);
        
        // If user is logged in, also fetch reposts from followed users to show in All Posts
        let allItems = data.map(post => ({ ...post, type: 'post', uniqueId: post._id }));
        
        if (user && filter === 'all') {
          try {
            const repostsData = await axios.get('/services/following');
            // Filter reposts to only show posts that were reposted by followed users
            const repostItems = repostsData.data
              .filter(item => item.type === 'repost' && item.repostedBy)
              .map(item => ({
                ...item,
                uniqueId: `${item._id}_repost_${item.repostedBy?._id}`,
                type: 'repost'
              }));
            
            // Combine and remove duplicates based on post ID
            const existingPostIds = new Set(allItems.map(p => p._id));
            const newRepostItems = repostItems.filter(item => !existingPostIds.has(item._id));
            
            allItems = [...allItems, ...newRepostItems];
            allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } catch (error) {
            console.error('Fetch reposts for All Posts error:', error);
          }
        }
        
        setServices(allItems);
      }
    } catch (error) {
      console.error('Fetch services error:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Handle repost updates
  const handleRepostUpdate = useCallback((postId, repostData) => {
    console.log('Repost update received:', { postId, repostData, currentFilter: filter });
    
    setServices(prevServices => {
      return prevServices.map(service => {
        if (service._id === postId) {
          const updatedPost = {
            ...service,
            repostCount: repostData.repostCount,
            reposts: repostData.reposted 
              ? [...(service.reposts || []), { user: user?._id, withComment: repostData.comment || '' }]
              : (service.reposts || []).filter(r => {
                  const userId = r.user?._id || r.user;
                  return userId !== user?._id;
                })
          };
          return updatedPost;
        }
        return service;
      });
    });
  }, [filter, user]);

  const handleEditPost = async (postId, newData) => {
    try {
      await axios.put(`/services/${postId}`, newData);
      toast.success('Post updated!');
      fetchServices();
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Failed to update post');
    }
  };
const handleDeletePost = async (postId) => {
  console.log('Deleting post from Home with ID:', postId);
  
  // Immediately remove from local state
  setServices(prev => prev.filter(item => item._id !== postId));
  
  try {
    await axios.delete(`/services/${postId}`);
    // Success - already removed from UI
  } catch (error) {
    // If error is 404, the post is already gone, so ignore
    if (error.response?.status !== 404) {
      console.error('Delete error in Home:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to delete post');
      // Refresh to restore correct state
      fetchServices();
    } else {
      // 404 means post already deleted, so just log it
      console.log('Post already deleted (404 response)');
    }
  }
};
  const handleLike = async (postId) => {
    try {
      const { data } = await axios.post(`/services/${postId}/like`);
      setServices(prev => prev.map(item => {
        if (item._id === postId) {
          return {
            ...item,
            likes: data.liked ? [...(item.likes || []), user._id] : (item.likes || []).filter(id => id !== user._id),
            likeCount: data.likeCount
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      const { data } = await axios.post(`/services/${postId}/comment`, { text });
      setServices(prev => prev.map(item => {
        if (item._id === postId) {
          return {
            ...item,
            comments: [...(item.comments || []), data],
            commentCount: (item.comments?.length || 0) + 1
          };
        }
        return item;
      }));
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
      setServices(prev => prev.map(item => {
        if (item._id === postId) {
          return {
            ...item,
            comments: (item.comments || []).filter(c => c._id !== commentId),
            commentCount: (item.commentCount || 0) - 1
          };
        }
        return item;
      }));
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
          ? { ...comment, likes: data.liked ? [...(comment.likes || []), user._id] : (comment.likes || []).filter(id => id !== user._id) }
          : comment
      );
      setServices(prev => prev.map(item => {
        if (item._id === postId) {
          return {
            ...item,
            comments: updateComments(item.comments || [])
          };
        }
        return item;
      }));
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
      setServices(prev => prev.map(item => {
        if (item._id === postId) {
          return {
            ...item,
            comments: updateReplies(item.comments || [])
          };
        }
        return item;
      }));
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
      setServices(prev => prev.map(item => {
        if (item._id === postId) {
          return {
            ...item,
            comments: updateReplies(item.comments || [])
          };
        }
        return item;
      }));
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
                  ? { ...reply, likes: data.liked ? [...(reply.likes || []), user._id] : (reply.likes || []).filter(id => id !== user._id) }
                  : reply
              )
            }
          : comment
      );
      setServices(prev => prev.map(item => {
        if (item._id === postId) {
          return {
            ...item,
            comments: updateReplies(item.comments || [])
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Like reply error:', error);
    }
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
    setSearchParams({});
    setFilter('all');
  };

  const getCategoryDisplayName = (category) => {
    const names = {
      design: 'Design',
      development: 'Development',
      tutoring: 'Tutoring',
      photography: 'Photography',
      writing: 'Writing',
      marketing: 'Marketing',
      other: 'Other'
    };
    return names[category] || category;
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (selectedCategory) clearCategoryFilter();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block w-64 space-y-4">
          {user && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-center">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-20 h-20 rounded-full mx-auto object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold mx-auto">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="font-semibold mt-2">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.role === 'seller' ? 'Service Provider' : 'Client'}</p>
                <Link to="/profile" className="block mt-3 text-sm text-blue-600 hover:text-blue-800">View Profile</Link>
              </div>
            </div>
          )}
          <TrendingTopics />
        </div>

        <div className="flex-1 max-w-2xl mx-auto w-full">
          {user && <CreatePost onPostCreated={fetchServices} />}
          
          {selectedCategory && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">Showing:</span>
                <span className="font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded-md text-sm">
                  {getCategoryDisplayName(selectedCategory)}
                </span>
              </div>
              <button onClick={clearCategoryFilter} className="text-sm text-blue-600 hover:text-blue-800">
                <FaTimes /> Clear
              </button>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow mb-4 p-2 flex gap-2 overflow-x-auto">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === 'all' && !selectedCategory ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Posts
            </button>
            {user && (
              <button
                onClick={() => handleFilterChange('following')}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  filter === 'following' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Following
              </button>
            )}
            <button
              onClick={() => handleFilterChange('trending')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === 'trending' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Trending
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full"></div>
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
          ) : services.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">
                {selectedCategory ? `No posts found in ${getCategoryDisplayName(selectedCategory)}` : 'No posts yet'}
              </p>
              {user && !selectedCategory && (
                <p className="text-sm text-gray-400 mt-2">Create your first post to share your services</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((item) => {
                const key = item.uniqueId || item._id;
                
                // Use RepostCard for repost items, PostCard for regular posts
                if (item.type === 'repost' && item.repostedBy) {
                  return (
                    <RepostCard
                      key={key}
                      repost={{ user: item.repostedBy, withComment: item.repostComment }}
                      originalPost={item}
                      currentUser={user}
                      onLike={handleLike}
                      onComment={handleComment}
                      onShare={handleShare}
                      onDeleteComment={handleDeleteComment}
                      onLikeComment={handleLikeComment}
                      onAddReply={handleAddReply}
                      onDeleteReply={handleDeleteReply}
                      onLikeReply={handleLikeReply}
                    />
                  );
                }
                
                return (
                  <PostCard
                    key={key}
                    post={item}
                    currentUser={user}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onRepostUpdate={handleRepostUpdate}
                    onDeleteComment={handleDeleteComment}
                    onLikeComment={handleLikeComment}
                    onAddReply={handleAddReply}
                    onDeleteReply={handleDeleteReply}
                    onLikeReply={handleLikeReply}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block w-80 space-y-4">
          <Suggestions />
        </div>
      </div>
    </div>
  );
};

export default Home;