const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '', // Make default empty string instead of required
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text',
  },
  mediaUrl: {
    type: String,
    default: '',
  },
  mediaName: {
    type: String,
    default: '',
  },
  mediaSize: {
    type: Number,
    default: 0,
  },
  mediaDuration: {
    type: Number,
    default: 0,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  delivered: {
    type: Boolean,
    default: true,
  },
  deliveredAt: {
    type: Date,
    default: Date.now,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  editedText: {
    type: String,
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  deletedForEveryone: {
    type: Boolean,
    default: false,
  },
 
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ deletedFor: 1 });

module.exports = mongoose.model('Message', messageSchema);
