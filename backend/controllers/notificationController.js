const Notification = require("../models/Notification");

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const {
      limit = 20,
      skip = 0,
      type,
      isRead,
      priority,
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      type,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      priority,
    };

    const notifications = await Notification.getUserNotifications(
      req.user._id,
      options,
    );

    const totalCount = await Notification.countDocuments({
      userId: req.user._id,
      isArchived: false,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalNotifications: totalCount,
          hasNext: parseInt(skip) + parseInt(limit) < totalCount,
          hasPrev: parseInt(skip) > 0,
        },
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Archive notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
const archiveNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.archive();

    res.status(200).json({
      success: true,
      message: "Notification archived successfully",
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error("Archive notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Create notification (for testing/admin purposes)
// @route   POST /api/notifications
// @access  Private (Admin only)
const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, priority } = req.body;

    // If no userId provided, create for current user
    const targetUserId = userId || req.user._id;

    const notification = await Notification.create({
      userId: targetUserId,
      type,
      title,
      message,
      data: data || {},
      priority: priority || "medium",
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate("data.roomId", "name description")
      .populate("data.campaignId", "title description")
      .populate("data.senderId", "name avatar");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Mark as read when fetched individually
    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.status(200).json({
      success: true,
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error("Get notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Bulk mark notifications as read
// @route   PUT /api/notifications/bulk-read
// @access  Private
const bulkMarkAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification IDs provided",
      });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Bulk mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Bulk delete notifications
// @route   DELETE /api/notifications/bulk-delete
// @access  Private
const bulkDeleteNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification IDs provided",
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Notifications deleted successfully",
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error("Bulk delete notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Clean up old notifications
// @route   DELETE /api/notifications/cleanup
// @access  Private (Admin only)
const cleanupOldNotifications = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;

    const result = await Notification.cleanupOldNotifications(parseInt(daysOld));

    res.status(200).json({
      success: true,
      message: "Old notifications cleaned up",
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error("Cleanup notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  archiveNotification,
  createNotification,
  getNotification,
  bulkMarkAsRead,
  bulkDeleteNotifications,
  cleanupOldNotifications,
};
