const mongoose = require('mongoose');

const volunteerOpportunitySchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Opportunity title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Opportunity description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['skill-based', 'general', 'event-based', 'ongoing'],
    required: true,
    default: 'general'
  },
  skillsRequired: [{
    skill: {
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
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  skillsPreferred: [{
    skill: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  }],
  timeCommitment: {
    duration: {
      value: {
        type: Number,
        required: true,
        min: 1
      },
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months'],
        required: true
      }
    },
    hoursPerWeek: {
      type: Number,
      min: 1,
      max: 40,
      default: 5
    },
    isFlexible: {
      type: Boolean,
      default: true
    },
    schedule: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true,
        validate: {
          validator: function(value) {
            return value > this.timeCommitment.schedule.startDate;
          },
          message: 'End date must be after start date'
        }
      },
      preferredDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      timeSlots: [{
        start: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        end: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        }
      }]
    }
  },
  location: {
    type: {
      type: String,
      enum: ['remote', 'on-site', 'hybrid'],
      default: 'on-site'
    },
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
    },
    maxDistance: {
      type: Number,
      default: 25, // kilometers
      min: 0
    }
  },
  requirements: {
    minimumAge: {
      type: Number,
      default: 18,
      min: 16,
      max: 100
    },
    maximumAge: {
      type: Number,
      max: 100
    },
    backgroundCheck: {
      type: Boolean,
      default: false
    },
    references: {
      type: Boolean,
      default: false
    },
    previousExperience: {
      type: Boolean,
      default: false
    },
    specialRequirements: [{
      type: String,
      trim: true
    }]
  },
  capacity: {
    maxVolunteers: {
      type: Number,
      required: true,
      min: 1,
      max: 1000
    },
    currentVolunteers: {
      type: Number,
      default: 0,
      min: 0
    },
    minVolunteersToStart: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  benefits: {
    description: {
      type: String,
      maxlength: 500
    },
    skillDevelopment: [{
      type: String,
      trim: true
    }],
    networking: {
      type: Boolean,
      default: false
    },
    certificate: {
      type: Boolean,
      default: false
    },
    letterOfRecommendation: {
      type: Boolean,
      default: false
    },
    transportation: {
      provided: {
        type: Boolean,
        default: false
      },
      reimbursement: {
        type: Boolean,
        default: false
      }
    },
    meals: {
      provided: {
        type: Boolean,
        default: false
      },
      reimbursement: {
        type: Boolean,
        default: false
      }
    }
  },
  applicationProcess: {
    isApplicationRequired: {
      type: Boolean,
      default: false
    },
    applicationDeadline: {
      type: Date
    },
    selectionProcess: {
      type: String,
      enum: ['first-come-first-serve', 'application-based', 'interview-based', 'skill-based'],
      default: 'first-come-first-serve'
    },
    applicationQuestions: [{
      question: {
        type: String,
        required: true,
        maxlength: 200
      },
      type: {
        type: String,
        enum: ['text', 'textarea', 'multiple-choice', 'file'],
        default: 'text'
      },
      options: [{
        type: String
      }],
      required: {
        type: Boolean,
        default: false
      }
    }],
    additionalDocuments: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      required: {
        type: Boolean,
        default: false
      },
      fileTypes: [{
        type: String,
        enum: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
      }]
    }]
  },
  contact: {
    primaryContact: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      },
      phone: {
        type: String,
        match: /^[+]?[\d\s\-\(\)]+$/
      }
    },
    instructions: {
      type: String,
      maxlength: 300
    }
  },
  impact: {
    expectedOutcome: {
      type: String,
      required: true,
      maxlength: 500
    },
    beneficiaries: {
      count: {
        type: Number,
        min: 1
      },
      description: {
        type: String,
        maxlength: 300
      }
    },
    measurableGoals: [{
      metric: {
        type: String,
        required: true
      },
      target: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        required: true
      }
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Virtual for checking if opportunity is full
volunteerOpportunitySchema.virtual('isFull').get(function() {
  return this.capacity.currentVolunteers >= this.capacity.maxVolunteers;
});

// Virtual for calculating availability percentage
volunteerOpportunitySchema.virtual('availabilityPercentage').get(function() {
  if (this.capacity.maxVolunteers === 0) return 0;
  const remaining = this.capacity.maxVolunteers - this.capacity.currentVolunteers;
  return Math.round((remaining / this.capacity.maxVolunteers) * 100);
});

// Virtual for checking if opportunity is active and accepting applications
volunteerOpportunitySchema.virtual('isAcceptingApplications').get(function() {
  const now = new Date();
  const hasCapacity = !this.isFull;
  const isActive = this.status === 'active';
  const beforeDeadline = !this.applicationProcess.applicationDeadline ||
                        now <= this.applicationProcess.applicationDeadline;
  const beforeStartDate = now <= this.timeCommitment.schedule.startDate;

  return hasCapacity && isActive && beforeDeadline && beforeStartDate;
});

// Method to calculate skill match percentage
volunteerOpportunitySchema.methods.calculateSkillMatch = function(volunteerSkills) {
  if (!this.skillsRequired.length && !this.skillsPreferred.length) {
    return 100; // No specific skills required
  }

  const volunteerSkillMap = new Map();
  volunteerSkills.forEach(skill => {
    volunteerSkillMap.set(skill.name.toLowerCase(), skill.level);
  });

  let totalScore = 0;
  let maxScore = 0;

  // Check required skills (higher weight)
  this.skillsRequired.forEach(reqSkill => {
    maxScore += reqSkill.isRequired ? 30 : 20;
    const volunteerLevel = volunteerSkillMap.get(reqSkill.skill.toLowerCase());

    if (volunteerLevel) {
      const levelScore = this.getLevelScore(volunteerLevel, reqSkill.level);
      totalScore += reqSkill.isRequired ? levelScore * 30 : levelScore * 20;
    }
  });

  // Check preferred skills (lower weight)
  this.skillsPreferred.forEach(prefSkill => {
    maxScore += 10;
    const volunteerLevel = volunteerSkillMap.get(prefSkill.skill.toLowerCase());

    if (volunteerLevel) {
      const levelScore = this.getLevelScore(volunteerLevel, prefSkill.level);
      totalScore += levelScore * 10;
    }
  });

  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
};

// Helper method to calculate level score
volunteerOpportunitySchema.methods.getLevelScore = function(volunteerLevel, requiredLevel) {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const volunteerIndex = levels.indexOf(volunteerLevel);
  const requiredIndex = levels.indexOf(requiredLevel);

  if (volunteerIndex >= requiredIndex) {
    return 1; // Perfect match or overqualified
  } else {
    return Math.max(0, 0.5 - (requiredIndex - volunteerIndex) * 0.2); // Partial match
  }
};

// Method to add volunteer
volunteerOpportunitySchema.methods.addVolunteer = function() {
  if (!this.isFull) {
    this.capacity.currentVolunteers += 1;
    this.analytics.applications += 1;
    return this.save();
  }
  throw new Error('Opportunity is full');
};

// Method to remove volunteer
volunteerOpportunitySchema.methods.removeVolunteer = function() {
  if (this.capacity.currentVolunteers > 0) {
    this.capacity.currentVolunteers -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to increment views
volunteerOpportunitySchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

// Pre-save middleware to validate dates
volunteerOpportunitySchema.pre('save', function(next) {
  if (this.applicationProcess.applicationDeadline &&
      this.applicationProcess.applicationDeadline > this.timeCommitment.schedule.startDate) {
    return next(new Error('Application deadline must be before start date'));
  }

  if (this.requirements.maximumAge &&
      this.requirements.maximumAge <= this.requirements.minimumAge) {
    return next(new Error('Maximum age must be greater than minimum age'));
  }

  next();
});

// Indexes for efficient queries
volunteerOpportunitySchema.index({ campaignId: 1 });
volunteerOpportunitySchema.index({ status: 1 });
volunteerOpportunitySchema.index({ 'skillsRequired.skill': 1 });
volunteerOpportunitySchema.index({ 'location.city': 1 });
volunteerOpportunitySchema.index({ 'timeCommitment.schedule.startDate': 1 });
volunteerOpportunitySchema.index({ priority: 1 });
volunteerOpportunitySchema.index({ tags: 1 });
volunteerOpportunitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('VolunteerOpportunity', volunteerOpportunitySchema);
