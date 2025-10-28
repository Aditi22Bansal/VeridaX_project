const mongoose = require('mongoose');

const impactRecordSchema = new mongoose.Schema({
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VolunteerOpportunity'
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VolunteerApplication'
  },
  type: {
    type: String,
    enum: ['volunteering-hours', 'skill-contribution', 'donation', 'leadership', 'mentorship', 'training', 'event-participation', 'campaign-completion'],
    required: true
  },
  impact: {
    category: {
      type: String,
      enum: ['education', 'healthcare', 'environment', 'community', 'disaster-relief', 'poverty-alleviation', 'skills-development', 'awareness', 'fundraising', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    quantifiableMetrics: [{
      metric: {
        type: String,
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        required: true
      }
    }],
    beneficiaries: {
      directCount: {
        type: Number,
        default: 0,
        min: 0
      },
      indirectCount: {
        type: Number,
        default: 0,
        min: 0
      },
      demographics: {
        ageGroups: [{
          group: {
            type: String,
            enum: ['children', 'youth', 'adults', 'seniors']
          },
          count: {
            type: Number,
            min: 0
          }
        }],
        gender: {
          male: {
            type: Number,
            default: 0,
            min: 0
          },
          female: {
            type: Number,
            default: 0,
            min: 0
          },
          other: {
            type: Number,
            default: 0,
            min: 0
          }
        },
        economicStatus: [{
          category: {
            type: String,
            enum: ['low-income', 'middle-income', 'high-income', 'below-poverty-line']
          },
          count: {
            type: Number,
            min: 0
          }
        }]
      }
    }
  },
  timeRecord: {
    hoursContributed: {
      type: Number,
      required: true,
      min: 0,
      max: 24
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value > this.timeRecord.startTime;
        },
        message: 'End time must be after start time'
      }
    },
    breakDuration: {
      type: Number,
      default: 0,
      min: 0 // minutes
    },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  skillsUtilized: [{
    skill: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    },
    hoursApplied: {
      type: Number,
      min: 0
    },
    improvementAchieved: {
      type: String,
      enum: ['significant', 'moderate', 'minimal', 'none'],
      default: 'none'
    }
  }],
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'disputed', 'rejected'],
      default: 'pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    verificationMethod: {
      type: String,
      enum: ['supervisor-confirmation', 'photo-evidence', 'gps-tracking', 'peer-verification', 'self-reported', 'blockchain-verified'],
      default: 'self-reported'
    },
    evidence: [{
      type: {
        type: String,
        enum: ['photo', 'video', 'document', 'gps-location', 'timestamp', 'witness-statement']
      },
      url: {
        type: String
      },
      description: {
        type: String,
        maxlength: 200
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    verificationNotes: {
      type: String,
      maxlength: 500
    }
  },
  blockchain: {
    isRecorded: {
      type: Boolean,
      default: false
    },
    transactionHash: {
      type: String
    },
    blockNumber: {
      type: Number
    },
    contractAddress: {
      type: String
    },
    tokenId: {
      type: String
    },
    recordedAt: {
      type: Date
    },
    networkId: {
      type: String,
      default: 'ethereum-mainnet'
    },
    gasUsed: {
      type: Number
    },
    recordingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    },
    ipfsHash: {
      type: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  scoring: {
    impactPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    difficultyMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 5.0
    },
    skillMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 3.0
    },
    timeMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0
    },
    scoreCalculatedAt: {
      type: Date
    }
  },
  badges: [{
    badgeId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['hours', 'impact', 'skills', 'leadership', 'consistency', 'special-achievement'],
      required: true
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common'
    },
    imageUrl: {
      type: String
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    isBlockchainMinted: {
      type: Boolean,
      default: false
    }
  }],
  quality: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      maxlength: 500
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    improvements: [{
      area: {
        type: String,
        required: true
      },
      suggestion: {
        type: String,
        required: true
      }
    }]
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
    recordedVia: {
      type: String,
      enum: ['gps', 'manual', 'checkin', 'qr-code'],
      default: 'manual'
    }
  },
  media: {
    photos: [{
      url: {
        type: String,
        required: true
      },
      caption: {
        type: String,
        maxlength: 200
      },
      takenAt: {
        type: Date,
        default: Date.now
      },
      location: {
        latitude: Number,
        longitude: Number
      }
    }],
    videos: [{
      url: {
        type: String,
        required: true
      },
      title: {
        type: String,
        maxlength: 100
      },
      description: {
        type: String,
        maxlength: 300
      },
      duration: {
        type: Number // seconds
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    documents: [{
      name: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['certificate', 'report', 'presentation', 'other']
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  metadata: {
    source: {
      type: String,
      enum: ['mobile-app', 'web-app', 'api', 'manual-entry'],
      default: 'web-app'
    },
    deviceInfo: {
      type: String
    },
    appVersion: {
      type: String
    },
    submissionMethod: {
      type: String,
      enum: ['real-time', 'batch-upload', 'delayed-entry'],
      default: 'real-time'
    },
    accuracy: {
      timeAccuracy: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      locationAccuracy: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      }
    }
  }
}, {
  timestamps: true
});

// Virtual for calculating effective hours (considering breaks)
impactRecordSchema.virtual('effectiveHours').get(function() {
  const totalMinutes = (this.timeRecord.endTime - this.timeRecord.startTime) / (1000 * 60);
  const effectiveMinutes = totalMinutes - (this.timeRecord.breakDuration || 0);
  return Math.max(0, effectiveMinutes / 60);
});

// Virtual for calculating impact score per hour
impactRecordSchema.virtual('impactPerHour').get(function() {
  if (this.timeRecord.hoursContributed === 0) return 0;
  return Math.round(this.scoring.totalScore / this.timeRecord.hoursContributed * 100) / 100;
});

// Virtual for checking if record is blockchain verified
impactRecordSchema.virtual('isBlockchainVerified').get(function() {
  return this.blockchain.isRecorded && this.blockchain.recordingStatus === 'confirmed';
});

// Method to calculate impact points
impactRecordSchema.methods.calculateImpactPoints = function() {
  const basePoints = this.timeRecord.hoursContributed * 10; // 10 points per hour base

  // Add points based on beneficiaries
  const beneficiaryPoints = (this.impact.beneficiaries.directCount * 2) +
                           (this.impact.beneficiaries.indirectCount * 0.5);

  // Add points for skill utilization
  const skillPoints = this.skillsUtilized.reduce((total, skill) => {
    const levelMultiplier = {
      'beginner': 1,
      'intermediate': 1.2,
      'advanced': 1.5,
      'expert': 2
    };
    return total + (skill.hoursApplied || 1) * (levelMultiplier[skill.level] || 1);
  }, 0);

  this.scoring.impactPoints = Math.round(basePoints + beneficiaryPoints + skillPoints);
  this.scoring.totalScore = Math.round(
    this.scoring.impactPoints *
    this.scoring.difficultyMultiplier *
    this.scoring.skillMultiplier *
    this.scoring.timeMultiplier
  );
  this.scoring.scoreCalculatedAt = new Date();

  return this.save();
};

// Method to verify impact record
impactRecordSchema.methods.verifyRecord = function(verifiedBy, method = 'supervisor-confirmation', notes = '') {
  this.verification.status = 'verified';
  this.verification.verifiedBy = verifiedBy;
  this.verification.verifiedAt = new Date();
  this.verification.verificationMethod = method;
  this.verification.verificationNotes = notes;

  return this.save();
};

// Method to record on blockchain
impactRecordSchema.methods.recordOnBlockchain = function(transactionHash, blockNumber, contractAddress) {
  this.blockchain.transactionHash = transactionHash;
  this.blockchain.blockNumber = blockNumber;
  this.blockchain.contractAddress = contractAddress;
  this.blockchain.recordedAt = new Date();
  this.blockchain.recordingStatus = 'confirmed';
  this.blockchain.isRecorded = true;

  return this.save();
};

// Method to add badge
impactRecordSchema.methods.addBadge = function(badgeData) {
  const badge = {
    badgeId: badgeData.id || `badge_${Date.now()}`,
    name: badgeData.name,
    description: badgeData.description,
    category: badgeData.category || 'impact',
    rarity: badgeData.rarity || 'common',
    imageUrl: badgeData.imageUrl || ''
  };

  this.badges.push(badge);
  return this.save();
};

// Method to add evidence
impactRecordSchema.methods.addEvidence = function(type, url, description, metadata = {}) {
  this.verification.evidence.push({
    type,
    url,
    description,
    metadata
  });

  return this.save();
};

// Pre-save middleware to calculate hours from time range
impactRecordSchema.pre('save', function(next) {
  if (this.timeRecord.startTime && this.timeRecord.endTime) {
    const totalMinutes = (this.timeRecord.endTime - this.timeRecord.startTime) / (1000 * 60);
    const effectiveMinutes = totalMinutes - (this.timeRecord.breakDuration || 0);
    this.timeRecord.hoursContributed = Math.max(0, Math.round(effectiveMinutes / 60 * 100) / 100);
  }

  // Auto-calculate impact points if not set
  if (this.isModified('timeRecord') || this.isModified('skillsUtilized') || this.isModified('impact')) {
    const basePoints = this.timeRecord.hoursContributed * 10;
    const beneficiaryPoints = (this.impact.beneficiaries.directCount * 2) +
                             (this.impact.beneficiaries.indirectCount * 0.5);

    this.scoring.impactPoints = Math.round(basePoints + beneficiaryPoints);
    this.scoring.totalScore = Math.round(
      this.scoring.impactPoints *
      this.scoring.difficultyMultiplier *
      this.scoring.skillMultiplier *
      this.scoring.timeMultiplier
    );
    this.scoring.scoreCalculatedAt = new Date();
  }

  next();
});

// Indexes for efficient queries
impactRecordSchema.index({ volunteerId: 1, campaignId: 1 });
impactRecordSchema.index({ volunteerId: 1 });
impactRecordSchema.index({ campaignId: 1 });
impactRecordSchema.index({ type: 1 });
impactRecordSchema.index({ 'impact.category': 1 });
impactRecordSchema.index({ 'verification.status': 1 });
impactRecordSchema.index({ 'blockchain.isRecorded': 1 });
impactRecordSchema.index({ 'scoring.totalScore': -1 });
impactRecordSchema.index({ 'timeRecord.startTime': -1 });
impactRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImpactRecord', impactRecordSchema);
