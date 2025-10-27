const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'picked-up', 'in-transit', 'delivered', 'failed'],
    default: 'assigned'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  deliveryAddress: {
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
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  pickupAddress: {
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
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  deliveryNotes: {
    type: String,
    maxlength: [500, 'Delivery notes cannot be more than 500 characters']
  },
  volunteerNotes: {
    type: String,
    maxlength: [500, 'Volunteer notes cannot be more than 500 characters']
  },
  deliveryProof: {
    type: String // URL to delivery proof image
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
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  feedback: {
    buyerRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    buyerReview: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    sellerRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    sellerReview: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    volunteerRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    volunteerReview: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  compensation: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Compensation cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    paidAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Add status to history when status changes
deliverySchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      note: `Status changed to ${this.status}`
    });
  }
  next();
});

// Calculate delivery duration
deliverySchema.virtual('deliveryDuration').get(function() {
  if (this.deliveredAt && this.pickedUpAt) {
    return Math.round((this.deliveredAt - this.pickedUpAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Check if delivery is completed
deliverySchema.virtual('isCompleted').get(function() {
  return this.status === 'delivered';
});

// Check if feedback is complete
deliverySchema.virtual('isFeedbackComplete').get(function() {
  return this.feedback.buyerRating && this.feedback.sellerRating && this.feedback.volunteerRating;
});

// Update delivery status
deliverySchema.methods.updateStatus = function(newStatus, note = '', location = null) {
  this.status = newStatus;

  if (newStatus === 'picked-up') {
    this.pickedUpAt = new Date();
  } else if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
    this.actualDeliveryTime = new Date();
  }

  this.statusHistory.push({
    status: newStatus,
    note: note || `Status updated to ${newStatus}`,
    location: location
  });

  return this.save();
};

// Add feedback
deliverySchema.methods.addFeedback = function(type, rating, review = '') {
  if (type === 'buyer') {
    this.feedback.buyerRating = rating;
    this.feedback.buyerReview = review;
  } else if (type === 'seller') {
    this.feedback.sellerRating = rating;
    this.feedback.sellerReview = review;
  } else if (type === 'volunteer') {
    this.feedback.volunteerRating = rating;
    this.feedback.volunteerReview = review;
  }

  this.feedback.submittedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Delivery', deliverySchema);
