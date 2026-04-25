const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadImages } = require('../middleware/upload');

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', protect, uploadImages.single('profilePicture'), async (req, res) => {
  try {
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('File:', req.file);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update simple fields
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.headline !== undefined) user.headline = req.body.headline;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.website !== undefined) user.website = req.body.website;
    
    // Handle location
    if (req.body.location) {
      try {
        let locationData = req.body.location;
        if (typeof locationData === 'string') {
          locationData = JSON.parse(locationData);
        }
        user.location = locationData;
      } catch (e) {
        console.error('Location parse error:', e);
      }
    }
    
    // Handle skills
    if (req.body.skills) {
      try {
        let skillsData = req.body.skills;
        if (typeof skillsData === 'string') {
          skillsData = JSON.parse(skillsData);
        }
        user.skills = Array.isArray(skillsData) ? skillsData : [];
        console.log('Skills saved:', user.skills);
      } catch (e) {
        console.error('Skills parse error:', e);
        user.skills = [];
      }
    }
    
    // Handle social links
    if (req.body.socialLinks) {
      try {
        let socialLinksData = req.body.socialLinks;
        if (typeof socialLinksData === 'string') {
          socialLinksData = JSON.parse(socialLinksData);
        }
        user.socialLinks = socialLinksData;
      } catch (e) {
        console.error('Social links parse error:', e);
      }
    }
    
    // Handle experience
    if (req.body.experience) {
      try {
        let experienceData = req.body.experience;
        if (typeof experienceData === 'string') {
          experienceData = JSON.parse(experienceData);
        }
        user.experience = Array.isArray(experienceData) ? experienceData : [];
      } catch (e) {
        console.error('Experience parse error:', e);
      }
    }
    
    // Handle education
    if (req.body.education) {
      try {
        let educationData = req.body.education;
        if (typeof educationData === 'string') {
          educationData = JSON.parse(educationData);
        }
        user.education = Array.isArray(educationData) ? educationData : [];
      } catch (e) {
        console.error('Education parse error:', e);
      }
    }
    
    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = req.file.path;
    }
    
    await user.save();
    console.log('User updated successfully');
    
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Upload cover photo
router.post('/cover', protect, uploadImages.single('coverPhoto'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (req.file) {
      user.coverPhoto = req.file.path;
      await user.save();
    }
    
    res.json({ coverPhoto: user.coverPhoto });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
 
router.post('/:userId/view', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't track own views
    if (user._id.toString() === req.user._id.toString()) {
      return res.json({ message: 'Own view not tracked' });
    }
    
    // Initialize profileViews array if it doesn't exist
    if (!user.profileViews) user.profileViews = [];
    
    // Check if already viewed in last 30 seconds (to prevent duplicate notifications)
    const recentlyViewed = user.profileViews.some(view => 
      view.viewer && view.viewer.toString() === req.user._id.toString() &&
      new Date(view.viewedAt) > new Date(Date.now() - 30 * 1000) // 30 seconds
    );
    
    if (!recentlyViewed) {
      // Add view record
      user.profileViews.push({
        viewer: req.user._id,
        viewedAt: new Date()
      });
      await user.save();
      
      // Create notification only if not recently viewed
      console.log('Creating profile view notification for:', user.name, 'from:', req.user.name);
      
      // Check if a similar notification already exists in last 30 seconds
      const existingNotification = await Notification.findOne({
        recipient: req.params.userId,
        sender: req.user._id,
        type: 'profile_view',
        createdAt: { $gt: new Date(Date.now() - 30 * 1000) }
      });
      
      if (!existingNotification) {
        const notification = await Notification.create({
          recipient: req.params.userId,
          sender: req.user._id,
          type: 'profile_view',
          content: `${req.user.name} viewed your profile`,
        });
        
        console.log('Notification created:', notification);
        
        // Get populated notification
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name profilePicture');
        
        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
          console.log('Emitting notification to room:', `user_${req.params.userId}`);
          io.to(`user_${req.params.userId}`).emit('new_notification', populatedNotification);
          console.log('Notification emitted successfully');
        }
      } else {
        console.log('Duplicate notification prevented - notification already sent recently');
      }
    } else {
      console.log('Profile view recorded but no notification sent (viewed within last 30 seconds)');
    }
    
    res.json({ viewCount: user.profileViews.length });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Follow/Unfollow user - FIXED
router.post('/:userId/follow', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }
    
    const isFollowing = userToFollow.followers.includes(req.user._id);
    
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.params.userId, {
        $pull: { followers: req.user._id }
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.userId }
      });
      
      res.json({ 
        following: false, 
        followerCount: userToFollow.followers.length - 1 
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.params.userId, {
        $addToSet: { followers: req.user._id }
      });
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: req.params.userId }
      });
      
      // Create notification for the user being followed
      const notification = await Notification.create({
        recipient: req.params.userId,
        sender: req.user._id,
        type: 'follow',
        content: `${req.user.name} started following you`,
      });
      
      // Emit real-time notification - FIXED: Get io from app
      const io = req.app.get('io');
      if (io) {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name profilePicture');
        
        io.to(`user_${req.params.userId}`).emit('new_notification', populatedNotification);
        console.log('Follow notification emitted');
      }
      
      res.json({ 
        following: true, 
        followerCount: userToFollow.followers.length + 1 
      });
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get user's reposts
router.get('/:userId/reposts', async (req, res) => {
  try {
    const Service = require('../models/Service');
    
    const services = await Service.find({
      'reposts.user': req.params.userId,
      status: 'active'
    })
      .populate('seller', 'name profilePicture rating headline')
      .populate('comments.user', 'name profilePicture')
      .populate('reposts.user', 'name profilePicture')
      .sort('-createdAt');
    
    const repostedPosts = services.map(service => {
      const userRepost = service.reposts.find(r => r.user._id.toString() === req.params.userId);
      return {
        ...service.toObject(),
        repostedBy: userRepost ? userRepost.user : null,
        repostComment: userRepost?.withComment || null,
        isRepost: true
      };
    });
    
    res.json(repostedPosts);
  } catch (error) {
    console.error('Fetch user reposts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Search user by name
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: 'Name parameter required' });
    }
    
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'name profilePicture headline')
      .select('followers');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.followers);
  } catch (error) {
    console.error('Fetch followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's following
router.get('/:userId/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'name profilePicture headline')
      .select('following');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.following);
  } catch (error) {
    console.error('Fetch following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get people you may know
// Get people you may know
// Get people you may know - Make it work for non-logged-in users
router.get('/suggestions/friends', async (req, res) => {
  try {
    // If user is not logged in, return empty array or popular users
    if (!req.user) {
      // Return some default suggestions for non-logged-in users
      const popularUsers = await User.find()
        .sort('-createdAt')
        .limit(5)
        .select('name profilePicture headline');
      
      return res.json(popularUsers.map(user => ({
        ...user.toObject(),
        mutualFriendsCount: 0,
        mutualFriends: []
      })));
    }
    
    const currentUser = await User.findById(req.user._id);
    
    // Get users that current user is already following
    const followingIds = currentUser.following || [];
    
    // Get users that follow the current user
    const followerIds = currentUser.followers || [];
    
    // Find mutual connections
    const usersFollowedByFollowers = await User.find({
      _id: { 
        $ne: req.user._id,
        $nin: followingIds
      },
      followers: { $in: followerIds }
    }).limit(5);
    
    // Find people with similar skills
    let usersWithSimilarSkills = [];
    if (currentUser.skills && currentUser.skills.length > 0) {
      usersWithSimilarSkills = await User.find({
        _id: { 
          $ne: req.user._id,
          $nin: followingIds
        },
        skills: { $in: currentUser.skills }
      }).limit(5);
    }
    
    // Find active users
    const activeUsers = await User.find({
      _id: { $ne: req.user._id, $nin: followingIds }
    })
      .sort('-createdAt')
      .limit(3);
    
    // Combine and deduplicate suggestions
    const suggestionsMap = new Map();
    
    const addSuggestion = (user, priority) => {
      if (!followingIds.includes(user._id.toString()) && user._id.toString() !== req.user._id.toString()) {
        if (!suggestionsMap.has(user._id.toString())) {
          suggestionsMap.set(user._id.toString(), { ...user.toObject(), priority });
        }
      }
    };
    
    usersFollowedByFollowers.forEach(user => addSuggestion(user, 1));
    usersWithSimilarSkills.forEach(user => addSuggestion(user, 2));
    activeUsers.forEach(user => addSuggestion(user, 3));
    
    let suggestions = Array.from(suggestionsMap.values())
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10);
    
    // If not enough suggestions, add random users
    if (suggestions.length < 5) {
      const existingSuggestionIds = suggestions.map(s => s._id);
      const randomUsers = await User.find({
        _id: { 
          $ne: req.user._id,
          $nin: [...followingIds, ...existingSuggestionIds]
        }
      }).limit(5 - suggestions.length);
      
      randomUsers.forEach(user => addSuggestion(user, 4));
      suggestions = Array.from(suggestionsMap.values()).slice(0, 10);
    }
    
    // Get mutual friends count
    const suggestionsWithMutual = await Promise.all(
      suggestions.map(async (suggestion) => {
        const suggestionUser = await User.findById(suggestion._id);
        const mutualFriends = suggestionUser.followers.filter(followerId => 
          followerIds.includes(followerId.toString())
        );
        
        return {
          ...suggestion,
          mutualFriendsCount: mutualFriends.length,
          mutualFriends: mutualFriends.slice(0, 3),
        };
      })
    );
    
    res.json(suggestionsWithMutual);
  } catch (error) {
    console.error('Fetch suggestions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get suggestions based on user interests/categories
router.get('/suggestions/interests', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    // Get services posted by the user to understand interests
    const Service = require('../models/Service');
    const userServices = await Service.find({ seller: req.user._id })
      .select('category')
      .limit(10);
    
    const userCategories = userServices.map(s => s.category);
    
    // Find users who post in similar categories
    const suggestedByInterests = await Service.aggregate([
      {
        $match: {
          category: { $in: userCategories },
          seller: { $ne: req.user._id }
        }
      },
      {
        $group: {
          _id: '$seller',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    const interestUserIds = suggestedByInterests.map(s => s._id);
    
    const interestUsers = await User.find({
      _id: { $in: interestUserIds, $nin: currentUser.following }
    }).limit(5);
    
    res.json(interestUsers);
  } catch (error) {
    console.error('Fetch interest suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;