const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const Business = require('../models/Business');

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.id).populate('currentBusiness');
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let existingUser = await User.findOne({ googleId: profile.id });
    
    if (existingUser) {
      return done(null, existingUser);
    }

    // Check if user exists with same email
    const existingUserByEmail = await User.findOne({ email: profile.emails[0].value });
    
    if (existingUserByEmail) {
      // Link Google account to existing user
      existingUserByEmail.googleId = profile.id;
      existingUserByEmail.avatar = profile.photos[0].value;
      await existingUserByEmail.save();
      return done(null, existingUserByEmail);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      role: 'owner'
    });

    await newUser.save();

    // Create default business for the user
    const business = new Business({
      name: `${profile.displayName}'s Business`,
      owner: newUser._id,
      businessType: 'grocery',
      contact: {
        email: profile.emails[0].value
      }
    });

    await business.save();

    // Add business to user's businesses array
    newUser.businesses.push({
      business: business._id,
      role: 'owner'
    });
    newUser.currentBusiness = business._id;
    await newUser.save();

    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;
