const mongoose = require('mongoose');
const Order = require('./backend/models/Order');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery_inventory');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Add payment fields to existing orders
const updateExistingOrders = async () => {
  try {
    await connectDB();
    
    // Update all orders that don't have payment fields
    const result = await Order.updateMany(
      { 
        paymentStatus: { $exists: false }
      },
      { 
        $set: { 
          paymentStatus: 'pending',
          paymentAmount: 0
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} orders with payment fields`);
    
    // Update paymentAmount for orders that have totalAmount but no paymentAmount
    const result2 = await Order.updateMany(
      { 
        paymentAmount: { $exists: false },
        totalAmount: { $exists: true }
      },
      [
        {
          $set: {
            paymentAmount: "$totalAmount"
          }
        }
      ]
    );
    
    console.log(`Updated ${result2.modifiedCount} orders with paymentAmount from totalAmount`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating orders:', error);
    process.exit(1);
  }
};

updateExistingOrders();