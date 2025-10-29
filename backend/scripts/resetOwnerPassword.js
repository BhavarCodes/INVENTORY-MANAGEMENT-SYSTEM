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
    const newPassword = process.argv[3] || 'owner123';

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      process.exit(1);
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    console.log(`✅ Password reset for ${email}. New password is set.`);
    console.log('Tip: Change it after login.');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

run();
