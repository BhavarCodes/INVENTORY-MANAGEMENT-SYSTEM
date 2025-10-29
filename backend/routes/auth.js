const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const Business = require('../models/Business');
const auth = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    console.log('Registration attempt for email:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists for email:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false
    });

    await user.save();
    console.log('User registered successfully for email:', email);

    // Send verification email
    const emailResult = await sendVerificationEmail(email, name, emailVerificationToken);
    
    if (!emailResult.success && !emailResult.isDevelopment) {
      console.error('Failed to send verification email:', emailResult.error);
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Handle duplicate email error from MongoDB
    if (error && (error.code === 11000 || error.code === '11000')) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] || 'Validation error' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Helper: ensure user has currentBusiness set
async function ensureCurrentBusiness(user) {
  try {
    if (!user.currentBusiness) {
      // Prefer a business where user is owner; otherwise first membership
      const ownerBiz = user.businesses?.find(b => b.role === 'owner');
      if (ownerBiz && ownerBiz.business) {
        user.currentBusiness = ownerBiz.business;
      } else if (user.businesses && user.businesses.length > 0) {
        user.currentBusiness = user.businesses[0].business;
      }
      if (user.currentBusiness) {
        await user.save();
      }
    }
  } catch (e) {
    console.warn('ensureCurrentBusiness failed:', e?.message);
  }
}

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Login attempt for email:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('Account deactivated for email:', email);
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('Email not verified for email:', email);
      return res.status(403).json({ 
        message: 'Please verify your email address before logging in. Check your email for the verification link.',
        requiresVerification: true
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

  // Update last login and ensure current business
  user.lastLogin = new Date();
  await ensureCurrentBusiness(user);
  await user.save();

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful for email:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Email verification attempt with token:', token);

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired verification token');
      return res.status(400).json({ 
        message: 'Invalid or expired verification link. Please request a new verification email.' 
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      console.log('Email already verified for:', user.email);
      return res.json({ 
        message: 'Email is already verified. You can now log in.',
        alreadyVerified: true
      });
    }

    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('Email verified successfully for:', user.email);

    res.json({
      message: 'Email verified successfully! You can now log in.',
      success: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        message: 'If an account with that email exists, a verification email has been sent.' 
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        message: 'Email is already verified. You can log in.' 
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, user.name, emailVerificationToken);
    
    if (!emailResult.success && !emailResult.isDevelopment) {
      console.error('Failed to resend verification email:', emailResult.error);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'Verification email sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error while resending verification email' });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }
      
      // Update last login and ensure current business
      user.lastLogin = new Date();
      await ensureCurrentBusiness(user);
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('currentBusiness')
      .populate('businesses.business');

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        currentBusiness: user.currentBusiness,
        businesses: user.businesses,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (and optional settings)
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('settings.lowStockThreshold').optional().isInt({ min: 0 }).withMessage('lowStockThreshold must be a non-negative integer'),
  body('settings.notificationEmail').optional().isEmail().withMessage('notificationEmail must be a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address, settings } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (settings) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   POST /api/auth/business
// @desc    Create a new business
// @access  Private
router.post('/business', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters'),
  body('businessType').optional().isIn(['grocery', 'restaurant', 'retail', 'pharmacy', 'other']).withMessage('Invalid business type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, businessType, address, contact, settings } = req.body;

    const business = new Business({
      name,
      description,
      businessType: businessType || 'grocery',
      owner: req.user._id,
      address,
      contact,
      settings
    });

    await business.save();

    // Add business to user's businesses array
    req.user.businesses.push({
      business: business._id,
      role: 'owner'
    });
    await req.user.save();

    res.status(201).json({
      message: 'Business created successfully',
      business
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ message: 'Server error during business creation' });
  }
});

// @route   PUT /api/auth/business/:businessId/switch
// @desc    Switch current business
// @access  Private
router.put('/business/:businessId/switch', auth, async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Check if user has access to this business
    const businessAccess = req.user.businesses.find(
      b => b.business.toString() === businessId
    );

    if (!businessAccess) {
      return res.status(403).json({ message: 'Access denied to this business' });
    }

    // Update current business
    req.user.currentBusiness = businessId;
    await req.user.save();

    const business = await Business.findById(businessId);

    res.json({
      message: 'Business switched successfully',
      business
    });
  } catch (error) {
    console.error('Switch business error:', error);
    res.status(500).json({ message: 'Server error during business switch' });
  }
});

// @route   GET /api/auth/businesses
// @desc    Get user's businesses
// @access  Private
router.get('/businesses', auth, async (req, res) => {
  try {
    const businesses = await Business.find({
      _id: { $in: req.user.businesses.map(b => b.business) }
    }).select('-__v');

    res.json({ businesses });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
