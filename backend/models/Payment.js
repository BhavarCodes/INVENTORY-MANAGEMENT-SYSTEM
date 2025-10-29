const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'cod'],
    required: true
  },
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'paytm', 'phonepe', 'gpay', 'manual'],
    default: 'razorpay'
  },
  gatewayPaymentId: {
    type: String,
    sparse: true
  },
  gatewayOrderId: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  failureReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date
  },
  paymentDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Generate transaction ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.transactionId = `TXN-${timestamp.slice(-8)}-${random}`;
  }
  next();
});

// Index for efficient queries
paymentSchema.index({ business: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);