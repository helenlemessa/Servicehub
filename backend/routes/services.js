const express = require('express');
const router = express.Router();
const { protect, sellerOnly } = require('../middleware/auth');
const Service = require('../models/Service');
const User = require('../models/User');
const { uploadImages } = require('../middleware/upload');
const jwt = require('jsonwebtoken');
// ===== SPECIFIC ROUTES FIRST (must come before /:id) =====
 
// Get my services (seller's own services)
router.get('/my-services', protect, sellerOnly, async (req, res) => {
  try {
    const services = await Service.find({ seller: req.user._id })
      .sort('-createdAt');
    
    res.json(services);
  } catch (error) {
    console.error('Fetch my services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller's services by seller ID
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const services = await Service.find({ 
      seller: req.params.sellerId,
      status: 'active' 
    })
      .populate('seller', 'name profilePicture rating headline')
      .populate('comments.user', 'name profilePicture')
      .sort('-createdAt');

    const formattedServices = services.map(service => ({
      ...service.toObject(),
      likes: service.likes || [],
      comments: service.comments || [],
      reposts: service.reposts || [],
    }));

    res.json(formattedServices);
  } catch (error) {
    console.error('Fetch seller services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/saved', protect, async (req, res) => {
  try {
    console.log('Fetching saved posts for user:', req.user._id);
    
    const savedPosts = await Service.find({
      savedBy: { $in: [req.user._id] },
      status: 'active'
    })
      .populate('seller', 'name profilePicture rating headline')
      .populate('comments.user', 'name profilePicture')
      .sort('-createdAt');
    
    
    console.log(`Found ${savedPosts.length} saved posts`);
    
    const formattedPosts = savedPosts.map(post => ({
      ...post.toObject(),
      likes: post.likes || [],
      comments: post.comments || [],
      reposts: post.reposts || [],
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      repostCount: post.repostCount || 0,
    }));
    
    res.json(formattedPosts);
  } catch (error) {
    console.error('Fetch saved posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get trending posts
router.get('/trending/posts', async (req, res) => {
  try {
    const { limit = 20, timeframe = 'week' } = req.query;
    
    let startDate = new Date();
    if (timeframe === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }
    
    const trendingPosts = await Service.find({
      createdAt: { $gte: startDate },
      status: 'active'
    })
      .populate('seller', 'name profilePicture rating location headline')
      .populate('comments.user', 'name profilePicture')
      .sort('-createdAt');
    
    const postsWithScore = trendingPosts.map(post => {
      const engagementScore = 
        (post.likes?.length || 0) + 
        (post.comments?.length || 0) * 2 +
        (post.reposts?.length || 0) * 1.5 +
        (post.views || 0) / 10;
      
      return {
        ...post.toObject(),
        engagementScore,
        trending: engagementScore > 50 ? '🔥 Hot' : engagementScore > 20 ? '📈 Rising' : '👍 Popular'
      };
    });
    
    postsWithScore.sort((a, b) => b.engagementScore - a.engagementScore);
    const limitedPosts = postsWithScore.slice(0, parseInt(limit));
    
    res.json(limitedPosts);
  } catch (error) {
    console.error('Fetch trending posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get trending topics
router.get('/trending/topics', async (req, res) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;
    
    let startDate = new Date();
    if (timeframe === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }
    
    const trendingTopics = await Service.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'active'
        }
      },
      {
        $project: {
          category: 1,
          engagementScore: {
            $add: [
              { $size: { $ifNull: ['$likes', []] } },
              { $size: { $ifNull: ['$comments', []] } },
              { $size: { $ifNull: ['$reposts', []] } },
              { $divide: ['$views', 10] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$category',
          totalEngagement: { $sum: '$engagementScore' },
          postCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalEngagement: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    const categoryNames = {
      design: 'Design',
      development: 'Development',
      tutoring: 'Tutoring',
      photography: 'Photography',
      writing: 'Writing',
      marketing: 'Marketing',
      other: 'Other'
    };
    
    const formattedTopics = trendingTopics.map((topic, index) => ({
      id: topic._id,
      name: categoryNames[topic._id] || topic._id,
      category: topic._id,
      postCount: topic.postCount,
      engagement: topic.totalEngagement,
      trend: index === 0 ? '🔥 Hot' : index < 3 ? '📈 Rising' : '👍 Popular'
    }));
    
    res.json(formattedTopics);
  } catch (error) {
    console.error('Fetch trending topics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get posts from users you follow
// Get posts from users you follow (including reposts)
// Get posts from users you follow - ONLY show posts from followed users
router.get('/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('following');
    const followingIds = user.following || [];
    
    // Convert to strings for comparison
    const followingIdStrings = followingIds.map(id => id.toString());
    
    console.log('Following IDs:', followingIdStrings);
    
    // ONLY get posts where the seller is in the following list
    // Do NOT include reposts from followed users - that's for All Posts feed
    const services = await Service.find({ 
      seller: { $in: followingIds },
      status: 'active' 
    })
      .populate('seller', 'name profilePicture rating location headline')
      .populate('comments.user', 'name profilePicture')
      .populate('reposts.user', 'name profilePicture')
      .sort('-createdAt')
      .limit(50);
    
    console.log(`Found ${services.length} posts from followed users`);
    
    // For the Following feed, we also want to show if a followed user reposted their OWN post
    // But we don't want to show reposts from people you don't follow
    const enhancedPosts = services.map(service => {
      const serviceObj = service.toObject();
      
      // Check if this post was reposted by someone the user follows (including self)
      let repostedByInfo = null;
      let repostCommentInfo = null;
      
      if (serviceObj.reposts && serviceObj.reposts.length > 0) {
        // Find a repost from someone the user follows
        const repostFromFollowed = serviceObj.reposts.find(r => {
          if (!r.user || !r.user._id) return false;
          const reposterId = r.user._id.toString();
          return followingIdStrings.includes(reposterId);
        });
        
        if (repostFromFollowed) {
          repostedByInfo = repostFromFollowed.user;
          repostCommentInfo = repostFromFollowed.withComment || '';
        }
      }
      
      return {
        ...serviceObj,
        likes: service.likes || [],
        comments: service.comments || [],
        reposts: service.reposts || [],
        likeCount: service.likeCount || 0,
        commentCount: service.commentCount || 0,
        repostCount: service.repostCount || 0,
        repostedBy: repostedByInfo,
        repostComment: repostCommentInfo,
        type: 'post'
      };
    });
    
    res.json(enhancedPosts);
  } catch (error) {
    console.error('Fetch following feed error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get all services with filters - WITH AUTHENTICATION
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    const filter = { status: 'active' };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const services = await Service.find(filter)
      .populate('seller', 'name profilePicture rating location headline')
      .populate('comments.user', 'name profilePicture')
      .populate('reposts.user', 'name profilePicture')
      .sort('-createdAt')
      .limit(20);

    // Get user ID from the request header token
    let userId = null;
    let userFollowingIds = [];
    
    // Check for token in Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        
        if (userId) {
          const currentUser = await User.findById(userId).select('following');
          userFollowingIds = currentUser.following || [];
          userFollowingIds = userFollowingIds.map(id => id.toString());
          console.log('User authenticated from token, following:', userFollowingIds);
        }
      } catch (err) {
        console.log('Invalid token or no token provided');
      }
    }

    const formattedServices = services.map(service => {
      const serviceObj = service.toObject();
      
      let repostedByInfo = null;
      let repostCommentInfo = null;
      
      if (serviceObj.reposts && serviceObj.reposts.length > 0 && userFollowingIds.length > 0) {
        // Find a repost from someone the user follows
        const repostFromFollowed = serviceObj.reposts.find(r => {
          if (!r.user || !r.user._id) return false;
          const reposterId = r.user._id.toString();
          const isFollowed = userFollowingIds.includes(reposterId);
          const isNotOriginalAuthor = reposterId !== serviceObj.seller._id.toString();
          return isFollowed;
        });
        
        if (repostFromFollowed) {
          repostedByInfo = repostFromFollowed.user;
          repostCommentInfo = repostFromFollowed.withComment || '';
        }
      }
      
      return {
        ...serviceObj,
        likes: service.likes || [],
        comments: service.comments || [],
        reposts: service.reposts || [],
        likeCount: service.likeCount || 0,
        commentCount: service.commentCount || 0,
        repostCount: service.repostCount || 0,
        repostedBy: repostedByInfo,
        repostComment: repostCommentInfo,
      };
    });

    res.json(formattedServices);
  } catch (error) {
    console.error('Fetch services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get single service (must be after specific routes)
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('seller', 'name profilePicture rating bio location headline')
      .populate('comments.user', 'name profilePicture');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.views = (service.views || 0) + 1;
    await service.save();

    const formattedService = {
      ...service.toObject(),
      likes: service.likes || [],
      comments: service.comments || [],
      reposts: service.reposts || [],
    };

    res.json(formattedService);
  } catch (error) {
    console.error('Fetch service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create service
// Create service
router.post('/', protect, sellerOnly, uploadImages.array('images', 5), async (req, res) => {
  try {
    console.log('=== CREATE SERVICE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Files received:', req.files ? req.files.length : 0);
    
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, i) => {
        console.log(`File ${i}:`, {
          path: file.path,
          filename: file.filename,
          size: file.size
        });
      });
    }
    
    const { title, description, price, category, deliveryTime } = req.body;

    // Validate required fields
    if (!title || !description || !price) {
      return res.status(400).json({ message: 'Title, description, and price are required' });
    }

    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const service = await Service.create({
      title,
      description,
      price: parseFloat(price) || 0,
      category: category || 'other',
      images: imageUrls,
      seller: req.user._id,
      deliveryTime: deliveryTime || 3,
      likes: [],
      comments: [],
      reposts: [],
    });

    console.log('Service created successfully:', service._id);
    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/Unlike a service
router.post('/:id/like', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('seller', 'name');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (!service.likes) service.likes = [];

    const likeIndex = service.likes.indexOf(req.user._id);
    let liked;
    
    if (likeIndex === -1) {
      service.likes.push(req.user._id);
      liked = true;
      
      // Create notification for post owner (if not self-like)
      if (service.seller._id.toString() !== req.user._id.toString()) {
        const Notification = require('../models/Notification');
        const notification = await Notification.create({
          recipient: service.seller._id,
          sender: req.user._id,
          type: 'like',
          content: `${req.user.name} liked your post: "${service.title.substring(0, 50)}${service.title.length > 50 ? '...' : ''}"`,
          targetId: service._id,
          targetModel: 'Service',
          targetUrl: `/services/${service._id}`
        });
        
        const io = req.app.get('io');
        if (io) {
          const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'name profilePicture');
          io.to(`user_${service.seller._id}`).emit('new_notification', populatedNotification);
        }
      }
    } else {
      service.likes.splice(likeIndex, 1);
      liked = false;
    }
    
    await service.save();
    
    res.json({ 
      liked: liked, 
      likeCount: service.likes.length 
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    if (!service.comments) service.comments = [];
    
    const comment = {
      user: req.user._id,
      text,
      likes: [],
      createdAt: new Date(),
    };
    
    service.comments.push(comment);
    await service.save();
    
    const populatedService = await Service.findById(req.params.id)
      .populate('comments.user', 'name profilePicture');
    
    const newComment = populatedService.comments[populatedService.comments.length - 1];
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

 

// Delete comment
router.delete('/:serviceId/comment/:commentId', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const comment = service.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    comment.deleteOne();
    await service.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
 
// Like/Unlike comment
router.post('/:serviceId/comment/:commentId/like', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const comment = service.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (!comment.likes) comment.likes = [];
    
    const likeIndex = comment.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      comment.likes.push(req.user._id);
    } else {
      comment.likes.splice(likeIndex, 1);
    }
    
    await service.save();
    
    res.json({ 
      liked: likeIndex === -1, 
      likeCount: comment.likes.length 
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add reply to comment
router.post('/:serviceId/comment/:commentId/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const service = await Service.findById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const comment = service.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (!comment.replies) comment.replies = [];
    
    const reply = {
      user: req.user._id,
      text,
      likes: [],
      createdAt: new Date(),
    };
    
    comment.replies.push(reply);
    await service.save();
    
    const populatedService = await Service.findById(req.params.serviceId)
      .populate('comments.user', 'name profilePicture')
      .populate('comments.replies.user', 'name profilePicture');
    
    const updatedComment = populatedService.comments.id(req.params.commentId);
    const newReply = updatedComment.replies[updatedComment.replies.length - 1];
    
    res.status(201).json(newReply);
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete reply
router.delete('/:serviceId/comment/:commentId/reply/:replyId', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const comment = service.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }
    
    reply.deleteOne();
    await service.save();
    
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/Unlike reply
router.post('/:serviceId/comment/:commentId/reply/:replyId/like', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const comment = service.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    if (!reply.likes) reply.likes = [];
    
    const likeIndex = reply.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      reply.likes.push(req.user._id);
    } else {
      reply.likes.splice(likeIndex, 1);
    }
    
    await service.save();
    
    res.json({ 
      liked: likeIndex === -1, 
      likeCount: reply.likes.length 
    });
  } catch (error) {
    console.error('Like reply error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update service
router.put('/:id', protect, sellerOnly, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedService);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete service
// Delete service - ADD MORE LOGGING
router.delete('/:id', protect, sellerOnly, async (req, res) => {
  try {
    console.log('=== DELETE REQUEST ===');
    console.log('Post ID from params:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      console.log('Service not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Service not found' });
    }
    
    console.log('Found service:', service._id);
    console.log('Service seller:', service.seller.toString());
    console.log('Current user:', req.user._id.toString());
    
    if (service.seller.toString() !== req.user._id.toString()) {
      console.log('Authorization failed - not the owner');
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    await service.deleteOne();
    console.log('Post deleted successfully:', req.params.id);
    
    res.json({ message: 'Service deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Repost with or without comment - KEEP THIS ONE, DELETE THE OTHER
// Repost with or without comment - CORRECTED VERSION (NO TOGGLE)
router.post('/:id/repost', protect, async (req, res) => {
  try {
    const { comment } = req.body;
    const originalService = await Service.findById(req.params.id)
      .populate('seller', 'name profilePicture');
    
    if (!originalService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Initialize reposts array if it doesn't exist
    if (!originalService.reposts) originalService.reposts = [];
    
    // Check if already reposted - THIS IS THE ISSUE
    const existingRepost = originalService.reposts.find(
      r => r.user && r.user.toString() === req.user._id.toString()
    );
    
    // If already reposted, DO NOT REMOVE - just return error or ignore
    // For now, let's just return that it's already reposted
    if (existingRepost) {
      return res.status(400).json({ 
        message: 'You have already reposted this post',
        reposted: true,
        repostCount: originalService.reposts.length 
      });
    }
    
    // Add repost
    originalService.reposts.push({
      user: req.user._id,
      originalPost: originalService._id,
      withComment: comment || '',
      createdAt: new Date(),
    });
    await originalService.save();
    
    // Create notification for original poster
    if (originalService.seller._id.toString() !== req.user._id.toString()) {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: originalService.seller._id,
        sender: req.user._id,
        type: 'repost',
        content: comment 
          ? `${req.user.name} reposted your post: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`
          : `${req.user.name} reposted your post`,
        targetId: originalService._id,
        targetModel: 'Service',
        targetUrl: `/services/${originalService._id}`
      });
    }
    
    // Return the updated post with repost info
    const updatedService = await Service.findById(originalService._id)
      .populate('seller', 'name profilePicture')
      .populate('reposts.user', 'name profilePicture');
    
    const repostEntry = updatedService.reposts.find(r => r.user._id.toString() === req.user._id.toString());
    
    res.json({ 
      reposted: true, 
      repostCount: updatedService.reposts.length,
      repost: repostEntry,
      message: 'Repost added successfully'
    });
  } catch (error) {
    console.error('Repost error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// NEW ROUTE: Remove repost (separate endpoint)
router.delete('/:id/repost', protect, async (req, res) => {
  try {
    const originalService = await Service.findById(req.params.id);
    
    if (!originalService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Find and remove the repost
    const repostIndex = originalService.reposts.findIndex(
      r => r.user && r.user.toString() === req.user._id.toString()
    );
    
    if (repostIndex === -1) {
      return res.status(400).json({ message: 'You have not reposted this post' });
    }
    
    originalService.reposts.splice(repostIndex, 1);
    await originalService.save();
    
    res.json({ 
      reposted: false, 
      repostCount: originalService.reposts.length,
      message: 'Repost removed successfully'
    });
  } catch (error) {
    console.error('Remove repost error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get reposts from followed users
router.get('/feed/reposts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('following');
    const followingIds = user.following || [];
    
    const reposts = await Service.find({
      'reposts.user': { $in: followingIds },
      status: 'active'
    })
      .populate('seller', 'name profilePicture')
      .populate('reposts.user', 'name profilePicture')
      .sort('-createdAt')
      .limit(30);
    
    res.json(reposts);
  } catch (error) {
    console.error('Fetch reposts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
 
// Save/Unsave post
// Save/Unsave post
router.post('/:id/save', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Initialize savedBy array if it doesn't exist
    if (!service.savedBy) {
      service.savedBy = [];
    }
    
    const savedIndex = service.savedBy.indexOf(req.user._id);
    let saved;
    
    if (savedIndex === -1) {
      service.savedBy.push(req.user._id);
      saved = true;
    } else {
      service.savedBy.splice(savedIndex, 1);
      saved = false;
    }
    
    await service.save();
    
    console.log(`Post ${saved ? 'saved' : 'unsaved'} by user ${req.user._id}`);
    
    res.json({ 
      saved: saved,
      savedCount: service.savedBy.length 
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Report post
router.post('/:id/report', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    if (!service.reportedBy) service.reportedBy = [];
    
    // Check if already reported
    const alreadyReported = service.reportedBy.some(
      report => report.user.toString() === req.user._id.toString()
    );
    
    if (alreadyReported) {
      return res.status(400).json({ message: 'Already reported this post' });
    }
    
    service.reportedBy.push({
      user: req.user._id,
      reason: reason || 'No reason provided',
      reportedAt: new Date(),
    });
    
    await service.save();
    
    // If reported 5 times, mark as inactive
    if (service.reportedBy.length >= 5) {
      service.status = 'suspended';
      await service.save();
    }
    
    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// ===== SEARCH ROUTES =====

// Search services and users
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const searchRegex = new RegExp(q, 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Search Services
    const serviceFilter = { status: 'active' };
    serviceFilter.$or = [
      { title: searchRegex },
      { description: searchRegex },
    ];
    if (category && category !== 'all') serviceFilter.category = category;
    if (minPrice || maxPrice) {
      serviceFilter.price = {};
      if (minPrice) serviceFilter.price.$gte = Number(minPrice);
      if (maxPrice) serviceFilter.price.$lte = Number(maxPrice);
    }
    
    let serviceQuery = Service.find(serviceFilter)
      .populate('seller', 'name profilePicture rating location headline');
    
    // Apply sorting
    if (sortBy === 'price_asc') serviceQuery = serviceQuery.sort('price');
    else if (sortBy === 'price_desc') serviceQuery = serviceQuery.sort('-price');
    else if (sortBy === 'newest') serviceQuery = serviceQuery.sort('-createdAt');
    else serviceQuery = serviceQuery.sort('-createdAt'); // relevance by newest
    
    const services = await serviceQuery.skip(skip).limit(parseInt(limit));
    
    // Search Users
    const userFilter = {
      $or: [
        { name: searchRegex },
        { headline: searchRegex },
        { bio: searchRegex },
        { skills: { $in: [searchRegex] } }
      ]
    };
    
    const users = await User.find(userFilter)
      .select('name profilePicture headline rating totalReviews location skills bio')
      .limit(parseInt(limit));
    
    res.json({
      services,
      users,
      totalServices: await Service.countDocuments(serviceFilter),
      totalUsers: await User.countDocuments(userFilter),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search suggestions (for autocomplete)
router.get('/search/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ services: [], users: [] });
    }
    
    const searchRegex = new RegExp(q, 'i');
    
    const [services, users] = await Promise.all([
      Service.find({ title: searchRegex, status: 'active' })
        .populate('seller', 'name')
        .limit(5)
        .select('title seller'),
      User.find({ name: searchRegex })
        .select('name profilePicture headline')
        .limit(5)
    ]);
    
    res.json({ services, users });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get saved posts
// Get saved posts
 
module.exports = router;

