const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Product = require('./backend/models/Product');
const Business = require('./backend/models/Business');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample grocery products data
const groceryProducts = [
  {
    name: 'Organic Bananas',
    description: 'Fresh organic bananas, perfect for smoothies or snacking',
    category: 'fruits',
    sku: 'FR-BAN-001',
    barcode: '8901234567890',
    currentStock: 50,
    minStockLevel: 10,
    maxStockLevel: 100,
    unit: 'kg',
    costPrice: 1.20,
    sellingPrice: 1.99,
    supplier: {
      name: 'Organic Farms Inc.',
      email: 'orders@organicfarms.com',
      phone: '555-123-4567',
      address: {
        street: '123 Farm Road',
        city: 'Farmville',
        state: 'CA',
        zipCode: '95123',
        country: 'USA'
      }
    },
    reorderQuantity: 30,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224'
  },
  {
    name: 'Whole Milk',
    description: 'Fresh whole milk, pasteurized and homogenized',
    category: 'dairy',
    sku: 'DA-MLK-001',
    barcode: '8901234567891',
    currentStock: 30,
    minStockLevel: 5,
    maxStockLevel: 50,
    unit: 'liter',
    costPrice: 0.85,
    sellingPrice: 1.49,
    supplier: {
      name: 'Happy Cow Dairy',
      email: 'orders@happycow.com',
      phone: '555-987-6543',
      address: {
        street: '456 Dairy Lane',
        city: 'Milktown',
        state: 'WI',
        zipCode: '53001',
        country: 'USA'
      }
    },
    reorderQuantity: 20,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b'
  },
  {
    name: 'Whole Wheat Bread',
    description: 'Freshly baked whole wheat bread',
    category: 'bakery',
    sku: 'BK-BRD-001',
    barcode: '8901234567892',
    currentStock: 25,
    minStockLevel: 5,
    maxStockLevel: 40,
    unit: 'piece',
    costPrice: 1.50,
    sellingPrice: 2.99,
    supplier: {
      name: 'Sunshine Bakery',
      email: 'orders@sunshinebakery.com',
      phone: '555-456-7890',
      address: {
        street: '789 Baker Street',
        city: 'Breadville',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    },
    reorderQuantity: 15,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff'
  },
  {
    name: 'Fresh Spinach',
    description: 'Organic baby spinach leaves',
    category: 'vegetables',
    sku: 'VG-SPN-001',
    barcode: '8901234567893',
    currentStock: 20,
    minStockLevel: 5,
    maxStockLevel: 30,
    unit: 'bag',
    costPrice: 1.25,
    sellingPrice: 2.49,
    supplier: {
      name: 'Green Fields Produce',
      email: 'orders@greenfields.com',
      phone: '555-789-0123',
      address: {
        street: '101 Veggie Way',
        city: 'Greenville',
        state: 'OR',
        zipCode: '97401',
        country: 'USA'
      }
    },
    reorderQuantity: 15,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb'
  },
  {
    name: 'Chicken Breast',
    description: 'Boneless, skinless chicken breast',
    category: 'meat',
    sku: 'MT-CHK-001',
    barcode: '8901234567894',
    currentStock: 15,
    minStockLevel: 3,
    maxStockLevel: 25,
    unit: 'kg',
    costPrice: 4.50,
    sellingPrice: 7.99,
    supplier: {
      name: 'Family Farm Meats',
      email: 'orders@familyfarm.com',
      phone: '555-234-5678',
      address: {
        street: '202 Ranch Road',
        city: 'Meatville',
        state: 'TX',
        zipCode: '75001',
        country: 'USA'
      }
    },
    reorderQuantity: 10,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791'
  },
  {
    name: 'Canned Tomatoes',
    description: 'Diced tomatoes in tomato juice',
    category: 'canned',
    sku: 'CN-TOM-001',
    barcode: '8901234567895',
    currentStock: 40,
    minStockLevel: 10,
    maxStockLevel: 60,
    unit: 'can',
    costPrice: 0.75,
    sellingPrice: 1.29,
    supplier: {
      name: 'Pantry Essentials',
      email: 'orders@pantryessentials.com',
      phone: '555-345-6789',
      address: {
        street: '303 Canning Ave',
        city: 'Canville',
        state: 'IL',
        zipCode: '60007',
        country: 'USA'
      }
    },
    reorderQuantity: 24,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da'
  },
  {
    name: 'Orange Juice',
    description: 'Fresh squeezed orange juice, not from concentrate',
    category: 'beverages',
    sku: 'BV-OJ-001',
    barcode: '8901234567896',
    currentStock: 25,
    minStockLevel: 5,
    maxStockLevel: 40,
    unit: 'bottle',
    costPrice: 2.00,
    sellingPrice: 3.49,
    supplier: {
      name: 'Citrus Grove',
      email: 'orders@citrusgrove.com',
      phone: '555-456-7890',
      address: {
        street: '404 Orange Blvd',
        city: 'Orangeville',
        state: 'FL',
        zipCode: '32801',
        country: 'USA'
      }
    },
    reorderQuantity: 15,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba'
  },
  {
    name: 'Potato Chips',
    description: 'Classic salted potato chips',
    category: 'snacks',
    sku: 'SN-CHP-001',
    barcode: '8901234567897',
    currentStock: 35,
    minStockLevel: 10,
    maxStockLevel: 50,
    unit: 'bag',
    costPrice: 1.00,
    sellingPrice: 1.99,
    supplier: {
      name: 'Snack Masters',
      email: 'orders@snackmasters.com',
      phone: '555-567-8901',
      address: {
        street: '505 Snack Street',
        city: 'Munchville',
        state: 'PA',
        zipCode: '19001',
        country: 'USA'
      }
    },
    reorderQuantity: 20,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b'
  },
  {
    name: 'Frozen Pizza',
    description: 'Pepperoni and cheese frozen pizza',
    category: 'frozen',
    sku: 'FZ-PIZ-001',
    barcode: '8901234567898',
    currentStock: 20,
    minStockLevel: 5,
    maxStockLevel: 30,
    unit: 'box',
    costPrice: 3.50,
    sellingPrice: 5.99,
    supplier: {
      name: 'Frozen Delights',
      email: 'orders@frozendelights.com',
      phone: '555-678-9012',
      address: {
        street: '606 Freezer Lane',
        city: 'Frostville',
        state: 'MN',
        zipCode: '55401',
        country: 'USA'
      }
    },
    reorderQuantity: 15,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591'
  },
  {
    name: 'Rice',
    description: 'Long grain white rice',
    category: 'pantry',
    sku: 'PN-RIC-001',
    barcode: '8901234567899',
    currentStock: 45,
    minStockLevel: 10,
    maxStockLevel: 60,
    unit: 'bag',
    costPrice: 2.25,
    sellingPrice: 3.99,
    supplier: {
      name: 'Global Grains',
      email: 'orders@globalgrains.com',
      phone: '555-789-0123',
      address: {
        street: '707 Grain Road',
        city: 'Riceville',
        state: 'AR',
        zipCode: '72201',
        country: 'USA'
      }
    },
    reorderQuantity: 20,
    isActive: true,
    lastRestocked: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
  }
];

async function addGroceryProducts() {
  try {
    // Find the first business to associate products with
    const business = await Business.findOne();
    
    if (!business) {
      console.error('No business found. Please create a business first.');
      process.exit(1);
    }
    
    console.log(`Adding products to business: ${business.name}`);
    
    // Add business ID to each product
    const productsWithBusiness = groceryProducts.map(product => ({
      ...product,
      business: business._id
    }));
    
    // Delete existing products for this business (optional)
    await Product.deleteMany({ business: business._id });
    
    // Insert all products
    const result = await Product.insertMany(productsWithBusiness);
    
    console.log(`Successfully added ${result.length} grocery products to the inventory.`);
    process.exit(0);
  } catch (error) {
    console.error('Error adding grocery products:', error);
    process.exit(1);
  }
}

// Run the function
addGroceryProducts();