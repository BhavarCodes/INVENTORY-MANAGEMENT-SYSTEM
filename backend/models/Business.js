const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessType: {
    type: String,
    enum: ['grocery', 'restaurant', 'retail', 'pharmacy', 'other'],
    default: 'grocery'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  settings: {
    currency: {
      type: String,
      default: 'INR'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 10
    },
    notificationEmail: String,
    autoReorder: {
      type: Boolean,
      default: false
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    maxProducts: {
      type: Number,
      default: 100
    },
    maxUsers: {
      type: Number,
      default: 2
    },
    expiresAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logo: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
businessSchema.index({ owner: 1 });
businessSchema.index({ name: 1 });

module.exports = mongoose.model('Business', businessSchema);
