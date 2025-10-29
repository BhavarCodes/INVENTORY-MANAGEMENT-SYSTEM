const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Business = require('../models/Business');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all products with pagination and filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {
      isActive: true
    };
    
    // Filter by current business if available
    if (req.user.currentBusiness) {
      filter.business = req.user.currentBusiness;
    }
    
    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Stock status filter
    if (req.query.stockStatus) {
      switch (req.query.stockStatus) {
        case 'low_stock':
          filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
          break;
        case 'out_of_stock':
          filter.currentStock = { $lte: 0 };
          break;
        case 'in_stock':
          filter.$expr = { $gt: ['$currentStock', '$minStockLevel'] };
          break;
      }
    }
    
    // Search filter
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add stock status to each product
    const productsWithStatus = products.map(product => ({
      ...product,
      stockStatus: product.currentStock <= 0 ? 'out_of_stock' :
                   product.currentStock <= product.minStockLevel ? 'low_stock' :
                   product.currentStock >= product.maxStockLevel ? 'overstock' : 'in_stock',
      profitMargin: ((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(2)
    }));

    const total = await Product.countDocuments(filter);

    res.json({
      products: productsWithStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get low stock products
// @access  Private
router.get('/low-stock', auth, async (req, res) => {
  try {
    const filter = {
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      isActive: true
    };
    
    // Filter by current business if available
    if (req.user.currentBusiness) {
      filter.business = req.user.currentBusiness;
    }
    
    const products = await Product.find(filter).sort({ currentStock: 1 }).lean();

    const withStatus = products.map(product => ({
      ...product,
      stockStatus: product.currentStock <= 0 ? 'out_of_stock' :
                   product.currentStock <= product.minStockLevel ? 'low_stock' :
                   product.currentStock >= product.maxStockLevel ? 'overstock' : 'in_stock',
      profitMargin: ((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(2)
    }));

    res.json(withStatus);
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/analytics
// @desc    Get inventory analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    // Filter by current business if available
    const filter = { isActive: true };
    if (req.user.currentBusiness) {
      filter.business = req.user.currentBusiness;
    }
    
    const products = await Product.find(filter).lean();

    let totalProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    let overstockProducts = 0;
    let totalInventoryValue = 0;
    const categoryAccumulator = new Map();

    for (const p of products) {
      totalProducts += 1;
      const currentStock = Number(p.currentStock || 0);
      const minStockLevel = Number(p.minStockLevel || 0);
      const maxStockLevel = Number(p.maxStockLevel || 0);
      const costPrice = Number(p.costPrice || 0);
      totalInventoryValue += currentStock * costPrice;

      if (currentStock <= 0) outOfStockProducts += 1;
      if (currentStock <= minStockLevel) lowStockProducts += 1;
      if (currentStock >= maxStockLevel) overstockProducts += 1;

      const key = p.category || 'other';
      const agg = categoryAccumulator.get(key) || { count: 0, totalStock: 0, totalValue: 0, lowStockCount: 0 };
      agg.count += 1;
      agg.totalStock += currentStock;
      agg.totalValue += currentStock * costPrice;
      if (currentStock <= minStockLevel) agg.lowStockCount += 1;
      categoryAccumulator.set(key, agg);
    }

    const categoryStats = Array.from(categoryAccumulator.entries())
      .map(([category, v]) => ({ _id: category, ...v }))
      .sort((a, b) => b.count - a.count);

    res.json({
      overview: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        overstockProducts,
        totalInventoryValue
      },
      categoryStats
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single product
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productWithStatus = {
      ...product.toObject(),
      stockStatus: product.currentStock <= 0 ? 'out_of_stock' :
                   product.currentStock <= product.minStockLevel ? 'low_stock' :
                   product.currentStock >= product.maxStockLevel ? 'overstock' : 'in_stock',
      profitMargin: ((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(2)
    };

    res.json(productWithStatus);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Create new product
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('category').isIn(['fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'bakery', 'pantry', 'beverages', 'snacks', 'canned', 'frozen', 'other']).withMessage('Invalid category'),
  body('sku').trim().isLength({ min: 1 }).withMessage('SKU is required'),
  body('currentStock').isNumeric().isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
  body('minStockLevel').isNumeric().isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
  body('maxStockLevel').isNumeric().isInt({ min: 0 }).withMessage('Maximum stock level must be a non-negative integer'),
  body('unit').isIn(['kg', 'g', 'lb', 'oz', 'liter', 'ml', 'piece', 'box', 'pack', 'bag', 'bottle', 'dozen']).withMessage('Invalid unit'),
  body('costPrice').isNumeric().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
  body('sellingPrice').isNumeric().isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
  body('supplier.name').trim().isLength({ min: 1 }).withMessage('Supplier name is required'),
  body('supplier.email').isEmail().withMessage('Supplier email must be valid'),
  body('reorderQuantity').isNumeric().isInt({ min: 1 }).withMessage('Reorder quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if SKU already exists in the same business
    const existingProductBySku = await Product.findOne({
      sku: req.body.sku,
      business: req.user.currentBusiness
    });

    if (existingProductBySku) {
      return res.status(400).json({ message: 'A product with this SKU already exists in your business' });
    }

    // Check if barcode already exists in the same business (if barcode is provided)
    if (req.body.barcode) {
      const existingProductByBarcode = await Product.findOne({
        barcode: req.body.barcode,
        business: req.user.currentBusiness
      });

      if (existingProductByBarcode) {
        return res.status(400).json({ message: 'A product with this barcode already exists in your business' });
      }
    }

    const productData = {
      ...req.body,
      business: req.user.currentBusiness
    };
    // Force maxOrderQuantity to mirror maxStockLevel on create
    if (typeof productData.maxStockLevel === 'number') {
      productData.maxOrderQuantity = productData.maxStockLevel;
    }
    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      if (error.keyPattern && error.keyPattern.sku) {
        return res.status(400).json({ message: 'A product with this SKU already exists in your business' });
      } else if (error.keyPattern && error.keyPattern.barcode) {
        return res.status(400).json({ message: 'A product with this barcode already exists' });
      } else {
        return res.status(400).json({ message: 'Product with this SKU or barcode already exists' });
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update product
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if SKU already exists in the same business (excluding current product)
    if (req.body.sku) {
      const existingProductBySku = await Product.findOne({
        sku: req.body.sku,
        business: req.user.currentBusiness,
        _id: { $ne: req.params.id }
      });

      if (existingProductBySku) {
        return res.status(400).json({ message: 'A product with this SKU already exists in your business' });
      }
    }

    // Check if barcode already exists in the same business (excluding current product)
    if (req.body.barcode) {
      const existingProductByBarcode = await Product.findOne({
        barcode: req.body.barcode,
        business: req.user.currentBusiness,
        _id: { $ne: req.params.id }
      });

      if (existingProductByBarcode) {
        return res.status(400).json({ message: 'A product with this barcode already exists in your business' });
      }
    }

    // Force maxOrderQuantity to mirror maxStockLevel on update when provided
    if (typeof req.body.maxStockLevel === 'number') {
      req.body.maxOrderQuantity = req.body.maxStockLevel;
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: req.user.currentBusiness },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      if (error.keyPattern && error.keyPattern.sku) {
        return res.status(400).json({ message: 'A product with this SKU already exists in your business' });
      } else if (error.keyPattern && error.keyPattern.barcode) {
        return res.status(400).json({ message: 'A product with this barcode already exists' });
      } else {
        return res.status(400).json({ message: 'Product with this SKU or barcode already exists' });
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      business: req.user.currentBusiness
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory/:id/restock
// @desc    Restock product
// @access  Private
router.post('/:id/restock', auth, [
  body('quantity').isNumeric().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('costPrice').optional().isNumeric().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity, costPrice } = req.body;
    const product = await Product.findOne({
      _id: req.params.id,
      business: req.user.currentBusiness
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if adding this quantity would exceed maximum stock level
    const newStockLevel = product.currentStock + quantity;
    if (newStockLevel > product.maxStockLevel) {
      return res.status(400).json({ 
        message: `Cannot restock. Adding ${quantity} units would exceed the maximum stock level of ${product.maxStockLevel}. Current stock: ${product.currentStock}, Maximum allowed: ${product.maxStockLevel}`,
        currentStock: product.currentStock,
        maxStockLevel: product.maxStockLevel,
        requestedQuantity: quantity,
        maxAllowedQuantity: product.maxStockLevel - product.currentStock
      });
    }

    // Update stock
    product.currentStock += quantity;
    product.lastRestocked = new Date();

    // Update cost price if provided
    if (costPrice) {
      product.costPrice = costPrice;
    }

    await product.save();

    // Check if product is now low stock after restocking
    const stockService = require('../services/stockService');
    if (product.currentStock <= product.minStockLevel) {
      console.log(`Product ${product.name} is now low stock after restocking`);
      // Trigger immediate auto-reorder check
      setTimeout(() => {
        stockService.checkAndAutoReorder();
      }, 1000); // Small delay to ensure the restock is processed
    }

    // Emit real-time update
    req.io.emit('stockUpdated', {
      productId: product._id,
      currentStock: product.currentStock,
      lastRestocked: product.lastRestocked
    });

    res.json({
      message: 'Product restocked successfully',
      product
    });
  } catch (error) {
    console.error('Restock product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory/:id/reorder
// @desc    Automatically reorder product (create order and restock)
// @access  Private
router.post('/:id/reorder', auth, async (req, res) => {
  try {
    // Prefer product by id; enforce business via product.business
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(400).json({ message: 'Cannot reorder inactive product' });
    }

    // Calculate reorder quantity (use reorderQuantity from product)
    const reorderQuantity = product.reorderQuantity;
    
    // Check if reordering would exceed maximum stock level
    const newStockLevel = product.currentStock + reorderQuantity;
    if (newStockLevel > product.maxStockLevel) {
      return res.status(400).json({ 
        message: `Cannot reorder. Adding ${reorderQuantity} units would exceed the maximum stock level of ${product.maxStockLevel}. Current stock: ${product.currentStock}, Maximum allowed: ${product.maxStockLevel}`,
        currentStock: product.currentStock,
        maxStockLevel: product.maxStockLevel,
        requestedQuantity: reorderQuantity,
        maxAllowedQuantity: product.maxStockLevel - product.currentStock
      });
    }
    
    // Create order for the product
    const orderItems = [{
      product: product._id,
      quantity: reorderQuantity,
      unitPrice: product.costPrice,
      totalPrice: reorderQuantity * product.costPrice
    }];

    const order = new Order({
      products: orderItems,
      business: product.business,
      status: 'confirmed',
      orderType: 'manual',
      supplier: product.supplier,
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      createdBy: req.user.id,
      notes: `Auto-reorder for ${product.name} - Low stock alert triggered`
    });

    await order.save();

    // Automatically restock the product (simulate immediate delivery)
    product.currentStock += reorderQuantity;
    product.lastRestocked = new Date();
    await product.save();

    // Create notification
    const notification = new Notification({
      recipient: req.user.id,
      business: product.business,
      type: 'system_alert',
      title: 'Product Reordered',
      message: `${product.name} has been automatically reordered and restocked with ${reorderQuantity} ${product.unit}`,
      data: {
        productId: product._id,
        productName: product.name,
        orderId: order._id,
        quantity: reorderQuantity
      }
    });

    await notification.save();

    // Emit real-time updates
    req.io.emit('stockUpdated', {
      productId: product._id,
      currentStock: product.currentStock,
      lastRestocked: product.lastRestocked
    });

    req.io.emit('newNotification', {
      userId: req.user.id,
      notification: notification
    });

    res.json({
      message: 'Product reordered and restocked successfully',
      product: {
        ...product.toObject(),
        stockStatus: product.currentStock <= 0 ? 'out_of_stock' :
                     product.currentStock <= product.minStockLevel ? 'low_stock' :
                     product.currentStock >= product.maxStockLevel ? 'overstock' : 'in_stock'
      },
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount
      }
    });
  } catch (error) {
    console.error('Reorder product error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/inventory/trigger-auto-reorder
// @desc    Manually trigger automatic reorder for low stock products
// @access  Private
router.post('/trigger-auto-reorder', auth, async (req, res) => {
  try {
    const stockService = require('../services/stockService');
    await stockService.checkAndAutoReorder();
    
    res.json({
      message: 'Automatic reorder check triggered successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Trigger auto-reorder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/inventory/reorder-multiple
// @desc    Reorder multiple low stock products at once
// @access  Private
router.post('/reorder-multiple', auth, async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }

    const results = [];
    const errors = [];

    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
          errors.push({ productId, error: 'Product not found or inactive' });
          continue;
        }

        // Check if reordering would exceed maximum stock level
        const newStockLevel = product.currentStock + product.reorderQuantity;
        if (newStockLevel > product.maxStockLevel) {
          errors.push({ 
            productId, 
            error: `Cannot reorder. Adding ${product.reorderQuantity} units would exceed the maximum stock level of ${product.maxStockLevel}. Current stock: ${product.currentStock}`,
            currentStock: product.currentStock,
            maxStockLevel: product.maxStockLevel,
            requestedQuantity: product.reorderQuantity,
            maxAllowedQuantity: product.maxStockLevel - product.currentStock
          });
          continue;
        }

        // Create order for the product
        const orderItems = [{
          product: product._id,
          quantity: product.reorderQuantity,
          unitPrice: product.costPrice,
          totalPrice: product.reorderQuantity * product.costPrice
        }];

        const order = new Order({
          products: orderItems,
          business: product.business,
          status: 'confirmed',
          orderType: 'manual',
          supplier: product.supplier,
          expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          createdBy: req.user.id,
          notes: `Bulk reorder for ${product.name} - Low stock alert triggered`
        });

        await order.save();

        // Restock the product
        product.currentStock += product.reorderQuantity;
        product.lastRestocked = new Date();
        await product.save();

        results.push({
          productId: product._id,
          productName: product.name,
          orderId: order._id,
          orderNumber: order.orderNumber,
          quantity: product.reorderQuantity
        });
      } catch (error) {
        console.error(`Error reordering product ${productId}:`, error);
        errors.push({ productId, error: error.message });
      }
    }

    // Create notification for bulk reorder
    if (results.length > 0) {
      const notification = new Notification({
        recipient: req.user.id,
        business: req.user.currentBusiness || (results[0] && results[0].productId ? (await Product.findById(results[0].productId)).business : undefined),
        type: 'system_alert',
        title: 'Bulk Reorder Completed',
        message: `${results.length} products have been reordered and restocked`,
        data: {
          reorderedProducts: results,
          totalProducts: results.length
        }
      });

      await notification.save();

      // Emit real-time update
      req.io.emit('newNotification', {
        userId: req.user.id,
        notification: notification
      });
    }

    res.json({
      message: `Bulk reorder completed: ${results.length} products reordered`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk reorder error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
