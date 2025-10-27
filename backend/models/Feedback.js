const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedbackType: {
    type: String,
    enum: ['buyer-to-seller', 'buyer-to-volunteer', 'seller-to-volunteer', 'volunteer-to-seller', 'volunteer-to-buyer'],
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
    maxlength: [500, 'Review cannot be more than 500 characters'],
    trim: true
  },
  categories: {
    deliverySpeed: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    productQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    },
    overallExperience: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  moderationNotes: {
    type: String,
    maxlength: [200, 'Moderation notes cannot be more than 200 characters']
  },
  moderatedAt: {
    type: Date
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate average rating for categories
feedbackSchema.virtual('averageCategoryRating').get(function() {
  const categories = this.categories;
  const ratings = Object.values(categories).filter(rating => rating !== undefined);

  if (ratings.length === 0) return this.rating;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

// Check if feedback is complete
feedbackSchema.virtual('isComplete').get(function() {
  return this.rating && this.review && this.review.trim().length > 0;
});

// Ensure one feedback per user per delivery per type
feedbackSchema.index({ deliveryId: 1, fromUserId: 1, feedbackType: 1 }, { unique: true });

// Add moderation timestamp when status changes
feedbackSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    this.moderatedAt = new Date();
  }
  next();
});

// Get feedback summary for a user
feedbackSchema.statics.getUserFeedbackSummary = async function(userId) {
  const feedbacks = await this.find({
    toUserId: userId,
    status: 'approved',
    isPublic: true
  });

  const summary = {
    totalFeedbacks: feedbacks.length,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentFeedbacks: []
  };

  if (feedbacks.length > 0) {
    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    summary.averageRating = Math.round((totalRating / feedbacks.length) * 10) / 10;

    feedbacks.forEach(feedback => {
      summary.ratingDistribution[feedback.rating]++;
    });

    summary.recentFeedbacks = feedbacks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }

  return summary;
};

module.exports = mongoose.model('Feedback', feedbackSchema);
