const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const User = require('../models/User');
const Business = require('../models/Business');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery_inventory';
    await mongoose.connect(uri);

    // Find owner and their business
    const owner = await User.findOne({ email: 'owner@gmail.com' });
    if (!owner) {
      console.log('Owner user not found. Seed first.');
      process.exit(1);
    }

    const business = await Business.findOne({ owner: owner._id });
    if (!business) {
      console.log('Business for owner not found. Seed first.');
      process.exit(1);
    }

    const missing = await Product.countDocuments({ $or: [{ business: { $exists: false } }, { business: null }] });
    console.log('Products missing business field:', missing);

    if (missing > 0) {
      const res = await Product.updateMany(
        { $or: [{ business: { $exists: false } }, { business: null }] },
        { $set: { business: business._id } }
      );
      console.log('Updated products:', res.modifiedCount);
    } else {
      console.log('No products needed updates.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Fix script error:', err);
    process.exit(1);
  }
}

run();
