require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const result = await Product.updateMany(
    {},
    [{ $set: { maxOrderQuantity: '$maxStockLevel' } }]
  );

  console.log(`Updated ${result.modifiedCount || result.nModified || 0} products`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
