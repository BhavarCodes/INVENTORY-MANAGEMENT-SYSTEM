const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  orderNumber: {
    type: String,
    // Generated in pre-save hook
    required: false
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    // Calculated in pre-save hook
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'manual'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'cod'],
    default: null
  },
  paymentId: {
    type: String,
    sparse: true
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentDate: {
    type: Date
  },
  supplier: {
    name: String,
    email: String,
    phone: String
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp.slice(-6)}-${random}`;
  }
  next();
});

// Calculate total amount
orderSchema.pre('save', function(next) {
  if (this.products && this.products.length > 0) {
    this.totalAmount = this.products.reduce((total, item) => total + item.totalPrice, 0);
  }
  next();
});

// Index for efficient queries
orderSchema.index({ business: 1 });
orderSchema.index({ business: 1, orderNumber: 1 }, { unique: true }); // Order number unique per business
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderType: 1 });

module.exports = mongoose.model('Order', orderSchema);
