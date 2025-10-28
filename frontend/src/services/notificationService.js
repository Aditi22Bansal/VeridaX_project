import api from "./api";

class NotificationService {
  // Get user notifications
  async getNotifications(params = {}) {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.put("/notifications/mark-all-read");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Archive notification
  async archiveNotification(notificationId) {
    try {
      const response = await api.put(
        `/notifications/${notificationId}/archive`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get notification settings
  async getNotificationSettings() {
    try {
      const response = await api.get("/notifications/settings");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings) {
    try {
      const response = await api.put("/notifications/settings", settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Helper methods for formatting and display
  getNotificationIcon(type) {
    const iconMap = {
      volunteer_approved: "✅",
      volunteer_rejected: "❌",
      volunteer_application_received: "👋",
      volunteer_hours_logged: "⏰",
      volunteer_milestone: "🎯",
      room_invite: "🏠",
      room_message: "💬",
      room_mention: "📢",
      project_update: "🔄",
      task_assigned: "📋",
      task_completed: "✔️",
      skill_match: "🎯",
      system_alert: "⚠️",
      default: "📢",
    };

    return iconMap[type] || iconMap.default;
  }

  getNotificationColor(type) {
    const colorMap = {
      volunteer_approved: "green",
      volunteer_rejected: "red",
      volunteer_application_received: "blue",
      volunteer_hours_logged: "purple",
      volunteer_milestone: "yellow",
      room_invite: "indigo",
      room_message: "gray",
      room_mention: "orange",
      project_update: "blue",
      task_assigned: "cyan",
      task_completed: "green",
      skill_match: "purple",
      system_alert: "red",
      default: "gray",
    };

    return colorMap[type] || colorMap.default;
  }

  getPriorityColor(priority) {
    const priorityMap = {
      urgent: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-blue-100 text-blue-800 border-blue-200",
      low: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return priorityMap[priority] || priorityMap.medium;
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  }

  formatNotificationTitle(notification) {
    // Add any custom title formatting logic here
    return notification.title;
  }

  formatNotificationMessage(notification) {
    // Add any custom message formatting logic here
    return notification.message;
  }

  // Real-time notification helpers
  subscribeToNotifications(userId, callback) {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll implement a simple polling mechanism
    const pollInterval = 30000; // 30 seconds

    const poll = async () => {
      try {
        const response = await this.getUnreadCount();
        if (response.success) {
          callback({ type: "unread_count", count: response.data.count });
        }
      } catch (error) {
        console.error("Error polling notifications:", error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, pollInterval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Notification permission helpers (for browser notifications)
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return Notification.permission === "granted";
  }

  showBrowserNotification(title, options = {}) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  }

  // Bulk operations
  async markMultipleAsRead(notificationIds) {
    try {
      const promises = notificationIds.map((id) => this.markAsRead(id));
      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      throw error;
    }
  }

  async deleteMultiple(notificationIds) {
    try {
      const promises = notificationIds.map((id) => this.deleteNotification(id));
      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Filter and search helpers
  filterNotifications(notifications, filters = {}) {
    let filtered = [...notifications];

    if (filters.type) {
      filtered = filtered.filter((n) => n.type === filters.type);
    }

    if (filters.priority) {
      filtered = filtered.filter((n) => n.priority === filters.priority);
    }

    if (filters.isRead !== undefined) {
      filtered = filtered.filter((n) => n.isRead === filters.isRead);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((n) => new Date(n.createdAt) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter((n) => new Date(n.createdAt) <= toDate);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }

  // Sort notifications
  sortNotifications(notifications, sortBy = "createdAt", order = "desc") {
    const sorted = [...notifications].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "readAt") {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }

      if (order === "desc") {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    return sorted;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
