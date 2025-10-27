const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  imageURL: {
    type: String,
    default: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  },
  type: {
    type: String,
    enum: ['volunteering', 'crowdfunding'],
    required: [true, 'Campaign type is required']
  },
  goalAmount: {
    type: Number,
    required: [true, 'Goal amount is required'],
    min: [0, 'Goal amount cannot be negative']
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Raised amount cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  donations: [{
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true
    },
    donatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['education', 'healthcare', 'environment', 'community', 'disaster-relief', 'other'],
    default: 'community'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  }
}, {
  timestamps: true
});

// Calculate progress percentage
campaignSchema.virtual('progressPercentage').get(function() {
  if (this.goalAmount === 0) return 0;
  return Math.round((this.raisedAmount / this.goalAmount) * 100);
});

// Check if campaign is active
campaignSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Add volunteer to campaign
campaignSchema.methods.addVolunteer = function(volunteerId) {
  if (!this.volunteers.includes(volunteerId)) {
    this.volunteers.push(volunteerId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Pre-save hook to ensure raisedAmount is always a number
campaignSchema.pre('save', function(next) {
  if (this.raisedAmount !== undefined) {
    this.raisedAmount = parseFloat(this.raisedAmount) || 0;
  }
  next();
});

// Add donation to campaign
campaignSchema.methods.addDonation = function(volunteerId, amount) {
  // Ensure amount is a number to prevent string concatenation
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    throw new Error('Invalid donation amount');
  }
  
  // Ensure raisedAmount is also a number to prevent string concatenation
  const currentRaisedAmount = parseFloat(this.raisedAmount) || 0;
  
  this.donations.push({ volunteerId, amount: numericAmount });
  this.raisedAmount = currentRaisedAmount + numericAmount;
  return this.save();
};

module.exports = mongoose.model('Campaign', campaignSchema);
