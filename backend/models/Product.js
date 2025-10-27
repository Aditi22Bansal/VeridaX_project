const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['handmade', 'eco-friendly', 'artisan', 'upcycled', 'organic', 'sustainable', 'community-crafted', 'other'],
    required: [true, 'Product category is required']
  },
  images: [{
    type: String,
    required: true
  }],
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  materials: [{
    type: String,
    trim: true
  }],
  sustainabilityRating: {
    type: Number,
    min: [1, 'Sustainability rating must be at least 1'],
    max: [5, 'Sustainability rating cannot be more than 5'],
    default: 3
  },
  location: {
    type: String,
    required: [true, 'Product location is required'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  deliveryInfo: {
    estimatedDays: {
      type: Number,
      default: 7,
      min: [1, 'Estimated delivery days must be at least 1']
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative']
    },
    freeShippingThreshold: {
      type: Number,
      default: null
    }
  },
  ratings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'out-of-stock', 'discontinued'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  }
}, {
  timestamps: true
});

// Calculate average rating
productSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Get total number of ratings
productSchema.virtual('totalRatings').get(function() {
  return this.ratings.length;
});

// Check if product is in stock
productSchema.virtual('isInStock').get(function() {
  return this.stock > 0 && this.status === 'active';
});

// Add rating to product
productSchema.methods.addRating = function(userId, rating, review = '') {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(r => !r.userId.equals(userId));

  // Add new rating
  this.ratings.push({ userId, rating, review });
  return this.save();
};

// Update stock
productSchema.methods.updateStock = function(quantity) {
  this.stock = Math.max(0, this.stock + quantity);
  if (this.stock === 0) {
    this.status = 'out-of-stock';
  } else if (this.status === 'out-of-stock') {
    this.status = 'active';
  }
  return this.save();
};

// Search products by text
productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  materials: 'text'
});

module.exports = mongoose.model('Product', productSchema);
