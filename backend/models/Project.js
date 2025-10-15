const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Project description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organization: {
        name: String,
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
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
            'Social Services', 'Research', 'Advocacy', 'Economic Development', 'Other'
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['planning', 'active', 'paused', 'completed', 'cancelled'],
        default: 'planning'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'invite-only'],
        default: 'public'
    },
    location: {
        type: {
            type: String,
            enum: ['global', 'regional', 'local', 'remote'],
            default: 'global'
        },
        countries: [String],
        regions: [String],
        cities: [String],
        coordinates: [{
            lat: Number,
            lng: Number,
            name: String
        }],
        timezone: String
    },
    timeline: {
        startDate: {
            type: Date,
            required: [true, 'Start date is required']
        },
        endDate: Date,
        duration: {
            type: String,
            enum: ['short-term', 'medium-term', 'long-term', 'ongoing'],
            required: true
        },
        milestones: [{
            title: String,
            description: String,
            dueDate: Date,
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: Date,
            assignedTo: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }]
    },
    goals: {
        primary: {
            type: String,
            required: [true, 'Primary goal is required']
        },
        secondary: [String],
        successMetrics: [{
            name: String,
            target: Number,
            current: {
                type: Number,
                default: 0
            },
            unit: String,
            description: String
        }]
    },
    team: {
        members: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            role: {
                type: String,
                required: true
            },
            permissions: [{
                type: String,
                enum: ['view', 'edit', 'manage', 'admin']
            }],
            joinedAt: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['active', 'inactive', 'pending'],
                default: 'active'
            },
            skills: [String],
            responsibilities: [String],
            timeCommitment: {
                hoursPerWeek: Number,
                availability: String
            }
        }],
        maxMembers: {
            type: Number,
            default: 50
        },
        requiredRoles: [{
            role: String,
            description: String,
            skills: [String],
            experience: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced', 'expert']
            },
            timeCommitment: String
        }],
        openPositions: [{
            role: String,
            description: String,
            requirements: [String],
            skills: [String],
            timeCommitment: String,
            postedAt: {
                type: Date,
                default: Date.now
            },
            applications: [{
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                appliedAt: {
                    type: Date,
                    default: Date.now
                },
                message: String,
                status: {
                    type: String,
                    enum: ['pending', 'accepted', 'rejected'],
                    default: 'pending'
                }
            }]
        }]
    },
    resources: {
        budget: {
            total: Number,
            currency: {
                type: String,
                default: 'USD'
            },
            allocated: Number,
            spent: {
                type: Number,
                default: 0
            }
        },
        tools: [{
            name: String,
            type: String,
            url: String,
            description: String
        }],
        documents: [{
            name: String,
            type: String,
            url: String,
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        externalLinks: [{
            title: String,
            url: String,
            description: String
        }]
    },
    collaboration: {
        communication: {
            platform: String,
            channels: [{
                name: String,
                type: {
                    type: String,
                    enum: ['general', 'announcements', 'discussions', 'tasks', 'resources']
                },
                description: String
            }]
        },
        meetings: [{
            title: String,
            description: String,
            scheduledAt: Date,
            duration: Number,
            type: {
                type: String,
                enum: ['team', 'planning', 'review', 'standup', 'other']
            },
            attendees: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            meetingLink: String,
            agenda: [String],
            notes: String,
            recording: String
        }],
        tasks: [{
            title: String,
            description: String,
            assignedTo: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            dueDate: Date,
            priority: {
                type: String,
                enum: ['low', 'medium', 'high', 'urgent'],
                default: 'medium'
            },
            status: {
                type: String,
                enum: ['todo', 'in-progress', 'review', 'completed'],
                default: 'todo'
            },
            tags: [String],
            dependencies: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task'
            }],
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            },
            completedAt: Date
        }]
    },
    impact: {
        description: String,
        targetAudience: [String],
        expectedOutcomes: [String],
        metrics: [{
            name: String,
            target: Number,
            current: {
                type: Number,
                default: 0
            },
            unit: String,
            description: String
        }],
        stories: [{
            title: String,
            description: String,
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    aiInsights: {
        lastUpdated: Date,
        skillGaps: [{
            skill: String,
            priority: String,
            currentLevel: String,
            requiredLevel: String
        }],
        recommendations: [{
            type: String,
            title: String,
            description: String,
            priority: String
        }],
        riskAssessment: {
            overall: String,
            factors: [{
                factor: String,
                level: String,
                mitigation: String
            }]
        },
        successProbability: Number,
        resourceOptimization: [{
            area: String,
            suggestion: String,
            impact: String
        }]
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
        },
        completionRate: {
            type: Number,
            default: 0
        }
    },
    settings: {
        allowApplications: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: true
        },
        notifications: {
            newMembers: {
                type: Boolean,
                default: true
            },
            taskUpdates: {
                type: Boolean,
                default: true
            },
            milestoneUpdates: {
                type: Boolean,
                default: true
            },
            generalUpdates: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            showTeamMembers: {
                type: Boolean,
                default: true
            },
            showProgress: {
                type: Boolean,
                default: true
            },
            showBudget: {
                type: Boolean,
                default: false
            }
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ 'location.countries': 1 });
projectSchema.index({ 'location.type': 1 });
projectSchema.index({ creator: 1 });
projectSchema.index({ 'team.members.user': 1 });
projectSchema.index({ status: 1, visibility: 1 });
projectSchema.index({ 'timeline.startDate': 1 });
projectSchema.index({ tags: 1 });

// Virtual for team size
projectSchema.virtual('teamSize').get(function() {
    return this.team.members.filter(member => member.status === 'active').length;
});

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
    if (!this.timeline.milestones || this.timeline.milestones.length === 0) {
        return 0;
    }
    const completed = this.timeline.milestones.filter(milestone => milestone.completed).length;
    return Math.round((completed / this.timeline.milestones.length) * 100);
});

// Virtual for budget utilization
projectSchema.virtual('budgetUtilization').get(function() {
    if (!this.resources.budget.total) {
        return 0;
    }
    return Math.round((this.resources.budget.spent / this.resources.budget.total) * 100);
});

// Method to add team member
projectSchema.methods.addTeamMember = function(userId, role, permissions = ['view']) {
    const existingMember = this.team.members.find(member =>
        member.user.toString() === userId.toString()
    );

    if (existingMember) {
        throw new Error('User is already a team member');
    }

    if (this.team.members.length >= this.team.maxMembers) {
        throw new Error('Project has reached maximum team size');
    }

    this.team.members.push({
        user: userId,
        role,
        permissions,
        joinedAt: new Date(),
        status: 'active'
    });

    return this.save();
};

// Method to remove team member
projectSchema.methods.removeTeamMember = function(userId) {
    this.team.members = this.team.members.filter(member =>
        member.user.toString() !== userId.toString()
    );
    return this.save();
};

// Method to update team member role
projectSchema.methods.updateTeamMemberRole = function(userId, newRole, newPermissions) {
    const member = this.team.members.find(member =>
        member.user.toString() === userId.toString()
    );

    if (!member) {
        throw new Error('Team member not found');
    }

    member.role = newRole;
    if (newPermissions) {
        member.permissions = newPermissions;
    }

    return this.save();
};

// Method to add task
projectSchema.methods.addTask = function(taskData) {
    this.collaboration.tasks.push({
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return this.save();
};

// Method to update task
projectSchema.methods.updateTask = function(taskId, updates) {
    const task = this.collaboration.tasks.id(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    Object.assign(task, updates);
    task.updatedAt = new Date();

    if (updates.status === 'completed') {
        task.completedAt = new Date();
    }

    return this.save();
};

// Method to add milestone
projectSchema.methods.addMilestone = function(milestoneData) {
    this.timeline.milestones.push(milestoneData);
    return this.save();
};

// Method to complete milestone
projectSchema.methods.completeMilestone = function(milestoneId) {
    const milestone = this.timeline.milestones.id(milestoneId);
    if (!milestone) {
        throw new Error('Milestone not found');
    }

    milestone.completed = true;
    milestone.completedAt = new Date();

    return this.save();
};

// Method to apply for open position
projectSchema.methods.applyForPosition = function(positionId, userId, message) {
    const position = this.team.openPositions.id(positionId);
    if (!position) {
        throw new Error('Position not found');
    }

    const existingApplication = position.applications.find(app =>
        app.user.toString() === userId.toString()
    );

    if (existingApplication) {
        throw new Error('Already applied for this position');
    }

    position.applications.push({
        user: userId,
        message,
        appliedAt: new Date()
    });

    return this.save();
};

// Static method to find projects by location
projectSchema.statics.findByLocation = function(country, region, city) {
    const query = { status: 'active', visibility: 'public' };

    if (country) {
        query['location.countries'] = country;
    }
    if (region) {
        query['location.regions'] = region;
    }
    if (city) {
        query['location.cities'] = city;
    }

    return this.find(query).populate('creator', 'name email').populate('team.members.user', 'name email');
};

// Static method to find projects by skills
projectSchema.statics.findBySkills = function(skills) {
    return this.find({
        status: 'active',
        visibility: 'public',
        'team.requiredRoles.skills': { $in: skills }
    }).populate('creator', 'name email');
};

// Static method to get trending projects
projectSchema.statics.getTrending = function(limit = 10) {
    return this.find({
        status: 'active',
        visibility: 'public'
    })
    .sort({ 'stats.views': -1, 'stats.applications': -1 })
    .limit(limit)
    .populate('creator', 'name email');
};

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;

