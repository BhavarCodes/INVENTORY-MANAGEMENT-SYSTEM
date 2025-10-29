const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Reduce timeout to 5 seconds
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define a simplified Product schema
const productSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true,
    enum: ['fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'bakery', 'pantry', 'beverages', 'snacks', 'canned', 'frozen', 'other']
  },
  sku: {
    type: String,
    required: true
  },
  barcode: String,
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  reorderQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create the Product model
const Product = mongoose.model('Product', productSchema);

// Define a simplified Business schema
const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Create the Business model
const Business = mongoose.model('Business', businessSchema);

// Sample grocery products data (simplified)
const groceryProducts = [
  {
    name: 'Organic Bananas',
    description: 'Fresh organic bananas',
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
      email: 'orders@organicfarms.com'
    },
    reorderQuantity: 30,
    isActive: true
  },
  {
    name: 'Whole Milk',
    description: 'Fresh whole milk',
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
      email: 'orders@happycow.com'
    },
    reorderQuantity: 20,
    isActive: true
  },
  {
    name: 'Whole Wheat Bread',
    description: 'Freshly baked bread',
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
      email: 'orders@sunshinebakery.com'
    },
    reorderQuantity: 15,
    isActive: true
  },
  {
    name: 'Fresh Spinach',
    description: 'Organic spinach',
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
      email: 'orders@greenfields.com'
    },
    reorderQuantity: 15,
    isActive: true
  },
  {
    name: 'Chicken Breast',
    description: 'Boneless chicken',
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
      email: 'orders@familyfarm.com'
    },
    reorderQuantity: 10,
    isActive: true
  }
];

async function addGroceryProducts() {
  try {
    // Create a default business if none exists
    let business = await Business.findOne();
    
    if (!business) {
      console.log('No business found. Creating a default business...');
      business = await Business.create({
        name: 'Default Grocery Store'
      });
      console.log('Default business created:', business.name);
    } else {
      console.log(`Using existing business: ${business.name}`);
    }
    
    // Add business ID to each product
    const productsWithBusiness = groceryProducts.map(product => ({
      ...product,
      business: business._id
    }));
    
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