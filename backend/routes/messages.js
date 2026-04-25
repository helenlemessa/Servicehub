const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const { uploadMedia, uploadToCloudinary } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const Service = require('../models/Service');
// Ensure voice uploads directory exists
const voiceUploadDir = path.join(__dirname, '../uploads/voices');
if (!fs.existsSync(voiceUploadDir)) {
  fs.mkdirSync(voiceUploadDir, { recursive: true });
}

// In your backend/routes/messages.js, update the upload endpoint:
router.post('/link-preview', protect, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // For internal post links, fetch from your own API
    if (url.includes('/services/')) {
      const postId = url.split('/services/').pop().split('?')[0];
      const post = await Service.findById(postId)
        .populate('seller', 'name');
      
      if (post) {
        return res.json({
          title: post.title,
          description: post.description.substring(0, 150),
          image: post.images?.[0] || null,
          url: url,
          domain: new URL(url).hostname
        });
      }
    }
    
    // For external URLs, fetch Open Graph data
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract Open Graph tags
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const image = $('meta[property="og:image"]').attr('content');
    
    res.json({
      title: title || new URL(url).hostname,
      description: description || '',
      image: image || null,
      url: url,
      domain: new URL(url).hostname
    });
  } catch (error) {
    console.error('Link preview error:', error);
    res.status(500).json({ error: 'Failed to fetch link preview' });
  }
});
router.post('/upload', protect, uploadMedia.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type } = req.body;
    console.log('Upload request:', { type, fileSize: req.file.size, fileName: req.file.originalname });
    
    let result;
    
    // Upload everything to Cloudinary
    if (type === 'voice') {
      result = await uploadToCloudinary(req.file, 'voice');
    } else if (type === 'image') {
      result = await uploadToCloudinary(req.file, 'image');
    } else {
      result = await uploadToCloudinary(req.file, 'file');
    }
    
    console.log('Upload successful:', result.secure_url);
    
    res.json({
      url: result.secure_url,
      name: req.file.originalname,
      size: req.file.size,
      type: type,
    });
  } catch (error) {
    console.error('Upload error details:', error);
    res.status(500).json({ 
      message: 'Upload failed', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get unread messages count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false,
      deletedFor: { $ne: req.user._id },
      deletedForEveryone: false,
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all unread messages with conversation details
router.get('/unread', protect, async (req, res) => {
  try {
    const unreadMessages = await Message.find({
      receiver: req.user._id,
      read: false,
      deletedFor: { $ne: req.user._id },
      deletedForEveryone: false,
    })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture')
      .sort('-createdAt');
    
    const conversations = {};
    unreadMessages.forEach(msg => {
      if (!conversations[msg.conversationId]) {
        conversations[msg.conversationId] = {
          conversationId: msg.conversationId,
          sender: msg.sender,
          lastMessage: msg.text || (msg.messageType === 'image' ? '📷 Image' : msg.messageType === 'voice' ? '🎤 Voice message' : '📎 File'),
          timestamp: msg.createdAt,
          unreadCount: 0,
        };
      }
      conversations[msg.conversationId].unreadCount++;
    });
    
    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversations for current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      deletedFor: { $ne: req.user._id },
      deletedForEveryone: false,
    })
      .populate('sender', 'name profilePicture email role')
      .populate('receiver', 'name profilePicture email role')
      .sort('-createdAt')
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific conversation
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: req.user._id },
      deletedForEveryone: false,
    })
      .populate('sender', 'name profilePicture email role')
      .populate('receiver', 'name profilePicture email role')
      .sort('createdAt');

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read for a conversation
router.put('/read/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const result = await Message.updateMany(
      {
        conversationId,
        receiver: req.user._id,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );
    
    const updatedMessages = await Message.find({
      conversationId,
      receiver: req.user._id,
      read: true,
    }).populate('sender', 'name profilePicture');
    
    res.json({ 
      message: 'Messages marked as read',
      count: result.modifiedCount,
      messages: updatedMessages 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new text message (HTTP endpoint)
router.post('/', protect, async (req, res) => {
  try {
    const { conversationId, receiverId, text } = req.body;
    
    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text,
      messageType: 'text',
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create media message
router.post('/media', protect, async (req, res) => {
  try {
    const { conversationId, receiverId, mediaUrl, mediaName, mediaSize, messageType, mediaDuration } = req.body;
    
    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      messageType,
      mediaUrl,
      mediaName,
      mediaSize: mediaSize || 0,
      mediaDuration: mediaDuration || 0,
      text: '',
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Create media message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Edit message
router.put('/edit/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const fiveMinutes = 5 * 60 * 1000;
    const timeSinceCreation = Date.now() - new Date(message.createdAt).getTime();
    
    if (timeSinceCreation > fiveMinutes) {
      return res.status(400).json({ message: 'Can only edit messages within 5 minutes' });
    }
    
    message.edited = true;
    message.editedAt = new Date();
    message.editedText = message.text;
    message.text = text;
    
    await message.save();
    
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message (for self or everyone)
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.query;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const isParticipant = message.sender.toString() === req.user._id.toString() || 
                         message.receiver.toString() === req.user._id.toString();
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (deleteForEveryone === 'true') {
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only sender can delete for everyone' });
      }
      
      const tenMinutes = 10 * 60 * 1000;
      const timeSinceCreation = Date.now() - new Date(message.createdAt).getTime();
      
      if (timeSinceCreation > tenMinutes) {
        return res.status(400).json({ message: 'Can only delete messages within 10 minutes' });
      }
      
      message.deletedForEveryone = true;
      await message.save();
    } else {
      message.deletedFor.push(req.user._id);
      await message.save();
    }
    
    res.json({ 
      message: 'Message deleted successfully',
      deletedForEveryone: deleteForEveryone === 'true'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;