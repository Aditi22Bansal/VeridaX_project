const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
});

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'paypal', 'bank-transfer', 'cash-on-delivery'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    }
  },
  trackingInfo: {
    trackingNumber: {
      type: String,
      trim: true
    },
    carrier: {
      type: String,
      trim: true
    },
    estimatedDelivery: {
      type: Date
    },
    actualDelivery: {
      type: Date
    }
  },
  notes: {
    buyer: {
      type: String,
      maxlength: [500, 'Buyer notes cannot be more than 500 characters']
    },
    seller: {
      type: String,
      maxlength: [500, 'Seller notes cannot be more than 500 characters']
    }
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      maxlength: [200, 'Status note cannot be more than 200 characters']
    }
  }]
}, {
  timestamps: true
});

// Add status to history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      note: `Status changed to ${this.status}`
    });
  }
  next();
});

// Calculate total items
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Check if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Check if order can be refunded
orderSchema.virtual('canBeRefunded').get(function() {
  return ['delivered', 'shipped'].includes(this.status);
});

// Update order status
orderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note: note || `Status updated to ${newStatus}`
  });
  return this.save();
};

// Add tracking information
orderSchema.methods.addTracking = function(trackingNumber, carrier, estimatedDelivery) {
  this.trackingInfo = {
    trackingNumber,
    carrier,
    estimatedDelivery
  };
  this.status = 'shipped';
  this.statusHistory.push({
    status: 'shipped',
    note: `Package shipped via ${carrier}. Tracking: ${trackingNumber}`
  });
  return this.save();
};

// Mark as delivered
orderSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.trackingInfo.actualDelivery = new Date();
  this.statusHistory.push({
    status: 'delivered',
    note: 'Package delivered successfully'
  });
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
