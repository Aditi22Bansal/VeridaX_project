const mongoose = require('mongoose');

const roomMessageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectRoom',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system', 'announcement'],
    default: 'text'
  },
  content: {
    text: {
      type: String,
      maxlength: [2000, 'Message cannot be more than 2000 characters']
    },
    file: {
      name: String,
      url: String,
      size: Number,
      type: String
    }
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomMessage'
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: {
    type: Date
  },
  metadata: {
    isAnnouncement: {
      type: Boolean,
      default: false
    },
    announcementType: {
      type: String,
      enum: ['general', 'urgent', 'milestone', 'deadline']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
roomMessageSchema.index({ roomId: 1, createdAt: -1 });
roomMessageSchema.index({ senderId: 1 });
roomMessageSchema.index({ 'mentions': 1 });
roomMessageSchema.index({ isPinned: 1 });

// Virtual for reaction count
roomMessageSchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Virtual for checking if user reacted
roomMessageSchema.virtual('hasUserReacted').get(function() {
  return (userId) => {
    return this.reactions.some(reaction => reaction.userId.toString() === userId.toString());
  };
});

// Add reaction to message
roomMessageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from user
  this.reactions = this.reactions.filter(reaction =>
    reaction.userId.toString() !== userId.toString()
  );

  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date()
  });

  return this.save();
};

// Remove reaction from message
roomMessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction =>
    reaction.userId.toString() !== userId.toString()
  );

  return this.save();
};

// Edit message
roomMessageSchema.methods.editMessage = function(newContent) {
  this.content.text = newContent;
  this.isEdited = true;
  this.editedAt = new Date();

  return this.save();
};

// Delete message (soft delete)
roomMessageSchema.methods.deleteMessage = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

// Pin message
roomMessageSchema.methods.pinMessage = function() {
  this.isPinned = true;
  this.pinnedAt = new Date();

  return this.save();
};

// Unpin message
roomMessageSchema.methods.unpinMessage = function() {
  this.isPinned = false;
  this.pinnedAt = undefined;

  return this.save();
};

// Create system message
roomMessageSchema.statics.createSystemMessage = function(roomId, content, type = 'system') {
  return this.create({
    roomId,
    senderId: null, // System messages don't have a sender
    messageType: 'system',
    content: {
      text: content
    },
    metadata: {
      isAnnouncement: type === 'announcement',
      announcementType: type === 'announcement' ? 'general' : undefined
    }
  });
};

// Create announcement message
roomMessageSchema.statics.createAnnouncement = function(roomId, content, announcementType = 'general', priority = 'medium') {
  return this.create({
    roomId,
    senderId: null,
    messageType: 'announcement',
    content: {
      text: content
    },
    metadata: {
      isAnnouncement: true,
      announcementType,
      priority
    }
  });
};

module.exports = mongoose.model('RoomMessage', roomMessageSchema);
