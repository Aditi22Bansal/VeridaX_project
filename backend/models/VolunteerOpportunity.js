const mongoose = require('mongoose');

const volunteerOpportunitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    organization: {
        name: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        logo: String,
        website: String
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Education', 'Healthcare', 'Environment', 'Technology', 'Arts & Culture',
            'Sports', 'Community Development', 'Animal Welfare', 'Disaster Relief',
            'Social Services', 'Research', 'Advocacy', 'Other'
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    skills: [{
        name: {
            type: String,
            required: true
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            required: true
        },
        required: {
            type: Boolean,
            default: false
        }
    }],
    location: {
        type: {
            type: String,
            enum: ['remote', 'on-site', 'hybrid'],
            default: 'on-site'
        },
        address: String,
        city: String,
        state: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        timezone: String
    },
    schedule: {
        startDate: {
            type: Date,
            required: [true, 'Start date is required']
        },
        endDate: Date,
        duration: {
            type: String,
            enum: ['one-time', 'short-term', 'long-term', 'ongoing'],
            required: true
        },
        hoursPerWeek: {
            min: Number,
            max: Number
        },
        flexible: {
            type: Boolean,
            default: false
        },
        timeSlots: [{
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            startTime: String,
            endTime: String
        }]
    },
    requirements: {
        age: {
            min: Number,
            max: Number
        },
        experience: {
            type: String,
            enum: ['none', 'some', 'experienced', 'expert']
        },
        education: {
            type: String,
            enum: ['none', 'high-school', 'bachelor', 'master', 'phd']
        },
        languages: [String],
        certifications: [String],
        backgroundCheck: {
            type: Boolean,
            default: false
        },
        other: [String]
    },
    benefits: {
        training: [String],
        certificates: [String],
        references: {
            type: Boolean,
            default: false
        },
        networking: {
            type: Boolean,
            default: false
        },
        other: [String]
    },
    impact: {
        description: String,
        metrics: [{
            name: String,
            target: Number,
            current: {
                type: Number,
                default: 0
            },
            unit: String
        }],
        beneficiaries: {
            type: String,
            enum: ['children', 'adults', 'seniors', 'families', 'communities', 'animals', 'environment', 'other']
        }
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
        default: 'draft'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'invite-only'],
        default: 'public'
    },
    applications: [{
        volunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
            default: 'pending'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        },
        message: String,
        availability: String,
        experience: String,
        motivation: String
    }],
    selectedVolunteers: [{
        volunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        selectedAt: {
            type: Date,
            default: Date.now
        },
        role: String,
        responsibilities: [String]
    }],
    maxVolunteers: {
        type: Number,
        default: 1
    },
    currentVolunteers: {
        type: Number,
        default: 0
    },
    tags: [String],
    images: [String],
    documents: [String],
    contact: {
        name: String,
        email: String,
        phone: String
    },
    aiRecommendations: {
        lastUpdated: Date,
        recommendedSkills: [String],
        difficultyScore: Number,
        popularityScore: Number,
        matchScore: Number
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        applications: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0
        },
        reviews: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
volunteerOpportunitySchema.index({ category: 1, status: 1 });
volunteerOpportunitySchema.index({ 'location.city': 1, 'location.country': 1 });
volunteerOpportunitySchema.index({ 'schedule.startDate': 1 });
volunteerOpportunitySchema.index({ 'skills.name': 1 });
volunteerOpportunitySchema.index({ 'organization.id': 1 });
volunteerOpportunitySchema.index({ status: 1, visibility: 1 });

// Virtual for application count
volunteerOpportunitySchema.virtual('applicationCount').get(function() {
    return this.applications.length;
});

// Virtual for completion status
volunteerOpportunitySchema.virtual('isCompleted').get(function() {
    return this.status === 'completed';
});

// Virtual for is full
volunteerOpportunitySchema.virtual('isFull').get(function() {
    return this.currentVolunteers >= this.maxVolunteers;
});

// Method to add application
volunteerOpportunitySchema.methods.addApplication = function(volunteerId, applicationData) {
    const existingApplication = this.applications.find(app =>
        app.volunteer.toString() === volunteerId.toString()
    );

    if (existingApplication) {
        throw new Error('Application already exists');
    }

    this.applications.push({
        volunteer: volunteerId,
        ...applicationData
    });

    this.stats.applications = this.applications.length;
    return this.save();
};

// Method to update application status
volunteerOpportunitySchema.methods.updateApplicationStatus = function(volunteerId, status) {
    const application = this.applications.find(app =>
        app.volunteer.toString() === volunteerId.toString()
    );

    if (!application) {
        throw new Error('Application not found');
    }

    application.status = status;

    if (status === 'accepted') {
        this.selectedVolunteers.push({
            volunteer: volunteerId,
            selectedAt: new Date()
        });
        this.currentVolunteers += 1;
    }

    return this.save();
};

// Method to calculate match score
volunteerOpportunitySchema.methods.calculateMatchScore = function(userSkills, userInterests) {
    let score = 0;
    let totalWeight = 0;

    // Skill matching
    this.skills.forEach(opportunitySkill => {
        const userSkill = userSkills.find(skill =>
            skill.name.toLowerCase() === opportunitySkill.name.toLowerCase()
        );

        if (userSkill) {
            const skillWeight = opportunitySkill.required ? 2 : 1;
            const levelMatch = this.getLevelMatchScore(userSkill.level, opportunitySkill.level);
            score += levelMatch * skillWeight;
            totalWeight += skillWeight;
        }
    });

    // Interest matching
    if (userInterests && userInterests.length > 0) {
        const interestMatch = userInterests.some(interest =>
            this.tags.some(tag =>
                tag.toLowerCase().includes(interest.toLowerCase()) ||
                interest.toLowerCase().includes(tag.toLowerCase())
            )
        );

        if (interestMatch) {
            score += 0.5;
            totalWeight += 0.5;
        }
    }

    // Category matching
    const categoryMatch = userInterests && userInterests.some(interest =>
        interest.toLowerCase() === this.category.toLowerCase()
    );

    if (categoryMatch) {
        score += 0.3;
        totalWeight += 0.3;
    }

    return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
};

// Helper method for level matching
volunteerOpportunitySchema.methods.getLevelMatchScore = function(userLevel, requiredLevel) {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const userIndex = levels.indexOf(userLevel);
    const requiredIndex = levels.indexOf(requiredLevel);

    if (userIndex >= requiredIndex) {
        return 1; // Perfect match or overqualified
    } else {
        return 0.5; // Partial match
    }
};

// Static method to find opportunities by skills
volunteerOpportunitySchema.statics.findBySkills = function(skills, options = {}) {
    const query = {
        status: 'active',
        visibility: 'public',
        ...options
    };

    if (skills && skills.length > 0) {
        query['skills.name'] = { $in: skills.map(skill => skill.name) };
    }

    return this.find(query).populate('organization.id', 'name email');
};

// Static method to get recommendations
volunteerOpportunitySchema.statics.getRecommendations = function(userId, userSkills, userInterests, limit = 10) {
    return this.find({
        status: 'active',
        visibility: 'public'
    })
    .populate('organization.id', 'name email')
    .then(opportunities => {
        return opportunities
            .map(opportunity => ({
                ...opportunity.toObject(),
                matchScore: opportunity.calculateMatchScore(userSkills, userInterests)
            }))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
    });
};

const VolunteerOpportunity = mongoose.model('VolunteerOpportunity', volunteerOpportunitySchema);
module.exports = VolunteerOpportunity;

