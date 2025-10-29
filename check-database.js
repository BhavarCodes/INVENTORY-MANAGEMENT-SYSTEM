const mongoose = require('mongoose');
const Product = require('./backend/models/Product');
const User = require('./backend/models/User');
const Business = require('./backend/models/Business');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/grocery_inventory');
    console.log('Connected to MongoDB');

    // Check products
    console.log('\n📦 Checking Products:');
    const totalProducts = await Product.countDocuments();
    console.log(`Total products in database: ${totalProducts}`);

    const activeProducts = await Product.countDocuments({ isActive: true });
    console.log(`Active products: ${activeProducts}`);

    const productsWithBusiness = await Product.countDocuments({ business: { $exists: true, $ne: null } });
    console.log(`Products with business field: ${productsWithBusiness}`);

    const productsWithoutBusiness = await Product.countDocuments({ business: { $exists: false } });
    console.log(`Products without business field: ${productsWithoutBusiness}`);

    // Show sample products
    const sampleProducts = await Product.find().limit(3).select('name business isActive');
    console.log('\nSample products:');
    sampleProducts.forEach(product => {
      console.log(`- ${product.name} (business: ${product.business || 'none'}, active: ${product.isActive})`);
    });

    // Check users
    console.log('\n👥 Checking Users:');
    const totalUsers = await User.countDocuments();
    console.log(`Total users: ${totalUsers}`);

    const usersWithBusiness = await User.countDocuments({ currentBusiness: { $exists: true, $ne: null } });
    console.log(`Users with current business: ${usersWithBusiness}`);

    // Show sample users
    const sampleUsers = await User.find().limit(3).select('name email currentBusiness');
    console.log('\nSample users:');
    sampleUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - current business: ${user.currentBusiness || 'none'}`);
    });

    // Check businesses
    console.log('\n🏢 Checking Businesses:');
    const totalBusinesses = await Business.countDocuments();
    console.log(`Total businesses: ${totalBusinesses}`);

    const sampleBusinesses = await Business.find().limit(3).select('name owner');
    console.log('\nSample businesses:');
    sampleBusinesses.forEach(business => {
      console.log(`- ${business.name} (owner: ${business.owner})`);
    });

    console.log('\n🔍 Analysis:');
    if (productsWithoutBusiness > 0) {
      console.log('❌ Found products without business field - this is likely the issue!');
      console.log('   The inventory page filters by business, but some products have no business field.');
    } else {
      console.log('✅ All products have business field set');
    }

    if (usersWithBusiness === 0) {
      console.log('❌ No users have current business set - this could be the issue!');
      console.log('   Users need to have a current business to see products.');
    } else {
      console.log('✅ Some users have current business set');
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkDatabase();
