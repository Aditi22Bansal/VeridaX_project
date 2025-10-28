const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  interests: [{
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  availability: {
    hoursPerWeek: {
      type: Number,
      default: 5,
      min: 1,
      max: 168
    },
    preferredDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    preferredTimeSlots: [{
      start: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    }],
    isRemoteAvailable: {
      type: Boolean,
      default: true
    }
  },
  preferences: {
    maxDistance: {
      type: Number,
      default: 50, // kilometers
      min: 0
    },
    preferredCampaignTypes: [{
      type: String,
      enum: ['volunteering', 'crowdfunding']
    }],
    preferredCampaignCategories: [{
      type: String,
      enum: ['education', 'healthcare', 'environment', 'community', 'disaster-relief', 'other']
    }],
    minimumDuration: {
      type: Number,
      default: 1, // weeks
      min: 0
    },
    maximumDuration: {
      type: Number,
      default: 52, // weeks
      min: 1
    }
  },
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    },
    pincode: {
      type: String,
      match: /^\d{6}$/
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  verifications: {
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    isBackgroundChecked: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: {
        type: String,
        enum: ['identity', 'address', 'education', 'skill-certificate', 'other'],
        required: true
      },
      documentName: {
        type: String,
        required: true
      },
      documentUrl: {
        type: String,
        required: true
      },
      verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      verifiedAt: Date,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  statistics: {
    totalHours: {
      type: Number,
      default: 0,
      min: 0
    },
    campaignsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    impactScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000
    },
    badges: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      iconUrl: String,
      earnedAt: {
        type: Date,
        default: Date.now
      },
      category: {
        type: String,
        enum: ['hours', 'campaigns', 'skills', 'leadership', 'community', 'special'],
        default: 'community'
      }
    }],
    reviews: [{
      campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reviewedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  notificationPreferences: {
    emailNotifications: {
      newCampaigns: {
        type: Boolean,
        default: true
      },
      campaignUpdates: {
        type: Boolean,
        default: true
      },
      reminders: {
        type: Boolean,
        default: true
      },
      achievements: {
        type: Boolean,
        default: true
      }
    },
    pushNotifications: {
      newCampaigns: {
        type: Boolean,
        default: false
      },
      campaignUpdates: {
        type: Boolean,
        default: true
      },
      reminders: {
        type: Boolean,
        default: true
      },
      achievements: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Virtual for calculating average rating
volunteerProfileSchema.virtual('averageRating').get(function() {
  if (!this.statistics.reviews || this.statistics.reviews.length === 0) {
    return 0;
  }
  const sum = this.statistics.reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / this.statistics.reviews.length) * 10) / 10;
});

// Virtual for calculating completion rate
volunteerProfileSchema.virtual('completionRate').get(function() {
  const total = this.statistics.campaignsCompleted + this.statistics.campaignsDropped || 0;
  if (total === 0) return 100;
  return Math.round((this.statistics.campaignsCompleted / total) * 100);
});

// Method to add skill
volunteerProfileSchema.methods.addSkill = function(skillName, level = 'beginner', experience = 0) {
  const existingSkill = this.skills.find(skill => skill.name === skillName.toLowerCase());
  if (!existingSkill) {
    this.skills.push({
      name: skillName.toLowerCase(),
      level,
      yearsOfExperience: experience
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update skill level
volunteerProfileSchema.methods.updateSkillLevel = function(skillName, newLevel) {
  const skill = this.skills.find(skill => skill.name === skillName.toLowerCase());
  if (skill) {
    skill.level = newLevel;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add badge
volunteerProfileSchema.methods.addBadge = function(name, description, category = 'community', iconUrl = '') {
  const existingBadge = this.statistics.badges.find(badge => badge.name === name);
  if (!existingBadge) {
    this.statistics.badges.push({
      name,
      description,
      iconUrl,
      category
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update volunteering hours
volunteerProfileSchema.methods.addVolunteerHours = function(hours) {
  this.statistics.totalHours += hours;
  this.statistics.impactScore += hours * 2; // 2 points per hour

  // Check for hour-based badges
  if (this.statistics.totalHours >= 10 && !this.statistics.badges.find(b => b.name === 'Getting Started')) {
    this.addBadge('Getting Started', 'Completed 10+ volunteer hours', 'hours');
  }
  if (this.statistics.totalHours >= 50 && !this.statistics.badges.find(b => b.name === 'Dedicated Volunteer')) {
    this.addBadge('Dedicated Volunteer', 'Completed 50+ volunteer hours', 'hours');
  }
  if (this.statistics.totalHours >= 100 && !this.statistics.badges.find(b => b.name === 'Community Champion')) {
    this.addBadge('Community Champion', 'Completed 100+ volunteer hours', 'hours');
  }

  return this.save();
};

// Method to complete a campaign
volunteerProfileSchema.methods.completeCampaign = function() {
  this.statistics.campaignsCompleted += 1;
  this.statistics.impactScore += 50; // 50 points per completed campaign

  // Check for campaign-based badges
  if (this.statistics.campaignsCompleted >= 1 && !this.statistics.badges.find(b => b.name === 'First Impact')) {
    this.addBadge('First Impact', 'Completed your first campaign', 'campaigns');
  }
  if (this.statistics.campaignsCompleted >= 5 && !this.statistics.badges.find(b => b.name === 'Serial Helper')) {
    this.addBadge('Serial Helper', 'Completed 5+ campaigns', 'campaigns');
  }
  if (this.statistics.campaignsCompleted >= 10 && !this.statistics.badges.find(b => b.name === 'Impact Maker')) {
    this.addBadge('Impact Maker', 'Completed 10+ campaigns', 'campaigns');
  }

  return this.save();
};

// Method to add review
volunteerProfileSchema.methods.addReview = function(campaignId, rating, comment, reviewedBy) {
  this.statistics.reviews.push({
    campaignId,
    rating,
    comment,
    reviewedBy
  });
  return this.save();
};

// Index for efficient queries
volunteerProfileSchema.index({ userId: 1 });
volunteerProfileSchema.index({ 'skills.name': 1 });
volunteerProfileSchema.index({ 'interests.category': 1 });
volunteerProfileSchema.index({ 'location.city': 1 });
volunteerProfileSchema.index({ 'statistics.impactScore': -1 });

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
