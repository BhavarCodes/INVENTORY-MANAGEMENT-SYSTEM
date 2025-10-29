const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const stockService = require('../services/stockService');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await stockService.checkLowStock();
    console.log('Low stock check run complete.');
  } catch (e) {
    console.error('Error running low stock check:', e);
  } finally {
    await mongoose.disconnect();
  }
}

main();


