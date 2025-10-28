const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/notificationController");

const { authenticateToken, requireAdmin } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

// GET /api/notifications - Get user notifications
router.get("/", getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get("/unread-count", getUnreadCount);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put("/mark-all-read", markAllAsRead);

// PUT /api/notifications/bulk-read - Bulk mark notifications as read
router.put("/bulk-read", bulkMarkAsRead);

// DELETE /api/notifications/bulk-delete - Bulk delete notifications
router.delete("/bulk-delete", bulkDeleteNotifications);

// DELETE /api/notifications/cleanup - Clean up old notifications (admin only)
router.delete("/cleanup", requireAdmin, cleanupOldNotifications);

// POST /api/notifications - Create notification (admin only, for testing)
router.post("/", requireAdmin, createNotification);

// GET /api/notifications/:id - Get specific notification
router.get("/:id", getNotification);

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put("/:id/read", markAsRead);

// PUT /api/notifications/:id/archive - Archive specific notification
router.put("/:id/archive", archiveNotification);

// DELETE /api/notifications/:id - Delete specific notification
router.delete("/:id", deleteNotification);

module.exports = router;
