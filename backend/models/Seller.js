const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot be more than 100 characters']
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot be more than 1000 characters'],
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    },
    socialMedia: {
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true }
    }
  },
  businessInfo: {
    businessType: {
      type: String,
      enum: ['individual', 'small-business', 'cooperative', 'non-profit'],
      default: 'individual'
    },
    taxId: {
      type: String,
      trim: true
    },
    businessLicense: {
      type: String,
      trim: true
    }
  },
  ratings: [{
    buyerId: {
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
  stats: {
    totalSales: {
      type: Number,
      default: 0,
      min: [0, 'Total sales cannot be negative']
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, 'Total orders cannot be negative']
    },
    totalProducts: {
      type: Number,
      default: 0,
      min: [0, 'Total products cannot be negative']
    },
    responseTime: {
      type: Number, // in hours
      default: 24
    }
  },
  policies: {
    returnPolicy: {
      type: String,
      maxlength: [1000, 'Return policy cannot be more than 1000 characters']
    },
    shippingPolicy: {
      type: String,
      maxlength: [1000, 'Shipping policy cannot be more than 1000 characters']
    },
    processingTime: {
      type: Number, // in days
      default: 3,
      min: [1, 'Processing time must be at least 1 day']
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending-approval'],
    default: 'pending-approval'
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    },
    documents: [{
      type: {
        type: String,
        enum: ['id', 'business-license', 'tax-document', 'other']
      },
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  specialties: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  categoryRatings: {
    deliverySpeed: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    communication: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    productQuality: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    packaging: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    overallExperience: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Note: averageRating and totalRatings are now real fields, not virtuals

// Check if seller is active
sellerSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Add rating to seller
sellerSchema.methods.addRating = function(buyerId, rating, review = '') {
  // Remove existing rating from this buyer
  this.ratings = this.ratings.filter(r => !r.buyerId.equals(buyerId));

  // Add new rating
  this.ratings.push({ buyerId, rating, review });
  return this.save();
};

// Update seller stats
sellerSchema.methods.updateStats = function(salesAmount = 0, orderCount = 0, productCount = 0) {
  this.stats.totalSales += salesAmount;
  this.stats.totalOrders += orderCount;
  this.stats.totalProducts = productCount;
  return this.save();
};

// Verify seller
sellerSchema.methods.verify = function() {
  this.verification.isVerified = true;
  this.verification.verifiedAt = new Date();
  this.status = 'active';
  return this.save();
};

// Suspend seller
sellerSchema.methods.suspend = function(reason = '') {
  this.status = 'suspended';
  return this.save();
};

// Activate seller
sellerSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

module.exports = mongoose.model('Seller', sellerSchema);
