const mongoose = require('mongoose');

const volunteerApplicationSchema = new mongoose.Schema({
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VolunteerOpportunity',
    required: true
  },
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
  applicationData: {
    answers: [{
      questionId: {
        type: String,
        required: true
      },
      question: {
        type: String,
        required: true
      },
      answer: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'textarea', 'multiple-choice', 'file'],
        required: true
      }
    }],
    documents: [{
      documentName: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileType: {
        type: String,
        required: true
      },
      fileSize: {
        type: Number,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    motivation: {
      type: String,
      maxlength: 1000
    },
    availability: {
      preferredSchedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
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
      }],
      hoursPerWeek: {
        type: Number,
        min: 1,
        max: 40
      },
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      }
    },
    experience: {
      relevantExperience: {
        type: String,
        maxlength: 500
      },
      previousVolunteering: [{
        organization: {
          type: String,
          required: true
        },
        role: {
          type: String,
          required: true
        },
        duration: {
          type: String,
          required: true
        },
        description: {
          type: String,
          maxlength: 300
        }
      }],
      skills: [{
        skill: {
          type: String,
          required: true
        },
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          required: true
        },
        yearsOfExperience: {
          type: Number,
          default: 0
        }
      }]
    },
    references: [{
      name: {
        type: String,
        required: true
      },
      relationship: {
        type: String,
        required: true
      },
      email: {
        type: String,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      },
      phone: {
        type: String,
        match: /^[+]?[\d\s\-\(\)]+$/
      },
      contactedAt: {
        type: Date
      },
      response: {
        type: String,
        maxlength: 500
      }
    }]
  },
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'shortlisted', 'interview-scheduled', 'accepted', 'rejected', 'withdrawn'],
    default: 'submitted'
  },
  timeline: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date
    },
    shortlistedAt: {
      type: Date
    },
    interviewScheduledAt: {
      type: Date
    },
    acceptedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    withdrawnAt: {
      type: Date
    }
  },
  review: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      overall: {
        type: Number,
        min: 0,
        max: 100
      },
      skillMatch: {
        type: Number,
        min: 0,
        max: 100
      },
      experienceMatch: {
        type: Number,
        min: 0,
        max: 100
      },
      motivationScore: {
        type: Number,
        min: 0,
        max: 100
      },
      availabilityMatch: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    strengths: [{
      type: String,
      maxlength: 100
    }],
    concerns: [{
      type: String,
      maxlength: 100
    }],
    recommendation: {
      type: String,
      enum: ['strongly-recommend', 'recommend', 'neutral', 'not-recommend', 'strongly-not-recommend'],
      default: 'neutral'
    }
  },
  interview: {
    isRequired: {
      type: Boolean,
      default: false
    },
    scheduledDate: {
      type: Date
    },
    duration: {
      type: Number, // minutes
      default: 30
    },
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person'],
      default: 'video'
    },
    location: {
      type: String
    },
    meetingLink: {
      type: String
    },
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      notes: {
        type: String,
        maxlength: 1000
      },
      recommendation: {
        type: String,
        enum: ['accept', 'reject', 'second-interview']
      }
    },
    rescheduled: [{
      originalDate: {
        type: Date,
        required: true
      },
      newDate: {
        type: Date,
        required: true
      },
      reason: {
        type: String,
        required: true,
        maxlength: 200
      },
      requestedBy: {
        type: String,
        enum: ['volunteer', 'organization'],
        required: true
      },
      rescheduledAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  communication: {
    messages: [{
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      subject: {
        type: String,
        required: true,
        maxlength: 200
      },
      message: {
        type: String,
        required: true,
        maxlength: 2000
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      readAt: {
        type: Date
      },
      attachments: [{
        fileName: String,
        fileUrl: String,
        fileSize: Number
      }]
    }],
    notifications: [{
      type: {
        type: String,
        enum: ['status-update', 'interview-scheduled', 'document-required', 'reminder', 'deadline-approaching'],
        required: true
      },
      title: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      readAt: {
        type: Date
      },
      actionRequired: {
        type: Boolean,
        default: false
      }
    }]
  },
  matching: {
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    matchingFactors: {
      skillsMatch: {
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        details: [{
          skill: String,
          required: Boolean,
          volunteerLevel: String,
          requiredLevel: String,
          match: Boolean
        }]
      },
      locationMatch: {
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        distance: {
          type: Number // kilometers
        }
      },
      availabilityMatch: {
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        overlappingHours: {
          type: Number
        }
      },
      experienceMatch: {
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        relevantExperience: {
          type: Boolean,
          default: false
        }
      },
      interestMatch: {
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        matchingInterests: [{
          type: String
        }]
      }
    },
    recommendationReason: {
      type: String,
      maxlength: 500
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  volunteeringRecord: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    hoursLogged: [{
      date: {
        type: Date,
        required: true
      },
      hours: {
        type: Number,
        required: true,
        min: 0,
        max: 24
      },
      activity: {
        type: String,
        required: true,
        maxlength: 200
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedAt: {
        type: Date
      }
    }],
    totalHours: {
      type: Number,
      default: 0,
      min: 0
    },
    completionStatus: {
      type: String,
      enum: ['in-progress', 'completed', 'dropped-out', 'paused'],
      default: 'in-progress'
    },
    performanceRating: {
      punctuality: {
        type: Number,
        min: 1,
        max: 5
      },
      quality: {
        type: Number,
        min: 1,
        max: 5
      },
      teamwork: {
        type: Number,
        min: 1,
        max: 5
      },
      communication: {
        type: Number,
        min: 1,
        max: 5
      },
      reliability: {
        type: Number,
        min: 1,
        max: 5
      },
      overall: {
        type: Number,
        min: 1,
        max: 5
      }
    },
    feedback: {
      volunteerFeedback: {
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comments: {
          type: String,
          maxlength: 1000
        },
        wouldRecommend: {
          type: Boolean
        },
        improvements: {
          type: String,
          maxlength: 500
        }
      },
      organizationFeedback: {
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comments: {
          type: String,
          maxlength: 1000
        },
        wouldRecommend: {
          type: Boolean
        },
        improvements: {
          type: String,
          maxlength: 500
        }
      }
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'referral'],
      default: 'web'
    },
    referralCode: {
      type: String
    },
    utmSource: {
      type: String
    },
    utmCampaign: {
      type: String
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  }
}, {
  timestamps: true
});

// Virtual for calculating application age in days
volunteerApplicationSchema.virtual('applicationAge').get(function() {
  const now = new Date();
  const submitted = this.timeline.submittedAt;
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if application is pending
volunteerApplicationSchema.virtual('isPending').get(function() {
  return ['submitted', 'under-review', 'shortlisted', 'interview-scheduled'].includes(this.status);
});

// Virtual for checking if interview is overdue
volunteerApplicationSchema.virtual('isInterviewOverdue').get(function() {
  if (!this.interview.scheduledDate) return false;
  return new Date() > this.interview.scheduledDate && this.status === 'interview-scheduled';
});

// Method to update status and timeline
volunteerApplicationSchema.methods.updateStatus = function(newStatus, updatedBy) {
  const oldStatus = this.status;
  this.status = newStatus;

  const timeField = newStatus.replace('-', '') + 'At';
  if (this.timeline[timeField] !== undefined) {
    this.timeline[timeField] = new Date();
  }

  // Add notification
  this.communication.notifications.push({
    type: 'status-update',
    title: `Application Status Updated`,
    message: `Your application status has been updated from "${oldStatus}" to "${newStatus}"`
  });

  return this.save();
};

// Method to calculate overall matching score
volunteerApplicationSchema.methods.calculateMatchingScore = function() {
  const factors = this.matching.matchingFactors;
  const weights = {
    skills: 0.3,
    location: 0.2,
    availability: 0.25,
    experience: 0.15,
    interest: 0.1
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.keys(weights).forEach(factor => {
    const factorKey = factor + 'Match';
    if (factors[factorKey] && factors[factorKey].score !== undefined) {
      totalScore += factors[factorKey].score * weights[factor];
      totalWeight += weights[factor];
    }
  });

  this.matching.aiScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  this.matching.calculatedAt = new Date();

  return this.save();
};

// Method to log volunteer hours
volunteerApplicationSchema.methods.logHours = function(date, hours, activity, verifiedBy = null) {
  this.volunteeringRecord.hoursLogged.push({
    date,
    hours,
    activity,
    verifiedBy,
    verifiedAt: verifiedBy ? new Date() : null
  });

  this.volunteeringRecord.totalHours += hours;
  return this.save();
};

// Method to send message
volunteerApplicationSchema.methods.sendMessage = function(from, to, subject, message, attachments = []) {
  this.communication.messages.push({
    from,
    to,
    subject,
    message,
    attachments
  });

  return this.save();
};

// Method to add notification
volunteerApplicationSchema.methods.addNotification = function(type, title, message, actionRequired = false) {
  this.communication.notifications.push({
    type,
    title,
    message,
    actionRequired
  });

  return this.save();
};

// Pre-save middleware to update timeline
volunteerApplicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const timeField = this.status.replace('-', '') + 'At';
    if (this.timeline[timeField] !== undefined && !this.timeline[timeField]) {
      this.timeline[timeField] = new Date();
    }
  }
  next();
});

// Index for unique application per volunteer per opportunity
volunteerApplicationSchema.index({ opportunityId: 1, volunteerId: 1 }, { unique: true });

// Other indexes for efficient queries
volunteerApplicationSchema.index({ campaignId: 1 });
volunteerApplicationSchema.index({ volunteerId: 1 });
volunteerApplicationSchema.index({ status: 1 });
volunteerApplicationSchema.index({ 'timeline.submittedAt': -1 });
volunteerApplicationSchema.index({ 'matching.aiScore': -1 });
volunteerApplicationSchema.index({ 'review.score.overall': -1 });
volunteerApplicationSchema.index({ 'interview.scheduledDate': 1 });

module.exports = mongoose.model('VolunteerApplication', volunteerApplicationSchema);
