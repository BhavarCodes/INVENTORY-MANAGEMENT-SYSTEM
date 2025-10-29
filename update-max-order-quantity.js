const mongoose = require('mongoose');
const Product = require('./backend/models/Product');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery_inventory', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Add maxOrderQuantity to existing products
const updateExistingProducts = async () => {
  try {
    await connectDB();
    
    // Update all products that don't have maxOrderQuantity field
    const result = await Product.updateMany(
      { maxOrderQuantity: { $exists: false } },
      { $set: { maxOrderQuantity: 1000 } }
    );
    
    console.log(`Updated ${result.modifiedCount} products with default maxOrderQuantity of 1000`);
    
    // Also ensure all existing products have the field set to at least 1
    const result2 = await Product.updateMany(
      { $or: [{ maxOrderQuantity: { $lt: 1 } }, { maxOrderQuantity: null }] },
      { $set: { maxOrderQuantity: 1000 } }
    );
    
    console.log(`Fixed ${result2.modifiedCount} products with invalid maxOrderQuantity values`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error);
    process.exit(1);
  }
};

updateExistingProducts();