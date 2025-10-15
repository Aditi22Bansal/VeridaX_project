const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        maxlength: [100, 'Team name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
            enum: ['view', 'edit', 'manage', 'admin'],
            default: 'view'
        }],
        joinedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending', 'suspended'],
            default: 'active'
        },
        skills: [String],
        responsibilities: [String],
        timeCommitment: {
            hoursPerWeek: Number,
            availability: String
        },
        performance: {
            rating: {
                type: Number,
                min: 1,
                max: 5,
                default: 0
            },
            tasksCompleted: {
                type: Number,
                default: 0
            },
            lastActive: Date
        }
    }],
    structure: {
        hierarchy: {
            type: String,
            enum: ['flat', 'hierarchical', 'matrix'],
            default: 'flat'
        },
        departments: [{
            name: String,
            description: String,
            head: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            members: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }],
        reportingStructure: [{
            manager: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            subordinates: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }]
        }]
    },
    communication: {
        channels: [{
            name: String,
            type: {
                type: String,
                enum: ['general', 'announcements', 'discussions', 'tasks', 'resources', 'random'],
                default: 'general'
            },
            description: String,
            members: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            isPrivate: {
                type: Boolean,
                default: false
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        meetings: [{
            title: String,
            description: String,
            scheduledAt: Date,
            duration: Number,
            type: {
                type: String,
                enum: ['team', 'planning', 'review', 'standup', 'retrospective', 'other'],
                default: 'team'
            },
            attendees: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            meetingLink: String,
            agenda: [String],
            notes: String,
            recording: String,
            status: {
                type: String,
                enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
                default: 'scheduled'
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }]
    },
    tasks: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        assignedTo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        dueDate: Date,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled'],
            default: 'todo'
        },
        tags: [String],
        dependencies: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        }],
        subtasks: [{
            title: String,
            completed: {
                type: Boolean,
                default: false
            },
            assignedTo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        comments: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            content: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        attachments: [{
            name: String,
            url: String,
            type: String,
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
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
    }],
    resources: {
        documents: [{
            name: String,
            type: String,
            url: String,
            description: String,
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            },
            tags: [String],
            isPublic: {
                type: Boolean,
                default: true
            }
        }],
        tools: [{
            name: String,
            type: String,
            url: String,
            description: String,
            addedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }],
        links: [{
            title: String,
            url: String,
            description: String,
            category: String,
            addedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    settings: {
        allowSelfJoin: {
            type: Boolean,
            default: false
        },
        requireApproval: {
            type: Boolean,
            default: true
        },
        maxMembers: {
            type: Number,
            default: 50
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
            meetingReminders: {
                type: Boolean,
                default: true
            },
            generalUpdates: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            showMembers: {
                type: Boolean,
                default: true
            },
            showTasks: {
                type: Boolean,
                default: true
            },
            showResources: {
                type: Boolean,
                default: true
            }
        },
        workingHours: {
            timezone: String,
            startTime: String,
            endTime: String,
            workingDays: [{
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            }]
        }
    },
    stats: {
        totalTasks: {
            type: Number,
            default: 0
        },
        completedTasks: {
            type: Number,
            default: 0
        },
        activeMembers: {
            type: Number,
            default: 0
        },
        averageTaskCompletionTime: {
            type: Number,
            default: 0
        },
        teamSatisfaction: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes
teamSchema.index({ project: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ name: 'text', description: 'text' });

// Virtual for team size
teamSchema.virtual('teamSize').get(function() {
    return this.members.filter(member => member.status === 'active').length;
});

// Virtual for task completion rate
teamSchema.virtual('taskCompletionRate').get(function() {
    if (this.stats.totalTasks === 0) return 0;
    return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
});

// Method to add team member
teamSchema.methods.addMember = function(userId, role, permissions = ['view']) {
    const existingMember = this.members.find(member =>
        member.user.toString() === userId.toString()
    );

    if (existingMember) {
        throw new Error('User is already a team member');
    }

    if (this.members.length >= this.settings.maxMembers) {
        throw new Error('Team has reached maximum member limit');
    }

    this.members.push({
        user: userId,
        role,
        permissions,
        joinedAt: new Date(),
        status: 'active'
    });

    this.stats.activeMembers = this.members.filter(m => m.status === 'active').length;
    return this.save();
};

// Method to remove team member
teamSchema.methods.removeMember = function(userId) {
    this.members = this.members.filter(member =>
        member.user.toString() !== userId.toString()
    );

    this.stats.activeMembers = this.members.filter(m => m.status === 'active').length;
    return this.save();
};

// Method to update member role
teamSchema.methods.updateMemberRole = function(userId, newRole, newPermissions) {
    const member = this.members.find(member =>
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
teamSchema.methods.addTask = function(taskData) {
    this.tasks.push({
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    this.stats.totalTasks += 1;
    return this.save();
};

// Method to update task
teamSchema.methods.updateTask = function(taskId, updates) {
    const task = this.tasks.id(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const wasCompleted = task.status === 'completed';

    Object.assign(task, updates);
    task.updatedAt = new Date();

    if (updates.status === 'completed' && !wasCompleted) {
        task.completedAt = new Date();
        this.stats.completedTasks += 1;
    } else if (updates.status !== 'completed' && wasCompleted) {
        this.stats.completedTasks -= 1;
    }

    return this.save();
};

// Method to add comment to task
teamSchema.methods.addTaskComment = function(taskId, userId, content) {
    const task = this.tasks.id(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    task.comments.push({
        user: userId,
        content,
        createdAt: new Date()
    });

    return this.save();
};

// Method to create communication channel
teamSchema.methods.createChannel = function(channelData) {
    this.communication.channels.push({
        ...channelData,
        createdBy: channelData.createdBy,
        createdAt: new Date()
    });
    return this.save();
};

// Method to schedule meeting
teamSchema.methods.scheduleMeeting = function(meetingData) {
    this.communication.meetings.push({
        ...meetingData,
        createdBy: meetingData.createdBy,
        status: 'scheduled'
    });
    return this.save();
};

// Method to add resource
teamSchema.methods.addResource = function(resourceData) {
    this.resources.documents.push({
        ...resourceData,
        uploadedBy: resourceData.uploadedBy,
        uploadedAt: new Date()
    });
    return this.save();
};

// Method to get team performance
teamSchema.methods.getTeamPerformance = function() {
    const activeMembers = this.members.filter(m => m.status === 'active');
    const totalTasks = this.stats.totalTasks;
    const completedTasks = this.stats.completedTasks;

    const memberPerformance = activeMembers.map(member => ({
        user: member.user,
        role: member.role,
        tasksCompleted: member.performance.tasksCompleted,
        rating: member.performance.rating,
        lastActive: member.performance.lastActive
    }));

    return {
        teamSize: activeMembers.length,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        averageRating: activeMembers.length > 0 ?
            activeMembers.reduce((sum, m) => sum + m.performance.rating, 0) / activeMembers.length : 0,
        memberPerformance
    };
};

// Static method to find teams by project
teamSchema.statics.findByProject = function(projectId) {
    return this.find({ project: projectId })
        .populate('leader', 'name email')
        .populate('members.user', 'name email')
        .populate('project', 'title description');
};

// Static method to find teams by member
teamSchema.statics.findByMember = function(userId) {
    return this.find({ 'members.user': userId })
        .populate('leader', 'name email')
        .populate('project', 'title description');
};

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;

