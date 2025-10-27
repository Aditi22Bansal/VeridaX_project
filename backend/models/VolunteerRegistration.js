const mongoose = require('mongoose');

const volunteerRegistrationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'approved', 'rejected', 'completed'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Ensure one registration per volunteer per campaign
volunteerRegistrationSchema.index({ campaignId: 1, volunteerId: 1 }, { unique: true });

// Update approvedAt when status changes to approved
volunteerRegistrationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('VolunteerRegistration', volunteerRegistrationSchema);
