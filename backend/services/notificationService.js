const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email notification
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

// Create notification
const createNotification = async (title, message, type, priority, recipientId, data = {}, businessId = null) => {
  try {
    // If no businessId provided, try to get it from the recipient user
    let business = businessId;
    if (!business) {
      const User = require('../models/User');
      const user = await User.findById(recipientId);
      if (user && user.currentBusiness) {
        business = user.currentBusiness;
      }
    }

    const notification = new Notification({
      title,
      message,
      type,
      priority,
      recipient: recipientId,
      business: business,
      data
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Send low stock notification
const sendLowStockNotification = async (product, user) => {
  try {
    const title = 'Low Stock Alert';
    const message = `Product "${product.name}" (SKU: ${product.sku}) is running low. Current stock: ${product.currentStock} ${product.unit}, Minimum required: ${product.minStockLevel} ${product.unit}`;
    
    // Create in-app notification
    await createNotification(
      title,
      message,
      'low_stock',
      'high',
      user._id,
      { productId: product._id, productName: product.name, currentStock: product.currentStock, minStockLevel: product.minStockLevel },
      product.business
    );

    // Send email notification
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Low Stock Alert</h2>
        <p>Dear ${user.name},</p>
        <p>The following product is running low on stock:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>${product.name}</h3>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Current Stock:</strong> ${product.currentStock} ${product.unit}</p>
          <p><strong>Minimum Required:</strong> ${product.minStockLevel} ${product.unit}</p>
          <p><strong>Category:</strong> ${product.category}</p>
        </div>
        <p>Please consider placing an order to restock this item.</p>
        <p>Best regards,<br>Inventory Management System</p>
      </div>
    `;

    await sendEmail(user.email, title, html);
  } catch (error) {
    console.error('Send low stock notification error:', error);
  }
};

// Send out of stock notification
const sendOutOfStockNotification = async (product, user) => {
  try {
    const title = 'Out of Stock Alert';
    const message = `Product "${product.name}" (SKU: ${product.sku}) is out of stock!`;
    
    // Create in-app notification
    await createNotification(
      title,
      message,
      'out_of_stock',
      'urgent',
      user._id,
      { productId: product._id, productName: product.name, currentStock: product.currentStock },
      product.business
    );

    // Send email notification
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c0392b;">Out of Stock Alert</h2>
        <p>Dear ${user.name},</p>
        <p>The following product is now out of stock:</p>
        <div style="background-color: #fdf2f2; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #c0392b;">
          <h3>${product.name}</h3>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Current Stock:</strong> 0 ${product.unit}</p>
          <p><strong>Category:</strong> ${product.category}</p>
        </div>
        <p><strong>Action Required:</strong> Please place an urgent order to restock this item immediately.</p>
        <p>Best regards,<br>Inventory Management System</p>
      </div>
    `;

    await sendEmail(user.email, title, html);
  } catch (error) {
    console.error('Send out of stock notification error:', error);
  }
};

// Send vendor order notification
const sendVendorOrderNotification = async (order, vendorEmail) => {
  try {
    const title = 'New Order Received';
    const message = `You have received a new order: ${order.orderNumber}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">New Order Received</h2>
        <p>Dear Supplier,</p>
        <p>You have received a new order with the following details:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
          <p><strong>Expected Delivery:</strong> ${order.expectedDeliveryDate ? order.expectedDeliveryDate.toLocaleDateString() : 'Not specified'}</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6;">
          <h3>Products Ordered</h3>
          ${order.products.map(item => `
            <div style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa;">
              <p><strong>Product:</strong> ${item.product.name}</p>
              <p><strong>SKU:</strong> ${item.product.sku}</p>
              <p><strong>Quantity:</strong> ${item.quantity} ${item.product.unit}</p>
              <p><strong>Unit Price:</strong> $${item.unitPrice.toFixed(2)}</p>
              <p><strong>Total:</strong> $${item.totalPrice.toFixed(2)}</p>
            </div>
          `).join('')}
        </div>
        <p>Please process this order and provide an estimated delivery date.</p>
        <p>Best regards,<br>Inventory Management System</p>
      </div>
    `;

    await sendEmail(vendorEmail, title, html);
  } catch (error) {
    console.error('Send vendor order notification error:', error);
  }
};

// Send order delivered notification
const sendOrderDeliveredNotification = async (order, user) => {
  try {
    const title = 'Order Delivered';
    const message = `Order ${order.orderNumber} has been delivered and stock updated`;
    
    await createNotification(
      title,
      message,
      'order_delivered',
      'medium',
      user._id,
      { orderId: order._id, orderNumber: order.orderNumber },
      order.business
    );
  } catch (error) {
    console.error('Send order delivered notification error:', error);
  }
};

module.exports = {
  createNotification,
  sendEmail,
  sendLowStockNotification,
  sendOutOfStockNotification,
  sendVendorOrderNotification,
  sendOrderDeliveredNotification
};
