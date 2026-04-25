const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'both'],
    default: 'buyer',
  },
  // Profile Fields
  profilePicture: {
    type: String,
    default: '',
  },
  coverPhoto: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    maxLength: 3000,
    default: '',
  },
  headline: {
    type: String,
    maxLength: 500,
    default: '',
  },
  location: {
    city: { type: String, default: '' },
    subCity: { type: String, default: '' },
    country: { type: String, default: 'Ethiopia' },
  },
  skills: {
    type: [String],
    default: [],
  },
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
  }],
  education: [{
    school: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
  }],
  phone: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  socialLinks: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
  },
  // Stats
  rating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
 followers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: [],
}],
following: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: [],
}],
  profileViews: [{
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
   resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
  },
});
// Virtual for follower count - with safe check
userSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count - with safe check
userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });
// Add these inside your userSchema
userSchema.index({ skills: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ createdAt: -1 });
module.exports = mongoose.model('User', userSchema);