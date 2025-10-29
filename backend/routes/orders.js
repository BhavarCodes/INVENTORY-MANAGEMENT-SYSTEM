const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Order type filter
    if (req.query.orderType) {
      filter.orderType = req.query.orderType;
    }

    const orders = await Order.find(filter)
      .populate('products.product', 'name sku unit')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product', 'name sku unit costPrice sellingPrice')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, [
  body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('products.*.product').isMongoId().withMessage('Invalid product ID'),
  body('products.*.quantity').isNumeric().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('supplier.name').optional().trim().isLength({ min: 1 }).withMessage('Supplier name is required if provided'),
  body('supplier.email').optional().isEmail().withMessage('Supplier email must be valid'),
  body('expectedDeliveryDate').optional().isISO8601().withMessage('Invalid delivery date format')
], async (req, res) => {
  try {
    console.log('Order creation request received:', {
      body: req.body,
      user: req.user ? { id: req.user._id, currentBusiness: req.user.currentBusiness } : 'No user'
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has a current business
    if (!req.user.currentBusiness) {
      console.error('User has no currentBusiness:', {
        userId: req.user._id,
        userBusinesses: req.user.businesses,
        currentBusiness: req.user.currentBusiness
      });
      
      // If user has businesses but no currentBusiness, set the first one
      if (req.user.businesses && req.user.businesses.length > 0) {
        req.user.currentBusiness = req.user.businesses[0].business;
        await req.user.save();
        console.log('Auto-set currentBusiness to:', req.user.currentBusiness);
      } else {
        return res.status(400).json({ message: 'No current business selected. Please create or select a business first.' });
      }
    }

    const { products, supplier, expectedDeliveryDate, notes } = req.body;

    // Validate products and calculate prices
    const orderProducts = [];
    let totalAmount = 0;

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      // Check order size limit
      if (item.quantity > product.maxOrderQuantity) {
        return res.status(400).json({ 
          message: `Order quantity (${item.quantity}) exceeds the maximum order limit for "${product.name}". Maximum allowed: ${product.maxOrderQuantity}`,
          productName: product.name,
          requestedQuantity: item.quantity,
          maxOrderQuantity: product.maxOrderQuantity,
          error: 'ORDER_SIZE_LIMIT_EXCEEDED'
        });
      }

      const unitPrice = product.costPrice;
      const totalPrice = unitPrice * item.quantity;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      });

      totalAmount += totalPrice;
    }

    // Create order
    const order = new Order({
      products: orderProducts,
      totalAmount,
      supplier,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      notes,
      createdBy: req.user._id,
      business: req.user.currentBusiness,
      orderType: 'manual'
    });

    await order.save();

    // Create notification
    const notification = new Notification({
      business: req.user.currentBusiness,
      title: 'New Order Created',
      message: `Order ${order.orderNumber} has been created with ${orderProducts.length} products`,
      type: 'order_placed',
      priority: 'medium',
      recipient: req.user._id,
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    await notification.save();

    // Emit real-time notification
    req.io.emit('newOrder', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount,
      productCount: orderProducts.length
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
      requiresPayment: order.orderType === 'manual', // Indicate if payment is required
      redirectToPayment: order.orderType === 'manual'
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      user: req.user ? { id: req.user._id, currentBusiness: req.user.currentBusiness } : 'No user',
      body: req.body
    });
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order (products, supplier, expectedDeliveryDate, notes)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot edit delivered or cancelled orders' });
    }

    const { products, supplier, expectedDeliveryDate, notes } = req.body;

    if (Array.isArray(products) && products.length > 0) {
      // Re-validate products and recalc totals
      const updatedProducts = [];
      let totalAmount = 0;
      for (const item of products) {
        const p = await Product.findById(item.product);
        if (!p) return res.status(400).json({ message: `Product ${item.product} not found` });
        
        // Check order size limit
        if (item.quantity > p.maxOrderQuantity) {
          return res.status(400).json({ 
            message: `Order quantity (${item.quantity}) exceeds the maximum order limit for "${p.name}". Maximum allowed: ${p.maxOrderQuantity}`,
            productName: p.name,
            requestedQuantity: item.quantity,
            maxOrderQuantity: p.maxOrderQuantity,
            error: 'ORDER_SIZE_LIMIT_EXCEEDED'
          });
        }
        
        const unitPrice = p.costPrice;
        const totalPrice = unitPrice * item.quantity;
        updatedProducts.push({ product: p._id, quantity: item.quantity, unitPrice, totalPrice });
        totalAmount += totalPrice;
      }
      order.products = updatedProducts;
      order.totalAmount = totalAmount;
    }

    if (supplier) order.supplier = supplier;
    order.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : order.expectedDeliveryDate;
    if (typeof notes === 'string') order.notes = notes;

    await order.save();
    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', auth, [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    if (status === 'delivered') {
      order.actualDeliveryDate = new Date();
      
      // Check for overstock before updating product stock
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          const newStockLevel = product.currentStock + item.quantity;
          if (newStockLevel > product.maxStockLevel) {
            return res.status(400).json({ 
              message: `Cannot deliver order. Product "${product.name}" would exceed maximum stock level. Current: ${product.currentStock}, Adding: ${item.quantity}, Max: ${product.maxStockLevel}`,
              productName: product.name,
              currentStock: product.currentStock,
              maxStockLevel: product.maxStockLevel,
              orderQuantity: item.quantity
            });
          }
        }
      }
      
      // Update product stock
      for (const item of order.products) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { currentStock: item.quantity } }
        );
      }

      // Create delivery notification
      const notification = new Notification({
        business: req.user.currentBusiness,
        title: 'Order Delivered',
        message: `Order ${order.orderNumber} has been delivered and stock updated`,
        type: 'order_delivered',
        priority: 'medium',
        recipient: req.user._id,
        data: { orderId: order._id, orderNumber: order.orderNumber }
      });

      await notification.save();
    }

    await order.save();

    // Emit real-time update
    req.io.emit('orderStatusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    });

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
