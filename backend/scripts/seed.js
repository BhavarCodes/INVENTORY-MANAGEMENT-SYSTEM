const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Business = require('../models/Business');

async function connect() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in environment.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

async function ensureUser() {
  // Check if the main owner account exists
  let user = await User.findOne({ email: 'owner@gmail.com' });
  
  if (!user) {
    // Create the main owner account with fixed credentials
    user = new User({
      name: 'Store Owner',
      email: 'owner@gmail.com',
      password: 'owner123',
      role: 'owner',
      phone: '+1-555-0123',
      address: {
        street: '123 Main Street',
        city: 'Your City',
        state: 'Your State',
        zipCode: '12345',
        country: 'USA'
      },
      settings: {
        notificationEmail: 'owner@gmail.com',
        lowStockThreshold: 10
      },
      isActive: true
    });
    await user.save();
    console.log('✅ Main owner account created with credentials:');
    console.log('   Email: owner@gmail.com');
    console.log('   Password: owner123');
  } else {
    console.log('✅ Main owner account already exists');
  }
  
  return user;
}

async function ensureBusiness(user) {
  // Check if the main business exists
  let business = await Business.findOne({ owner: user._id });
  
  if (!business) {
    // Create the main business
    business = new Business({
      name: 'Fresh Grocery Store',
      description: 'A modern grocery store with fresh produce and quality products',
      owner: user._id,
      businessType: 'grocery',
      address: {
        street: '123 Main Street',
        city: 'Your City',
        state: 'Your State',
        zipCode: '12345',
        country: 'USA'
      },
      contact: {
        phone: '+1-555-0123',
        email: 'info@freshgrocery.com',
        website: 'https://freshgrocery.com'
      },
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        lowStockThreshold: 10,
        notificationEmail: 'owner@gmail.com',
        autoReorder: true
      },
      subscription: {
        plan: 'premium',
        maxProducts: 1000,
        maxUsers: 10
      },
      isActive: true
    });
    await business.save();
    console.log('✅ Main business created: Fresh Grocery Store');
  } else {
    console.log('✅ Main business already exists');
  }
  // Ensure the user is linked to this business
  try {
    let updated = false;
    // Set currentBusiness if not set
    if (!user.currentBusiness) {
      user.currentBusiness = business._id;
      updated = true;
    }
    // Ensure businesses array contains this business with owner role
    const hasBusiness = (user.businesses || []).some(b => b.business && b.business.toString() === business._id.toString());
    if (!hasBusiness) {
      user.businesses = user.businesses || [];
      user.businesses.push({ business: business._id, role: 'owner', joinedAt: new Date() });
      updated = true;
    }
    if (updated) {
      await user.save();
      console.log('🔗 Linked user to business (currentBusiness set and membership ensured)');
    }
  } catch (linkErr) {
    console.warn('⚠️  Could not link user to business:', linkErr.message);
  }

  return business;
}

function buildProducts(businessId) {
  const now = Date.now();
  return [
    // Fruits
    {
      business: businessId,
      name: 'Bananas',
      description: 'Fresh ripe bananas',
      category: 'fruits',
      sku: 'BAN-' + Math.floor(now % 100000),
      barcode: '8901000' + Math.floor(Math.random() * 1000000),
      currentStock: 120,
      minStockLevel: 40,
      maxStockLevel: 250,
      unit: 'kg',
      costPrice: 0.6,
      sellingPrice: 1.2,
      supplier: { name: 'Tropical Traders', email: 'supply@tropical.test' },
      reorderQuantity: 50,
      isActive: true
    },
    {
      name: 'Apples (Red Delicious)',
      description: 'Fresh red delicious apples',
      category: 'fruits',
      sku: 'APP-' + Math.floor((now + 1) % 100000),
      barcode: '8901001' + Math.floor(Math.random() * 1000000),
      currentStock: 80,
      minStockLevel: 25,
      maxStockLevel: 150,
      unit: 'kg',
      costPrice: 1.2,
      sellingPrice: 2.4,
      supplier: { name: 'Orchard Fresh', email: 'orders@orchardfresh.test' },
      reorderQuantity: 40,
      isActive: true
    },
    {
      name: 'Oranges (Navel)',
      description: 'Sweet navel oranges',
      category: 'fruits',
      sku: 'ORG-' + Math.floor((now + 2) % 100000),
      barcode: '8901002' + Math.floor(Math.random() * 1000000),
      currentStock: 65,
      minStockLevel: 20,
      maxStockLevel: 120,
      unit: 'kg',
      costPrice: 1.0,
      sellingPrice: 2.0,
      supplier: { name: 'Citrus Grove', email: 'sales@citrusgrove.test' },
      reorderQuantity: 35,
      isActive: true
    },
    {
      name: 'Strawberries',
      description: 'Fresh organic strawberries',
      category: 'fruits',
      sku: 'STR-' + Math.floor((now + 3) % 100000),
      barcode: '8901003' + Math.floor(Math.random() * 1000000),
      currentStock: 15,
      minStockLevel: 10,
      maxStockLevel: 50,
      unit: 'kg',
      costPrice: 3.5,
      sellingPrice: 6.0,
      supplier: { name: 'Berry Farms', email: 'info@berryfarms.test' },
      reorderQuantity: 20,
      isActive: true
    },

    // Vegetables
    {
      name: 'Tomatoes',
      description: 'Fresh red tomatoes',
      category: 'vegetables',
      sku: 'TOM-' + Math.floor((now + 4) % 100000),
      barcode: '8902000' + Math.floor(Math.random() * 1000000),
      currentStock: 10,
      minStockLevel: 30,
      maxStockLevel: 200,
      unit: 'kg',
      costPrice: 0.4,
      sellingPrice: 0.9,
      supplier: { name: 'Green Farms', email: 'sales@greenfarms.test' },
      reorderQuantity: 60,
      isActive: true
    },
    {
      name: 'Carrots',
      description: 'Fresh organic carrots',
      category: 'vegetables',
      sku: 'CAR-' + Math.floor((now + 5) % 100000),
      barcode: '8902001' + Math.floor(Math.random() * 1000000),
      currentStock: 45,
      minStockLevel: 20,
      maxStockLevel: 100,
      unit: 'kg',
      costPrice: 0.8,
      sellingPrice: 1.5,
      supplier: { name: 'Root Vegetables Co', email: 'orders@rootveg.test' },
      reorderQuantity: 30,
      isActive: true
    },
    {
      name: 'Lettuce (Iceberg)',
      description: 'Crisp iceberg lettuce heads',
      category: 'vegetables',
      sku: 'LET-' + Math.floor((now + 6) % 100000),
      barcode: '8902002' + Math.floor(Math.random() * 1000000),
      currentStock: 25,
      minStockLevel: 15,
      maxStockLevel: 60,
      unit: 'piece',
      costPrice: 0.6,
      sellingPrice: 1.2,
      supplier: { name: 'Leafy Greens Ltd', email: 'supply@leafygreens.test' },
      reorderQuantity: 20,
      isActive: true
    },
    {
      name: 'Potatoes (Russet)',
      description: 'Fresh russet potatoes',
      category: 'vegetables',
      sku: 'POT-' + Math.floor((now + 7) % 100000),
      barcode: '8902003' + Math.floor(Math.random() * 1000000),
      currentStock: 200,
      minStockLevel: 50,
      maxStockLevel: 300,
      unit: 'kg',
      costPrice: 0.5,
      sellingPrice: 1.0,
      supplier: { name: 'Spud Central', email: 'orders@spudcentral.test' },
      reorderQuantity: 100,
      isActive: true
    },

    // Dairy
    {
      name: 'Whole Milk 1L',
      description: 'Dairy whole milk 1 liter pack',
      category: 'dairy',
      sku: 'MILK-' + Math.floor((now + 8) % 100000),
      barcode: '8903000' + Math.floor(Math.random() * 1000000),
      currentStock: 60,
      minStockLevel: 20,
      maxStockLevel: 150,
      unit: 'piece',
      costPrice: 0.5,
      sellingPrice: 0.9,
      supplier: { name: 'Dairy Best', email: 'orders@dairybest.test' },
      reorderQuantity: 40,
      isActive: true
    },
    {
      name: 'Cheddar Cheese (500g)',
      description: 'Aged cheddar cheese block',
      category: 'dairy',
      sku: 'CHE-' + Math.floor((now + 9) % 100000),
      barcode: '8903001' + Math.floor(Math.random() * 1000000),
      currentStock: 30,
      minStockLevel: 10,
      maxStockLevel: 80,
      unit: 'piece',
      costPrice: 2.5,
      sellingPrice: 4.5,
      supplier: { name: 'Cheese Masters', email: 'sales@cheesemasters.test' },
      reorderQuantity: 20,
      isActive: true
    },
    {
      name: 'Greek Yogurt (500g)',
      description: 'Creamy Greek yogurt',
      category: 'dairy',
      sku: 'YOG-' + Math.floor((now + 10) % 100000),
      barcode: '8903002' + Math.floor(Math.random() * 1000000),
      currentStock: 40,
      minStockLevel: 15,
      maxStockLevel: 100,
      unit: 'piece',
      costPrice: 1.8,
      sellingPrice: 3.2,
      supplier: { name: 'Yogurt Delights', email: 'orders@yogurtdelights.test' },
      reorderQuantity: 25,
      isActive: true
    },
    {
      name: 'Butter (250g)',
      description: 'Unsalted butter',
      category: 'dairy',
      sku: 'BUT-' + Math.floor((now + 11) % 100000),
      barcode: '8903003' + Math.floor(Math.random() * 1000000),
      currentStock: 35,
      minStockLevel: 12,
      maxStockLevel: 70,
      unit: 'piece',
      costPrice: 1.2,
      sellingPrice: 2.1,
      supplier: { name: 'Creamy Corner', email: 'supply@creamycorner.test' },
      reorderQuantity: 20,
      isActive: true
    },

    // Bakery
    {
      name: 'Brown Bread',
      description: 'Freshly baked brown bread',
      category: 'bakery',
      sku: 'BREAD-' + Math.floor((now + 12) % 100000),
      barcode: '8904000' + Math.floor(Math.random() * 1000000),
      currentStock: 25,
      minStockLevel: 15,
      maxStockLevel: 80,
      unit: 'piece',
      costPrice: 0.7,
      sellingPrice: 1.4,
      supplier: { name: 'Bake House', email: 'hello@bakehouse.test' },
      reorderQuantity: 30,
      isActive: true
    },
    {
      name: 'Croissants (6-pack)',
      description: 'Fresh buttery croissants',
      category: 'bakery',
      sku: 'CRO-' + Math.floor((now + 13) % 100000),
      barcode: '8904001' + Math.floor(Math.random() * 1000000),
      currentStock: 20,
      minStockLevel: 8,
      maxStockLevel: 50,
      unit: 'piece',
      costPrice: 2.0,
      sellingPrice: 3.5,
      supplier: { name: 'French Bakery', email: 'orders@frenchbakery.test' },
      reorderQuantity: 15,
      isActive: true
    },
    {
      name: 'Bagels (6-pack)',
      description: 'Fresh everything bagels',
      category: 'bakery',
      sku: 'BAG-' + Math.floor((now + 14) % 100000),
      barcode: '8904002' + Math.floor(Math.random() * 1000000),
      currentStock: 18,
      minStockLevel: 10,
      maxStockLevel: 40,
      unit: 'piece',
      costPrice: 1.5,
      sellingPrice: 2.8,
      supplier: { name: 'Bagel Central', email: 'supply@bagelcentral.test' },
      reorderQuantity: 12,
      isActive: true
    },

    // Meat & Seafood
    {
      name: 'Chicken Breast (1kg)',
      description: 'Fresh boneless chicken breast',
      category: 'meat',
      sku: 'CHK-' + Math.floor((now + 15) % 100000),
      barcode: '8905000' + Math.floor(Math.random() * 1000000),
      currentStock: 15,
      minStockLevel: 8,
      maxStockLevel: 40,
      unit: 'kg',
      costPrice: 4.5,
      sellingPrice: 7.5,
      supplier: { name: 'Fresh Poultry Co', email: 'orders@freshpoultry.test' },
      reorderQuantity: 20,
      isActive: true
    },
    {
      name: 'Salmon Fillet (500g)',
      description: 'Fresh Atlantic salmon fillet',
      category: 'seafood',
      sku: 'SAL-' + Math.floor((now + 16) % 100000),
      barcode: '8905001' + Math.floor(Math.random() * 1000000),
      currentStock: 8,
      minStockLevel: 5,
      maxStockLevel: 25,
      unit: 'kg',
      costPrice: 8.0,
      sellingPrice: 12.0,
      supplier: { name: 'Ocean Fresh', email: 'sales@oceanfresh.test' },
      reorderQuantity: 10,
      isActive: true
    },
    {
      name: 'Ground Beef (1kg)',
      description: 'Fresh ground beef 80/20',
      category: 'meat',
      sku: 'BEEF-' + Math.floor((now + 17) % 100000),
      barcode: '8905002' + Math.floor(Math.random() * 1000000),
      currentStock: 12,
      minStockLevel: 6,
      maxStockLevel: 30,
      unit: 'kg',
      costPrice: 5.0,
      sellingPrice: 8.5,
      supplier: { name: 'Prime Meats', email: 'orders@primemeats.test' },
      reorderQuantity: 15,
      isActive: true
    },

    // Pantry Staples
    {
      name: 'Rice (5kg)',
      description: 'Long grain white rice',
      category: 'pantry',
      sku: 'RICE-' + Math.floor((now + 18) % 100000),
      barcode: '8906000' + Math.floor(Math.random() * 1000000),
      currentStock: 50,
      minStockLevel: 20,
      maxStockLevel: 100,
      unit: 'piece',
      costPrice: 3.0,
      sellingPrice: 5.5,
      supplier: { name: 'Grain Depot', email: 'supply@graindepot.test' },
      reorderQuantity: 30,
      isActive: true
    },
    {
      name: 'Pasta (500g)',
      description: 'Spaghetti pasta',
      category: 'pantry',
      sku: 'PAS-' + Math.floor((now + 19) % 100000),
      barcode: '8906001' + Math.floor(Math.random() * 1000000),
      currentStock: 35,
      minStockLevel: 15,
      maxStockLevel: 80,
      unit: 'piece',
      costPrice: 0.8,
      sellingPrice: 1.5,
      supplier: { name: 'Pasta Palace', email: 'orders@pastapalace.test' },
      reorderQuantity: 25,
      isActive: true
    },
    {
      name: 'Olive Oil (500ml)',
      description: 'Extra virgin olive oil',
      category: 'pantry',
      sku: 'OIL-' + Math.floor((now + 20) % 100000),
      barcode: '8906002' + Math.floor(Math.random() * 1000000),
      currentStock: 25,
      minStockLevel: 10,
      maxStockLevel: 60,
      unit: 'piece',
      costPrice: 2.5,
      sellingPrice: 4.2,
      supplier: { name: 'Mediterranean Imports', email: 'sales@medimports.test' },
      reorderQuantity: 20,
      isActive: true
    },

    // Beverages
    {
      name: 'Coca Cola (2L)',
      description: 'Classic Coca Cola soft drink',
      category: 'beverages',
      sku: 'COKE-' + Math.floor((now + 21) % 100000),
      barcode: '8907000' + Math.floor(Math.random() * 1000000),
      currentStock: 40,
      minStockLevel: 15,
      maxStockLevel: 100,
      unit: 'piece',
      costPrice: 1.2,
      sellingPrice: 2.0,
      supplier: { name: 'Beverage Central', email: 'orders@beveragecentral.test' },
      reorderQuantity: 30,
      isActive: true
    },
    {
      name: 'Orange Juice (1L)',
      description: 'Fresh squeezed orange juice',
      category: 'beverages',
      sku: 'OJUICE-' + Math.floor((now + 22) % 100000),
      barcode: '8907001' + Math.floor(Math.random() * 1000000),
      currentStock: 30,
      minStockLevel: 12,
      maxStockLevel: 60,
      unit: 'piece',
      costPrice: 1.8,
      sellingPrice: 3.2,
      supplier: { name: 'Juice Masters', email: 'supply@juicemasters.test' },
      reorderQuantity: 20,
      isActive: true
    },
    {
      name: 'Coffee Beans (500g)',
      description: 'Premium arabica coffee beans',
      category: 'beverages',
      sku: 'COFFEE-' + Math.floor((now + 23) % 100000),
      barcode: '8907002' + Math.floor(Math.random() * 1000000),
      currentStock: 20,
      minStockLevel: 8,
      maxStockLevel: 50,
      unit: 'piece',
      costPrice: 4.5,
      sellingPrice: 8.0,
      supplier: { name: 'Coffee Roasters', email: 'sales@coffeeroasters.test' },
      reorderQuantity: 15,
      isActive: true
    },

    // Snacks
    {
      name: 'Potato Chips (150g)',
      description: 'Classic salted potato chips',
      category: 'snacks',
      sku: 'CHIPS-' + Math.floor((now + 24) % 100000),
      barcode: '8908000' + Math.floor(Math.random() * 1000000),
      currentStock: 60,
      minStockLevel: 20,
      maxStockLevel: 120,
      unit: 'piece',
      costPrice: 0.8,
      sellingPrice: 1.5,
      supplier: { name: 'Snack Central', email: 'orders@snackcentral.test' },
      reorderQuantity: 40,
      isActive: true
    },
    {
      name: 'Chocolate Cookies (200g)',
      description: 'Soft chocolate chip cookies',
      category: 'snacks',
      sku: 'COOKIES-' + Math.floor((now + 25) % 100000),
      barcode: '8908001' + Math.floor(Math.random() * 1000000),
      currentStock: 35,
      minStockLevel: 15,
      maxStockLevel: 80,
      unit: 'piece',
      costPrice: 1.5,
      sellingPrice: 2.8,
      supplier: { name: 'Sweet Treats', email: 'supply@sweettreats.test' },
      reorderQuantity: 25,
      isActive: true
    },
    {
      name: 'Mixed Nuts (300g)',
      description: 'Premium mixed nuts blend',
      category: 'snacks',
      sku: 'NUTS-' + Math.floor((now + 26) % 100000),
      barcode: '8908002' + Math.floor(Math.random() * 1000000),
      currentStock: 25,
      minStockLevel: 10,
      maxStockLevel: 60,
      unit: 'piece',
      costPrice: 3.2,
      sellingPrice: 5.5,
      supplier: { name: 'Nut Masters', email: 'sales@nutmasters.test' },
      reorderQuantity: 20,
      isActive: true
    },

    // Canned Goods
    {
      name: 'Tomato Soup (400g)',
      description: 'Creamy tomato soup',
      category: 'canned',
      sku: 'SOUP-' + Math.floor((now + 27) % 100000),
      barcode: '8909000' + Math.floor(Math.random() * 1000000),
      currentStock: 45,
      minStockLevel: 20,
      maxStockLevel: 100,
      unit: 'piece',
      costPrice: 1.0,
      sellingPrice: 1.8,
      supplier: { name: 'Canned Goods Co', email: 'orders@cannedgoods.test' },
      reorderQuantity: 30,
      isActive: true
    },
    {
      name: 'Tuna in Water (185g)',
      description: 'Premium tuna in water',
      category: 'canned',
      sku: 'TUNA-' + Math.floor((now + 28) % 100000),
      barcode: '8909001' + Math.floor(Math.random() * 1000000),
      currentStock: 30,
      minStockLevel: 12,
      maxStockLevel: 70,
      unit: 'piece',
      costPrice: 1.5,
      sellingPrice: 2.5,
      supplier: { name: 'Ocean Harvest', email: 'supply@oceanharvest.test' },
      reorderQuantity: 20,
      isActive: true
    },
    {
      name: 'Baked Beans (400g)',
      description: 'Heinz baked beans in tomato sauce',
      category: 'canned',
      sku: 'BEANS-' + Math.floor((now + 29) % 100000),
      barcode: '8909002' + Math.floor(Math.random() * 1000000),
      currentStock: 40,
      minStockLevel: 15,
      maxStockLevel: 80,
      unit: 'piece',
      costPrice: 0.9,
      sellingPrice: 1.6,
      supplier: { name: 'Bean Masters', email: 'sales@beanmasters.test' },
      reorderQuantity: 25,
      isActive: true
    },

    // Frozen Foods
    {
      name: 'Frozen Pizza (Margherita)',
      description: 'Frozen margherita pizza',
      category: 'frozen',
      sku: 'PIZZA-' + Math.floor((now + 30) % 100000),
      barcode: '8910000' + Math.floor(Math.random() * 1000000),
      currentStock: 25,
      minStockLevel: 10,
      maxStockLevel: 60,
      unit: 'piece',
      costPrice: 2.5,
      sellingPrice: 4.5,
      supplier: { name: 'Frozen Foods Ltd', email: 'orders@frozenfoods.test' },
      reorderQuantity: 20,
      isActive: true
    },
    {
      name: 'Frozen Vegetables Mix (500g)',
      description: 'Mixed frozen vegetables',
      category: 'frozen',
      sku: 'FVEG-' + Math.floor((now + 31) % 100000),
      barcode: '8910001' + Math.floor(Math.random() * 1000000),
      currentStock: 35,
      minStockLevel: 15,
      maxStockLevel: 80,
      unit: 'piece',
      costPrice: 1.2,
      sellingPrice: 2.2,
      supplier: { name: 'Frozen Garden', email: 'supply@frozengarden.test' },
      reorderQuantity: 25,
      isActive: true
    },
    {
      name: 'Ice Cream (Vanilla 1L)',
      description: 'Premium vanilla ice cream',
      category: 'frozen',
      sku: 'ICE-' + Math.floor((now + 32) % 100000),
      barcode: '8910002' + Math.floor(Math.random() * 1000000),
      currentStock: 20,
      minStockLevel: 8,
      maxStockLevel: 50,
      unit: 'piece',
      costPrice: 2.8,
      sellingPrice: 4.8,
      supplier: { name: 'Creamy Delights', email: 'sales@creamy.test' },
      reorderQuantity: 15,
      isActive: true
    },

    // Additional Low Stock Items for Testing
    {
      name: 'Grapes (Red)',
      description: 'Fresh red seedless grapes',
      category: 'fruits',
      sku: 'GRAPES-' + Math.floor((now + 33) % 100000),
      barcode: '8911000' + Math.floor(Math.random() * 1000000),
      currentStock: 5, // Low stock
      minStockLevel: 15,
      maxStockLevel: 40,
      unit: 'kg',
      costPrice: 2.5,
      sellingPrice: 4.5,
      supplier: { name: 'Vineyard Fresh', email: 'orders@vineyard.test' },
      reorderQuantity: 20,
      isActive: true
    },
    {
      name: 'Spinach (Fresh)',
      description: 'Fresh organic spinach leaves',
      category: 'vegetables',
      sku: 'SPINACH-' + Math.floor((now + 34) % 100000),
      barcode: '8911001' + Math.floor(Math.random() * 1000000),
      currentStock: 3, // Very low stock
      minStockLevel: 10,
      maxStockLevel: 30,
      unit: 'kg',
      costPrice: 1.8,
      sellingPrice: 3.2,
      supplier: { name: 'Green Leaf Co', email: 'supply@greenleaf.test' },
      reorderQuantity: 15,
      isActive: true
    },
    {
      name: 'Eggs (Free Range)',
      description: 'Fresh free range eggs',
      category: 'dairy',
      sku: 'EGGS-' + Math.floor((now + 35) % 100000),
      barcode: '8911002' + Math.floor(Math.random() * 1000000),
      currentStock: 0, // Out of stock
      minStockLevel: 20,
      maxStockLevel: 100,
      unit: 'dozen',
      costPrice: 2.0,
      sellingPrice: 3.5,
      supplier: { name: 'Farm Fresh Eggs', email: 'orders@farmfresh.test' },
      reorderQuantity: 30,
      isActive: true
    }
  ];
}

async function seed() {
  await connect();

  try {
    const user = await ensureUser();
    const business = await ensureBusiness(user);

    const productsData = buildProducts(business._id);
    // Add business field to all products
    const productsWithBusiness = productsData.map(product => ({
      ...product,
      business: business._id
    }));
    const createdProducts = await Product.insertMany(productsWithBusiness);

    // Create various orders with different statuses and suppliers
    const order1Items = [
      {
        product: createdProducts[0]._id, // Bananas
        quantity: 20,
        unitPrice: createdProducts[0].costPrice,
        totalPrice: 20 * createdProducts[0].costPrice
      },
      {
        product: createdProducts[1]._id, // Apples
        quantity: 15,
        unitPrice: createdProducts[1].costPrice,
        totalPrice: 15 * createdProducts[1].costPrice
      },
      {
        product: createdProducts[2]._id, // Oranges
        quantity: 10,
        unitPrice: createdProducts[2].costPrice,
        totalPrice: 10 * createdProducts[2].costPrice
      }
    ];

    const order2Items = [
      {
        product: createdProducts[3]._id, // Strawberries
        quantity: 5,
        unitPrice: createdProducts[3].costPrice,
        totalPrice: 5 * createdProducts[3].costPrice
      },
      {
        product: createdProducts[4]._id, // Tomatoes
        quantity: 50,
        unitPrice: createdProducts[4].costPrice,
        totalPrice: 50 * createdProducts[4].costPrice
      }
    ];

    const order3Items = [
      {
        product: createdProducts[7]._id, // Potatoes
        quantity: 100,
        unitPrice: createdProducts[7].costPrice,
        totalPrice: 100 * createdProducts[7].costPrice
      },
      {
        product: createdProducts[8]._id, // Milk
        quantity: 30,
        unitPrice: createdProducts[8].costPrice,
        totalPrice: 30 * createdProducts[8].costPrice
      },
      {
        product: createdProducts[9]._id, // Cheese
        quantity: 10,
        unitPrice: createdProducts[9].costPrice,
        totalPrice: 10 * createdProducts[9].costPrice
      }
    ];

    const order4Items = [
      {
        product: createdProducts[14]._id, // Chicken Breast
        quantity: 25,
        unitPrice: createdProducts[14].costPrice,
        totalPrice: 25 * createdProducts[14].costPrice
      },
      {
        product: createdProducts[15]._id, // Salmon
        quantity: 8,
        unitPrice: createdProducts[15].costPrice,
        totalPrice: 8 * createdProducts[15].costPrice
      }
    ];

    const order5Items = [
      {
        product: createdProducts[17]._id, // Rice
        quantity: 20,
        unitPrice: createdProducts[17].costPrice,
        totalPrice: 20 * createdProducts[17].costPrice
      },
      {
        product: createdProducts[18]._id, // Pasta
        quantity: 30,
        unitPrice: createdProducts[18].costPrice,
        totalPrice: 30 * createdProducts[18].costPrice
      },
      {
        product: createdProducts[19]._id, // Olive Oil
        quantity: 15,
        unitPrice: createdProducts[19].costPrice,
        totalPrice: 15 * createdProducts[19].costPrice
      }
    ];

    // Additional orders for more variety
    const order6Items = [
      {
        product: createdProducts[20]._id, // Coca Cola
        quantity: 50,
        unitPrice: createdProducts[20].costPrice,
        totalPrice: 50 * createdProducts[20].costPrice
      },
      {
        product: createdProducts[21]._id, // Orange Juice
        quantity: 25,
        unitPrice: createdProducts[21].costPrice,
        totalPrice: 25 * createdProducts[21].costPrice
      },
      {
        product: createdProducts[22]._id, // Coffee Beans
        quantity: 10,
        unitPrice: createdProducts[22].costPrice,
        totalPrice: 10 * createdProducts[22].costPrice
      }
    ];

    const order7Items = [
      {
        product: createdProducts[23]._id, // Potato Chips
        quantity: 40,
        unitPrice: createdProducts[23].costPrice,
        totalPrice: 40 * createdProducts[23].costPrice
      },
      {
        product: createdProducts[24]._id, // Chocolate Cookies
        quantity: 20,
        unitPrice: createdProducts[24].costPrice,
        totalPrice: 20 * createdProducts[24].costPrice
      },
      {
        product: createdProducts[25]._id, // Mixed Nuts
        quantity: 15,
        unitPrice: createdProducts[25].costPrice,
        totalPrice: 15 * createdProducts[25].costPrice
      }
    ];

    const order8Items = [
      {
        product: createdProducts[26]._id, // Tomato Soup
        quantity: 30,
        unitPrice: createdProducts[26].costPrice,
        totalPrice: 30 * createdProducts[26].costPrice
      },
      {
        product: createdProducts[27]._id, // Tuna
        quantity: 25,
        unitPrice: createdProducts[27].costPrice,
        totalPrice: 25 * createdProducts[27].costPrice
      },
      {
        product: createdProducts[28]._id, // Baked Beans
        quantity: 35,
        unitPrice: createdProducts[28].costPrice,
        totalPrice: 35 * createdProducts[28].costPrice
      }
    ];

    const order9Items = [
      {
        product: createdProducts[29]._id, // Frozen Pizza
        quantity: 20,
        unitPrice: createdProducts[29].costPrice,
        totalPrice: 20 * createdProducts[29].costPrice
      },
      {
        product: createdProducts[30]._id, // Frozen Vegetables
        quantity: 30,
        unitPrice: createdProducts[30].costPrice,
        totalPrice: 30 * createdProducts[30].costPrice
      },
      {
        product: createdProducts[31]._id, // Ice Cream
        quantity: 15,
        unitPrice: createdProducts[31].costPrice,
        totalPrice: 15 * createdProducts[31].costPrice
      }
    ];

    const order10Items = [
      {
        product: createdProducts[32]._id, // Grapes (Low Stock)
        quantity: 20,
        unitPrice: createdProducts[32].costPrice,
        totalPrice: 20 * createdProducts[32].costPrice
      },
      {
        product: createdProducts[33]._id, // Spinach (Very Low Stock)
        quantity: 15,
        unitPrice: createdProducts[33].costPrice,
        totalPrice: 15 * createdProducts[33].costPrice
      },
      {
        product: createdProducts[34]._id, // Eggs (Out of Stock)
        quantity: 30,
        unitPrice: createdProducts[34].costPrice,
        totalPrice: 30 * createdProducts[34].costPrice
      }
    ];

    const orders = [
      new Order({
        business: business._id,
        products: order1Items,
        status: 'delivered',
        orderType: 'manual',
        supplier: { name: 'Tropical Traders', email: 'supply@tropical.test' },
        expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        actualDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdBy: user._id,
        notes: 'Fresh fruit delivery for weekend specials'
      }),
      new Order({
        products: order2Items,
        status: 'shipped',
        orderType: 'automatic',
        supplier: { name: 'Green Farms', email: 'sales@greenfarms.test' },
        expectedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        createdBy: user._id,
        notes: 'Auto-generated low stock order'
      }),
      new Order({
        products: order3Items,
        status: 'processing',
        orderType: 'manual',
        supplier: { name: 'Dairy Best', email: 'orders@dairybest.test' },
        expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        createdBy: user._id,
        notes: 'Weekly dairy and produce restock'
      }),
      new Order({
        products: order4Items,
        status: 'confirmed',
        orderType: 'manual',
        supplier: { name: 'Fresh Poultry Co', email: 'orders@freshpoultry.test' },
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        createdBy: user._id,
        notes: 'Premium meat order for weekend'
      }),
      new Order({
        products: order5Items,
        status: 'pending',
        orderType: 'automatic',
        supplier: { name: 'Grain Depot', email: 'supply@graindepot.test' },
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        createdBy: user._id,
        notes: 'Pantry staples restock'
      }),
      new Order({
        products: order6Items,
        status: 'delivered',
        orderType: 'manual',
        supplier: { name: 'Beverage Central', email: 'orders@beveragecentral.test' },
        expectedDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        actualDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdBy: user._id,
        notes: 'Beverage restock for summer season'
      }),
      new Order({
        products: order7Items,
        status: 'shipped',
        orderType: 'automatic',
        supplier: { name: 'Snack Central', email: 'orders@snackcentral.test' },
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        createdBy: user._id,
        notes: 'Snack inventory replenishment'
      }),
      new Order({
        products: order8Items,
        status: 'processing',
        orderType: 'manual',
        supplier: { name: 'Canned Goods Co', email: 'orders@cannedgoods.test' },
        expectedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        createdBy: user._id,
        notes: 'Canned goods bulk order'
      }),
      new Order({
        products: order9Items,
        status: 'confirmed',
        orderType: 'manual',
        supplier: { name: 'Frozen Foods Ltd', email: 'orders@frozenfoods.test' },
        expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        createdBy: user._id,
        notes: 'Frozen section restock'
      }),
      new Order({
        products: order10Items,
        status: 'pending',
        orderType: 'automatic',
        supplier: { name: 'Farm Fresh Eggs', email: 'orders@farmfresh.test' },
        expectedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        createdBy: user._id,
        notes: 'Urgent low stock items restock'
      })
    ];

    // Add business field to all orders
    const ordersWithBusiness = orders.map(order => ({
      ...order.toObject(),
      business: business._id
    }));
    
    // Use create to ensure pre('save') hooks run for orderNumber and totalAmount
    await Order.create(ordersWithBusiness);

    console.log('Seed completed:');
    console.log(`- Products created: ${createdProducts.length}`);
    console.log(`- Orders created: ${orders.length}`);
    console.log('\n📊 Product Categories:');
    console.log('  • Fruits: 5 products (including low stock items)');
    console.log('  • Vegetables: 5 products (including low stock items)');
    console.log('  • Dairy: 5 products (including out of stock items)');
    console.log('  • Bakery: 3 products');
    console.log('  • Meat & Seafood: 3 products');
    console.log('  • Pantry Staples: 3 products');
    console.log('  • Beverages: 3 products');
    console.log('  • Snacks: 3 products');
    console.log('  • Canned Goods: 3 products');
    console.log('  • Frozen Foods: 3 products');
    console.log('\n📦 Order Statuses:');
    console.log('  • Delivered: 2 orders');
    console.log('  • Shipped: 2 orders');
    console.log('  • Processing: 2 orders');
    console.log('  • Confirmed: 2 orders');
    console.log('  • Pending: 2 orders');
    console.log('\n⚠️  Low Stock Alerts:');
    console.log('  • Grapes: 5 units (below minimum of 15)');
    console.log('  • Spinach: 3 units (below minimum of 10)');
    console.log('  • Eggs: 0 units (OUT OF STOCK)');
    console.log('\n🎯 Total Inventory Value: $' + createdProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0).toFixed(2));
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();


