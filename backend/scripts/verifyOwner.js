const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || process.env.LOCAL_MONGODB_URL || 'mongodb://localhost:27017/grocery_inventory';
    console.log('Connecting to MongoDB:', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const email = process.argv[2] || 'owner@gmail.com';
    const update = { isEmailVerified: true, isActive: true };

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      process.exit(1);
    }

    console.log('Before update:', { email: user.email, isEmailVerified: user.isEmailVerified, isActive: user.isActive });
    user.isEmailVerified = true;
    user.isActive = true;
    await user.save();

    const reloaded = await User.findOne({ email });
    console.log('After update:', { email: reloaded.email, isEmailVerified: reloaded.isEmailVerified, isActive: reloaded.isActive });

    console.log('✅ Owner account verified successfully. You can now log in.');
    process.exit(0);
  } catch (err) {
    console.error('Error verifying owner:', err);
    process.exit(1);
  }
}

run();
