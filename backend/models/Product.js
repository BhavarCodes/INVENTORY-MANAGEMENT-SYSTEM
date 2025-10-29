const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'bakery', 'pantry', 'beverages', 'snacks', 'canned', 'frozen', 'other']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    uppercase: true
  },
  barcode: {
    type: String,
    sparse: true
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Stock cannot be negative']
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock level cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    required: [true, 'Maximum stock level is required'],
    min: [0, 'Maximum stock level cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'g', 'lb', 'oz', 'liter', 'ml', 'piece', 'box', 'pack', 'bag', 'bottle', 'dozen']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  supplier: {
    name: {
      type: String,
      required: [true, 'Supplier name is required']
    },
    email: {
      type: String,
      required: [true, 'Supplier email is required']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  reorderQuantity: {
    type: Number,
    required: [true, 'Reorder quantity is required'],
    min: [1, 'Reorder quantity must be at least 1']
  },
  maxOrderQuantity: {
    type: Number,
    required: [true, 'Maximum order quantity is required'],
    min: [1, 'Maximum order quantity must be at least 1'],
    default: 100 // Default limit if not specified
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  image: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure maxOrderQuantity always matches maxStockLevel
productSchema.pre('validate', function(next) {
  if (typeof this.maxStockLevel === 'number' && !Number.isNaN(this.maxStockLevel)) {
    this.maxOrderQuantity = this.maxStockLevel;
  }
  next();
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minStockLevel) return 'low_stock';
  if (this.currentStock >= this.maxStockLevel) return 'overstock';
  return 'in_stock';
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Index for efficient queries
productSchema.index({ business: 1 });
productSchema.index({ business: 1, sku: 1 }, { unique: true }); // SKU unique per business
productSchema.index({ business: 1, barcode: 1 }, { unique: true, sparse: true }); // Barcode unique per business
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ currentStock: 1 });

module.exports = mongoose.model('Product', productSchema);
