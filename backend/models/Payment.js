const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.50, 'Minimum donation amount is $0.50']
  },
  currency: {
    type: String,
    default: 'usd',
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud']
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  stripeChargeId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'wallet'],
    default: 'card'
  },
  donorEmail: {
    type: String,
    required: true
  },
  donorName: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    maxlength: [500, 'Refund reason cannot exceed 500 characters']
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
paymentSchema.index({ campaignId: 1 });
paymentSchema.index({ donorId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for net amount (after refunds)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.refundedAmount;
});

// Static method to get campaign donation stats
paymentSchema.statics.getCampaignStats = async function(campaignId) {
  const stats = await this.aggregate([
    { $match: { campaignId: mongoose.Types.ObjectId(campaignId), status: 'succeeded' } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalDonations: { $sum: 1 },
        averageDonation: { $avg: '$amount' },
        refundedAmount: { $sum: '$refundedAmount' }
      }
    }
  ]);

  return stats[0] || {
    totalAmount: 0,
    totalDonations: 0,
    averageDonation: 0,
    refundedAmount: 0
  };
};

// Static method to get donor stats
paymentSchema.statics.getDonorStats = async function(donorId) {
  const stats = await this.aggregate([
    { $match: { donorId: mongoose.Types.ObjectId(donorId), status: 'succeeded' } },
    {
      $group: {
        _id: null,
        totalDonated: { $sum: '$amount' },
        totalDonations: { $sum: 1 },
        averageDonation: { $avg: '$amount' },
        refundedAmount: { $sum: '$refundedAmount' }
      }
    }
  ]);

  return stats[0] || {
    totalDonated: 0,
    totalDonations: 0,
    averageDonation: 0,
    refundedAmount: 0
  };
};

// Instance method to process refund
paymentSchema.methods.processRefund = async function(amount, reason) {
  if (this.status !== 'succeeded') {
    throw new Error('Can only refund successful payments');
  }

  const maxRefundAmount = this.amount - this.refundedAmount;
  if (amount > maxRefundAmount) {
    throw new Error(`Maximum refund amount is $${maxRefundAmount}`);
  }

  this.refundedAmount += amount;
  this.refundReason = reason;

  if (this.refundedAmount >= this.amount) {
    this.status = 'refunded';
  }

  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
