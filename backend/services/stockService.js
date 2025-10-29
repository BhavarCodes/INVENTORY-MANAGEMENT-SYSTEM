const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const notificationService = require('./notificationService');

// Check for low stock products and send notifications
const checkLowStock = async () => {
  try {
    console.log('Checking for low stock products...');
    
    // Get all active products
    const products = await Product.find({ isActive: true });
    const users = await User.find({ isActive: true });

    if (users.length === 0) {
      console.log('No active users found for notifications');
      return;
    }

    // Notify users for products in their business
    for (const product of products) {
      if (product.currentStock <= 0) {
        console.log(`Product ${product.name} is out of stock`);
        // Find users from the same business as the product
        const businessUsers = users.filter(user => 
          user.currentBusiness && user.currentBusiness.toString() === product.business.toString()
        );
        for (const recipient of businessUsers) {
          await notificationService.sendOutOfStockNotification(product, recipient);
        }
      } else if (product.currentStock <= product.minStockLevel) {
        console.log(`Product ${product.name} is low on stock`);
        // Find users from the same business as the product
        const businessUsers = users.filter(user => 
          user.currentBusiness && user.currentBusiness.toString() === product.business.toString()
        );
        for (const recipient of businessUsers) {
          await notificationService.sendLowStockNotification(product, recipient);
        }
      }
    }

    console.log('Low stock check completed');
  } catch (error) {
    console.error('Low stock check error:', error);
  }
};

// Real-time check for low stock and auto-reorder
const checkAndAutoReorder = async () => {
  try {
    console.log('Running real-time low stock check and auto-reorder...');
    
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      isActive: true
    });

    if (lowStockProducts.length === 0) {
      console.log('No low stock products found for auto-reorder');
      return;
    }

    const users = await User.find({ isActive: true });
    if (users.length === 0) {
      console.log('No active users found for auto-reorder');
      return;
    }

    // Process each low stock product individually for immediate action
    for (const product of lowStockProducts) {
      try {
        // Find a user from the same business as the product
        const businessUsers = users.filter(user => 
          user.currentBusiness && user.currentBusiness.toString() === product.business.toString()
        );
        
        if (businessUsers.length === 0) {
          console.log(`No users found for business of product ${product.name}`);
          continue;
        }
        
        const owner = businessUsers[0]; // Use first user from the business
        
        // Create individual order for this product
        const orderItems = [{
          product: product._id,
          quantity: product.reorderQuantity,
          unitPrice: product.costPrice,
          totalPrice: product.reorderQuantity * product.costPrice
        }];

      const order = new Order({
        products: orderItems,
        business: product.business,
        status: 'pending', // Keep as pending until payment
        paymentStatus: 'pending', // Set payment status
        orderType: 'automatic',
        supplier: product.supplier,
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdBy: owner._id,
        notes: `Auto-reorder for ${product.name} - Low stock alert triggered`
      });

      await order.save();

      console.log(`Auto-created order for ${product.name} - Payment pending`);

      // Create payment pending notification
      await notificationService.createNotification(
        'Payment Pending - Auto Order',
        `Auto order ${order.orderNumber} created for low stock "${product.name}". Payment of ₹${order.totalAmount} is pending.`,
        'payment_pending',
        'high',
        owner._id,
        {
          productId: product._id,
          productName: product.name,
          orderId: order._id,
          orderNumber: order.orderNumber,
          quantity: product.reorderQuantity,
          amount: order.totalAmount,
          requiresPayment: true
        },
        product.business
      );      } catch (error) {
        console.error(`Error auto-reordering product ${product.name}:`, error);
      }
    }

    console.log('Real-time auto-reorder check completed');
  } catch (error) {
    console.error('Real-time auto-reorder error:', error);
  }
};

// Automatically create orders and restock low stock products
const autoRenewStock = async () => {
  try {
    console.log('Running automatic stock renewal...');
    
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      isActive: true
    });

    if (lowStockProducts.length === 0) {
      console.log('No low stock products found for auto-renewal');
      return;
    }

    const users = await User.find({ isActive: true });
    if (users.length === 0) {
      console.log('No active users found for auto-renewal');
      return;
    }

    // Group products by supplier and business
    const supplierGroups = {};
    
    for (const product of lowStockProducts) {
      const supplierEmail = product.supplier.email;
      const businessId = product.business.toString();
      const groupKey = `${supplierEmail}_${businessId}`;
      
      if (!supplierGroups[groupKey]) {
        supplierGroups[groupKey] = {
          supplier: product.supplier,
          business: product.business,
          products: []
        };
      }
      
      supplierGroups[groupKey].products.push({
        product: product._id,
        quantity: product.reorderQuantity,
        unitPrice: product.costPrice,
        totalPrice: product.costPrice * product.reorderQuantity
      });
    }

    // Create orders for each supplier and immediately restock
    for (const [groupKey, group] of Object.entries(supplierGroups)) {
      const totalAmount = group.products.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Find a user from the same business
      const businessUsers = users.filter(user => 
        user.currentBusiness && user.currentBusiness.toString() === group.business.toString()
      );
      
      if (businessUsers.length === 0) {
        console.log(`No users found for business in group ${groupKey}`);
        continue;
      }
      
      const owner = businessUsers[0];
      
      const order = new Order({
        products: group.products,
        business: group.business,
        totalAmount,
        supplier: group.supplier,
        createdBy: owner._id,
        orderType: 'automatic',
        status: 'pending', // Keep as pending until payment
        paymentStatus: 'pending', // Set payment status
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        notes: 'Automatically generated order for low stock items - Payment pending'
      });

      await order.save();
      console.log(`Created automatic order ${order.orderNumber} for supplier ${group.supplier.email} - Payment pending`);

      // Create payment pending notification for owner
      await notificationService.createNotification(
        'Payment Pending - Auto Order',
        `Auto order ${order.orderNumber} created for ${group.products.length} low stock items. Total payment of ₹${totalAmount} is pending.`,
        'payment_pending',
        'high',
        owner._id,
        { 
          orderId: order._id, 
          orderNumber: order.orderNumber, 
          productCount: group.products.length,
          amount: totalAmount,
          requiresPayment: true
        },
        group.business
      );
    }

    console.log('Automatic stock renewal and restocking completed');
  } catch (error) {
    console.error('Auto stock renewal error:', error);
  }
};

// Update product stock after delivery
const updateStockAfterDelivery = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('products.product');
    
    if (!order) {
      throw new Error('Order not found');
    }

    for (const item of order.products) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { 
          $inc: { currentStock: item.quantity },
          lastRestocked: new Date()
        }
      );
    }

    console.log(`Stock updated for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Update stock after delivery error:', error);
  }
};

// Get stock analytics
const getStockAnalytics = async () => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      isActive: true
    });
    const outOfStockProducts = await Product.countDocuments({
      currentStock: { $lte: 0 },
      isActive: true
    });

    const totalInventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      { $project: { currentStock: 1, costPrice: { $ifNull: ['$costPrice', 0] } } },
      { $group: { 
        _id: null, 
        totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
        totalItems: { $sum: '$currentStock' }
      }}
    ]);

    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalStock: { $sum: '$currentStock' },
        totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
        lowStockCount: {
          $sum: {
            $cond: [
              { $lte: ['$currentStock', '$minStockLevel'] },
              1,
              0
            ]
          }
        }
      }},
      { $sort: { count: -1 } }
    ]);

    return {
      overview: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue: totalInventoryValue[0]?.totalValue || 0,
        totalItems: totalInventoryValue[0]?.totalItems || 0
      },
      categoryStats
    };
  } catch (error) {
    console.error('Get stock analytics error:', error);
    throw error;
  }
};

// Get products that need reordering
const getProductsNeedingReorder = async () => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      isActive: true
    }).sort({ currentStock: 1 });

    return products.map(product => ({
      ...product.toObject(),
      stockStatus: product.currentStock <= 0 ? 'out_of_stock' : 'low_stock',
      suggestedReorderQuantity: product.reorderQuantity,
      estimatedCost: product.costPrice * product.reorderQuantity
    }));
  } catch (error) {
    console.error('Get products needing reorder error:', error);
    throw error;
  }
};

module.exports = {
  checkLowStock,
  checkAndAutoReorder,
  autoRenewStock,
  updateStockAfterDelivery,
  getStockAnalytics,
  getProductsNeedingReorder
};
