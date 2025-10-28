const mongoose = require("mongoose");

const volunteerRegistrationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["registered", "under-review", "approved", "rejected", "completed"],
      default: "registered",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },

    // Application Details
    motivation: {
      type: String,
      required: false,
      maxlength: [1000, "Motivation cannot be more than 1000 characters"],
    },

    availability: {
      hoursPerWeek: {
        type: Number,
        min: [1, "Hours per week must be at least 1"],
        max: [40, "Hours per week cannot exceed 40"],
      },
      startDate: {
        type: Date,
        required: false,
      },
    },

    experience: {
      relevantExperience: {
        type: String,
        maxlength: [
          1000,
          "Experience description cannot be more than 1000 characters",
        ],
      },
      skills: [
        {
          skill: {
            type: String,
            required: true,
          },
          level: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "expert"],
            default: "intermediate",
          },
        },
      ],
    },

    // Contact and Communication
    contactInfo: {
      preferredMethod: {
        type: String,
        enum: ["email", "phone", "whatsapp"],
        default: "email",
      },
      phoneNumber: {
        type: String,
        validate: {
          validator: function (v) {
            return !v || /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
          },
          message: "Invalid phone number format",
        },
      },
    },

    // Review and Assessment
    review: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: Date,
      reviewNotes: {
        type: String,
        maxlength: [500, "Review notes cannot be more than 500 characters"],
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    // Administrative Notes
    notes: {
      type: String,
      maxlength: [500, "Notes cannot be more than 500 characters"],
    },

    // Interview Information (if applicable)
    interview: {
      scheduled: {
        type: Boolean,
        default: false,
      },
      scheduledDate: Date,
      interviewType: {
        type: String,
        enum: ["phone", "video", "in-person"],
        default: "video",
      },
      interviewNotes: String,
      conducted: {
        type: Boolean,
        default: false,
      },
      conductedDate: Date,
    },

    // Volunteering Record
    volunteeringRecord: {
      totalHours: {
        type: Number,
        default: 0,
        min: 0,
      },
      hoursLogged: [
        {
          date: {
            type: Date,
            required: true,
          },
          hours: {
            type: Number,
            required: true,
            min: 0.5,
            max: 24,
          },
          activity: {
            type: String,
            required: true,
            maxlength: 200,
          },
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          verifiedAt: Date,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      performance: {
        punctuality: {
          type: Number,
          min: 1,
          max: 5,
        },
        reliability: {
          type: Number,
          min: 1,
          max: 5,
        },
        teamwork: {
          type: Number,
          min: 1,
          max: 5,
        },
        initiative: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

// Ensure one registration per volunteer per campaign
volunteerRegistrationSchema.index(
  { campaignId: 1, volunteerId: 1 },
  { unique: true },
);

// Additional indexes for efficient queries
volunteerRegistrationSchema.index({ status: 1 });
volunteerRegistrationSchema.index({ registeredAt: -1 });
volunteerRegistrationSchema.index({ "availability.startDate": 1 });

// Virtual for application age
volunteerRegistrationSchema.virtual("applicationAge").get(function () {
  const now = new Date();
  const registered = this.registeredAt;
  return Math.floor((now - registered) / (1000 * 60 * 60 * 24));
});

// Virtual for skills array (for easier access)
volunteerRegistrationSchema.virtual("skillsList").get(function () {
  return this.experience.skills.map((s) => s.skill);
});

// Update status timestamps
volunteerRegistrationSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date();

    if (this.status === "approved" && !this.approvedAt) {
      this.approvedAt = now;
    }

    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = now;
    }

    if (
      this.status === "under-review" &&
      this.review &&
      !this.review.reviewedAt
    ) {
      this.review.reviewedAt = now;
    }
  }

  // Validate start date is not in the past (only for new applications)
  if (
    this.isNew &&
    this.availability.startDate &&
    this.availability.startDate < new Date()
  ) {
    return next(new Error("Start date cannot be in the past"));
  }

  next();
});

// Instance methods
volunteerRegistrationSchema.methods.updateStatus = function (
  newStatus,
  updatedBy,
  notes,
) {
  this.status = newStatus;

  if (notes) {
    this.notes = notes;
  }

  if (updatedBy && (newStatus === "approved" || newStatus === "rejected")) {
    this.review = this.review || {};
    this.review.reviewedBy = updatedBy;
    this.review.reviewedAt = new Date();
    if (notes) {
      this.review.reviewNotes = notes;
    }
  }

  return this.save();
};

volunteerRegistrationSchema.methods.logHours = function (
  date,
  hours,
  activity,
  verifiedBy = null,
) {
  this.volunteeringRecord.hoursLogged.push({
    date,
    hours,
    activity,
    verifiedBy,
    verifiedAt: verifiedBy ? new Date() : null,
  });

  this.volunteeringRecord.totalHours += hours;
  return this.save();
};

volunteerRegistrationSchema.methods.scheduleInterview = function (
  date,
  type = "video",
) {
  this.interview = {
    scheduled: true,
    scheduledDate: date,
    interviewType: type,
    conducted: false,
  };

  this.status = "under-review";
  return this.save();
};

volunteerRegistrationSchema.methods.completeInterview = function (notes) {
  if (!this.interview.scheduled) {
    throw new Error("No interview scheduled");
  }

  this.interview.conducted = true;
  this.interview.conductedDate = new Date();

  if (notes) {
    this.interview.interviewNotes = notes;
  }

  return this.save();
};

// Static methods
volunteerRegistrationSchema.statics.getApplicationsByStatus = function (
  status,
) {
  return this.find({ status })
    .populate("volunteerId", "name email avatar")
    .populate("campaignId", "title category")
    .sort({ registeredAt: -1 });
};

volunteerRegistrationSchema.statics.getCampaignApplications = function (
  campaignId,
) {
  return this.find({ campaignId })
    .populate("volunteerId", "name email avatar")
    .sort({ registeredAt: -1 });
};

volunteerRegistrationSchema.statics.getVolunteerApplications = function (
  volunteerId,
) {
  return this.find({ volunteerId })
    .populate("campaignId", "title category imageURL")
    .sort({ registeredAt: -1 });
};

module.exports = mongoose.model(
  "VolunteerRegistration",
  volunteerRegistrationSchema,
);
