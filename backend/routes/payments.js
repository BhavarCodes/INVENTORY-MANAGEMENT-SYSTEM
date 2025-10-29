const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock payment gateway functions (replace with actual gateway integration)
const createPaymentOrder = async (amount, currency = 'INR') => {
  // This would be replaced with actual payment gateway integration
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: amount * 100, // Convert to smallest currency unit
    currency,
    status: 'created'
  };
};

const verifyPaymentSignature = (paymentId, orderId, signature) => {
  // This would be replaced with actual signature verification
  return true; // Mock verification
};

// @route   POST /api/payments/create
// @desc    Create payment for an order
// @access  Private
router.post('/create', auth, [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'cod']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, paymentMethod } = req.body;

    // Get the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Payment already completed for this order' });
    }

    // Create payment gateway order
    const gatewayOrder = await createPaymentOrder(order.totalAmount);

    // Create payment record
    const payment = new Payment({
      business: req.user.currentBusiness,
      order: order._id,
      amount: order.totalAmount,
      paymentMethod,
      gatewayOrderId: gatewayOrder.id,
      createdBy: req.user._id
    });

    await payment.save();

    // Update order payment status
    order.paymentStatus = 'processing';
    order.paymentAmount = order.totalAmount;
    await order.save();

    res.json({
      message: 'Payment order created successfully',
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        gatewayOrderId: payment.gatewayOrderId
      },
      gatewayOrder
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify payment
// @access  Private
router.post('/verify', auth, [
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('transactionId').isMongoId().withMessage('Valid transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId, orderId, signature, transactionId } = req.body;

    // Find payment record
    const payment = await Payment.findById(transactionId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(paymentId, orderId, signature);
    
    if (isValidSignature) {
      // Update payment status
      payment.status = 'completed';
      payment.gatewayPaymentId = paymentId;
      payment.paymentDate = new Date();
      await payment.save();

      // Update order
      const order = await Order.findById(payment.order);
      order.paymentStatus = 'completed';
      order.paymentId = paymentId;
      order.paymentDate = new Date();
      order.status = 'confirmed';
      await order.save();

      // Create notification
      const notification = new Notification({
        business: req.user.currentBusiness,
        title: 'Payment Successful',
        message: `Payment of ₹${payment.amount} for order ${order.orderNumber} completed successfully`,
        type: 'payment_success',
        priority: 'high',
        recipient: req.user._id,
        data: { 
          orderId: order._id, 
          orderNumber: order.orderNumber,
          paymentId: payment._id,
          transactionId: payment.transactionId
        }
      });

      await notification.save();

      // Emit real-time notification
      req.io.emit('paymentSuccess', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: payment.amount,
        transactionId: payment.transactionId
      });

      res.json({
        message: 'Payment verified successfully',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus
        }
      });
    } else {
      // Payment verification failed
      payment.status = 'failed';
      payment.failureReason = 'Invalid signature';
      await payment.save();

      const order = await Order.findById(payment.order);
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments
// @desc    Get payment history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { business: req.user.currentBusiness };
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const payments = await Payment.find(filter)
      .populate('order', 'orderNumber totalAmount status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber totalAmount status products')
      .populate('createdBy', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/pending-notification
// @desc    Create payment pending notification for auto orders
// @access  Private
router.post('/pending-notification', auth, [
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create payment pending notification
    const notification = new Notification({
      business: req.user.currentBusiness,
      title: 'Payment Pending - Auto Order',
      message: `Auto order ${order.orderNumber} created for low stock items. Payment of ₹${order.totalAmount} is pending.`,
      type: 'payment_pending',
      priority: 'high',
      recipient: req.user._id,
      data: { 
        orderId: order._id, 
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        orderType: order.orderType
      }
    });

    await notification.save();

    // Emit real-time notification
    req.io.emit('paymentPending', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      orderType: order.orderType
    });

    res.json({
      message: 'Payment pending notification created',
      notification
    });
  } catch (error) {
    console.error('Create payment pending notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;