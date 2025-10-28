const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "room_invite",
        "room_message",
        "room_mention",
        "room_announcement",
        "project_update",
        "task_assigned",
        "task_completed",
        "deadline_reminder",
        "skill_match",
        "member_joined",
        "member_left",
        "file_shared",
        "system_alert",
        "volunteer_approved",
        "volunteer_rejected",
        "volunteer_application_received",
        "volunteer_hours_logged",
        "volunteer_milestone",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, "Message cannot be more than 500 characters"],
    },
    data: {
      roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectRoom",
      },
      campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
      },
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomMessage",
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
    actionUrl: {
      type: String,
      maxlength: [500, "Action URL cannot be more than 500 characters"],
    },
    actionText: {
      type: String,
      maxlength: [100, "Action text cannot be more than 100 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 });

// Virtual for notification age
notificationSchema.virtual("age").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return Math.floor(diff / 86400000) + "d ago";
});

// Mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Archive notification
notificationSchema.methods.archive = function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Static methods for creating common notifications
notificationSchema.statics.createRoomInvite = function (
  userId,
  roomId,
  inviterId,
) {
  return this.create({
    userId,
    type: "room_invite",
    title: "Room Invitation",
    message: "You have been invited to join a project room",
    data: {
      roomId,
      senderId: inviterId,
    },
    priority: "medium",
    actionUrl: "/vverse/room/" + roomId,
    actionText: "Join Room",
  });
};

notificationSchema.statics.createRoomMessage = function (
  userId,
  roomId,
  messageId,
  senderId,
) {
  return this.create({
    userId,
    type: "room_message",
    title: "New Message",
    message: "You have a new message in a project room",
    data: {
      roomId,
      messageId,
      senderId,
    },
    priority: "low",
    actionUrl: "/vverse/room/" + roomId,
    actionText: "View Message",
  });
};

notificationSchema.statics.createRoomMention = function (
  userId,
  roomId,
  messageId,
  senderId,
) {
  return this.create({
    userId,
    type: "room_mention",
    title: "You were mentioned",
    message: "Someone mentioned you in a project room",
    data: {
      roomId,
      messageId,
      senderId,
    },
    priority: "high",
    actionUrl: "/vverse/room/" + roomId,
    actionText: "View Message",
  });
};

notificationSchema.statics.createSkillMatch = function (
  userId,
  roomId,
  matchedSkills,
) {
  return this.create({
    userId,
    type: "skill_match",
    title: "Skill Match Found",
    message: "Your skills match a project: " + matchedSkills.join(", "),
    data: {
      roomId,
      metadata: {
        matchedSkills,
      },
    },
    priority: "medium",
    actionUrl: "/vverse/room/" + roomId,
    actionText: "View Project",
  });
};

notificationSchema.statics.createProjectUpdate = function (
  userId,
  campaignId,
  updateType,
) {
  return this.create({
    userId,
    type: "project_update",
    title: "Project Update",
    message: "Project has been updated: " + updateType,
    data: {
      campaignId,
    },
    priority: "medium",
    actionUrl: "/campaign/" + campaignId,
    actionText: "View Project",
  });
};

// Volunteer-related notification methods
notificationSchema.statics.createVolunteerApproved = function (
  userId,
  campaignId,
  campaignTitle,
) {
  return this.create({
    userId,
    type: "volunteer_approved",
    title: "Volunteer Application Approved!",
    message: `Your volunteer application for "${campaignTitle}" has been approved. Welcome to the team!`,
    data: {
      campaignId,
    },
    priority: "high",
    actionUrl: "/campaign/" + campaignId,
    actionText: "View Campaign",
  });
};

notificationSchema.statics.createVolunteerRejected = function (
  userId,
  campaignId,
  campaignTitle,
) {
  return this.create({
    userId,
    type: "volunteer_rejected",
    title: "Volunteer Application Update",
    message: `Thank you for your interest in "${campaignTitle}". Unfortunately, your application was not selected at this time.`,
    data: {
      campaignId,
    },
    priority: "medium",
    actionUrl: "/campaign/" + campaignId,
    actionText: "View Campaign",
  });
};

notificationSchema.statics.createVolunteerApplicationReceived = function (
  userId,
  campaignId,
  campaignTitle,
  volunteerName,
) {
  return this.create({
    userId,
    type: "volunteer_application_received",
    title: "New Volunteer Application",
    message: `${volunteerName} has applied to volunteer for "${campaignTitle}". Review their application now.`,
    data: {
      campaignId,
    },
    priority: "medium",
    actionUrl: "/admin/my-campaigns",
    actionText: "Review Application",
  });
};

notificationSchema.statics.createVolunteerHoursLogged = function (
  userId,
  campaignId,
  campaignTitle,
  hours,
) {
  return this.create({
    userId,
    type: "volunteer_hours_logged",
    title: "Volunteer Hours Logged",
    message: `${hours} volunteer hours have been logged for "${campaignTitle}". Thank you for your contribution!`,
    data: {
      campaignId,
      metadata: { hours },
    },
    priority: "low",
    actionUrl: "/volunteer/dashboard",
    actionText: "View Dashboard",
  });
};

// Get user notifications
notificationSchema.statics.getUserNotifications = function (
  userId,
  options = {},
) {
  const { limit = 20, skip = 0, type, isRead, priority } = options;

  const query = { userId, isArchived: false };

  if (type) query.type = type;
  if (isRead !== undefined) query.isRead = isRead;
  if (priority) query.priority = priority;

  return this.find(query)
    .populate("data.roomId", "name description")
    .populate("data.campaignId", "title description")
    .populate("data.senderId", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    isArchived: false,
  });
};

// Mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
};

// Clean up old notifications
notificationSchema.statics.cleanupOldNotifications = function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isArchived: true,
  });
};

module.exports = mongoose.model("Notification", notificationSchema);
