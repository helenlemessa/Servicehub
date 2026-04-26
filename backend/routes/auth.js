const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Configure Gmail Transporter
let transporter;

// Only create transporter if email credentials exist
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // This MUST be an App Password
    },
  });

  // Verify transporter connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter error:', error);
      console.log('💡 Tip: Make sure you are using an App Password, not your regular Gmail password');
      console.log('💡 Generate an App Password: https://myaccount.google.com/apppasswords');
    } else {
      console.log('✅ Email transporter ready to send emails');
    }
  });
} else {
  console.log('⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASS in .env file');
  console.log('💡 For testing, use the reset URL from the console');
}

// Register
// Register - Updated to initialize following/followers
router.post(
  '/register',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'buyer',
        following: [],
        followers: [],
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        following: [],
        followers: [],
        token,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);
// Login - Updated to include following and followers
// Login - Updated with specific error messages
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'No account found with this email address. Please sign up first.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Incorrect password. Please try again.' 
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '30d',
    });

    // Get following and followers counts/ids
    const followingIds = user.following || [];
    const followerIds = user.followers || [];

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      following: followingIds,
      followers: followerIds,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Get profile
 
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('following', 'name profilePicture')
      .populate('followers', 'name profilePicture');
    
    // Convert to plain object and ensure arrays exist
    const userObj = user.toObject();
    userObj.following = userObj.following || [];
    userObj.followers = userObj.followers || [];
    
    console.log('Profile sent - following count:', userObj.following.length);
    console.log('Profile sent - followers count:', userObj.followers.length);
    
    res.json(userObj);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - With Actual Email Sending
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password request for:', email);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    console.log('🔑 Generated reset token:', resetToken);
    
    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Verify token was saved
    const verifyUser = await User.findById(user._id);
    console.log('✅ Token saved. Verifying:', {
      hasToken: !!verifyUser.resetPasswordToken,
      tokenValue: verifyUser.resetPasswordToken,
      expiresAt: verifyUser.resetPasswordExpire
    });
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    console.log('🔗 Reset URL:', resetUrl);
    
    // Professional Email Template
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">ServiceHub Ethiopia</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0;">Your trusted service marketplace</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">Hello <strong style="color: #667eea;">${user.name}</strong>,</p>
            <p style="color: #666; line-height: 1.6;">We received a request to reset your password for your ServiceHub Ethiopia account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">Or copy and paste this link into your browser:</p>
            <p style="background-color: #f5f5f5; padding: 12px; border-radius: 5px; word-break: break-all; color: #667eea; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Note:</strong> This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">ServiceHub Ethiopia - Connecting people with services</p>
            <p style="margin: 0; color: #adb5bd; font-size: 12px;">
              Need help? Contact us at <a href="mailto:support@servicehub.com" style="color: #667eea;">support@servicehub.com</a>
            </p>
            <p style="margin: 10px 0 0 0; color: #adb5bd; font-size: 11px;">
              © ${new Date().getFullYear()} ServiceHub Ethiopia. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    let emailSent = false;
    
    // Send email if transporter is configured
    if (transporter) {
      try {
        const mailOptions = {
          from: `"ServiceHub Ethiopia" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: '🔐 Password Reset Request - ServiceHub Ethiopia',
          html: emailContent,
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent successfully to: ${user.email}`);
        emailSent = true;
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError.message);
        console.log('💡 Make sure you are using an App Password, not your regular Gmail password');
        console.log('💡 Generate an App Password: https://myaccount.google.com/apppasswords');
      }
    }
    
    res.json({ 
      success: true,
      message: emailSent 
        ? 'Password reset link has been sent to your email address. Please check your inbox (and spam folder).'
        : 'Password reset link generated. Please check the console for the URL.',
      resetUrl: !emailSent ? resetUrl : undefined
    });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    console.log('========================================');
    console.log('🔐 Reset Password Attempt');
    console.log('Token received:', token);
    console.log('Password received:', password ? 'Yes' : 'No');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      // Check if token exists but expired
      const expiredUser = await User.findOne({ resetPasswordToken: token });
      if (expiredUser) {
        console.log('❌ Token expired for user:', expiredUser.email);
        // Clear the expired token
        expiredUser.resetPasswordToken = null;
        expiredUser.resetPasswordExpire = null;
        await expiredUser.save();
        return res.status(400).json({ 
          message: 'Reset link has expired. Please request a new password reset.' 
        });
      }
      
      console.log('❌ No user found with this token');
      return res.status(400).json({ 
        message: 'Invalid reset token. Please request a new password reset.' 
      });
    }
    
    console.log('✅ User found with valid token:', user.email);
    console.log('Token expires at:', user.resetPasswordExpire);
    console.log('Current time:', new Date());
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    
    await user.save();
    
    console.log(`✅ Password reset successful for: ${user.email}`);
    console.log('========================================');
    
    res.json({ 
      success: true,
      message: 'Password has been reset successfully! You can now login with your new password.'
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    console.log('========================================');
    res.status(500).json({ 
      message: 'Server error. Please try again.',
      error: error.message 
    });
  }
});

// Debug endpoint to check token
router.get('/debug-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ resetPasswordToken: token });
    
    if (!user) {
      return res.json({ exists: false, message: 'Token not found' });
    }
    
    res.json({
      exists: true,
      email: user.email,
      expiresAt: user.resetPasswordExpire,
      isExpired: user.resetPasswordExpire < Date.now(),
      currentTime: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all expired tokens
router.post('/cleanup-tokens', async (req, res) => {
  try {
    const result = await User.updateMany(
      { resetPasswordExpire: { $lt: Date.now() } },
      { 
        $unset: { 
          resetPasswordToken: "", 
          resetPasswordExpire: "" 
        } 
      }
    );
    
    res.json({ 
      message: 'Cleaned up expired tokens',
      modified: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;