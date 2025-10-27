const mongoose = require('mongoose');

const projectRoomSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Room name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  skills: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  requirements: {
    minVolunteers: {
      type: Number,
      default: 1,
      min: 1
    },
    maxVolunteers: {
      type: Number,
      min: 1
    },
    requiredSkills: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'completed'],
    default: 'active'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalFiles: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectRoomSchema.index({ campaignId: 1 });
projectRoomSchema.index({ 'members.userId': 1 });
projectRoomSchema.index({ skills: 1 });
projectRoomSchema.index({ status: 1 });

// Virtual for member count
projectRoomSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Virtual for checking if user is member
projectRoomSchema.virtual('isMember').get(function() {
  return (userId) => {
    return this.members.some(member =>
      member.userId.toString() === userId.toString() && member.isActive
    );
  };
});

// Virtual for checking if user is admin
projectRoomSchema.virtual('isAdmin').get(function() {
  return (userId) => {
    return this.members.some(member =>
      member.userId.toString() === userId.toString() &&
      member.isActive &&
      member.role === 'admin'
    );
  };
});

// Add member to room
projectRoomSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(member => member.userId.toString() === userId.toString());

  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = role;
    existingMember.joinedAt = new Date();
  } else {
    this.members.push({
      userId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  }

  this.lastActivity = new Date();
  return this.save();
};

// Remove member from room
projectRoomSchema.methods.removeMember = function(userId) {
  const member = this.members.find(member => member.userId.toString() === userId.toString());
  if (member) {
    member.isActive = false;
  }

  this.lastActivity = new Date();
  return this.save();
};

// Update member role
projectRoomSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => member.userId.toString() === userId.toString());
  if (member) {
    member.role = newRole;
  }

  this.lastActivity = new Date();
  return this.save();
};

// Check if user can join room
projectRoomSchema.methods.canUserJoin = function(userId, userSkills = []) {
  // Check if already a member
  if (this.isMember(userId)) {
    return { canJoin: false, reason: 'Already a member' };
  }

  // Check if room is public or user is invited
  if (!this.settings.isPublic && !this.settings.allowMemberInvites) {
    return { canJoin: false, reason: 'Room is private' };
  }

  // Check member limit
  if (this.requirements.maxVolunteers && this.memberCount >= this.requirements.maxVolunteers) {
    return { canJoin: false, reason: 'Room is full' };
  }

  // Check required skills
  if (this.requirements.requiredSkills.length > 0) {
    const hasRequiredSkills = this.requirements.requiredSkills.some(skill =>
      userSkills.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
    );

    if (!hasRequiredSkills) {
      return { canJoin: false, reason: 'Missing required skills' };
    }
  }

  return { canJoin: true, reason: 'Can join' };
};

// Update last activity
projectRoomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.statistics.activeMembers = this.members.filter(member => member.isActive).length;
  return this.save();
};

module.exports = mongoose.model('ProjectRoom', projectRoomSchema);
