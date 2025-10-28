import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  ArchiveBoxIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../context/NotificationContext";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    fetchNotifications,
    getNotificationIcon,
    getNotificationColor,
    getPriorityColor,
    formatTimeAgo,
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter((notification) => {
    // Type filter
    if (filterType !== "all" && notification.type !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus === "unread" && notification.isRead) {
      return false;
    }
    if (filterStatus === "read" && !notification.isRead) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = notification.title
        .toLowerCase()
        .includes(searchLower);
      const matchesMessage = notification.message
        .toLowerCase()
        .includes(searchLower);
      if (!matchesTitle && !matchesMessage) {
        return false;
      }
    }

    return true;
  });

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n._id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      const unreadSelected = selectedNotifications.filter((id) => {
        const notification = notifications.find((n) => n._id === id);
        return notification && !notification.isRead;
      });

      await Promise.all(unreadSelected.map((id) => markAsRead(id)));
      setSelectedNotifications([]);
      toast.success(`Marked ${unreadSelected.length} notifications as read`);
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(`Delete ${selectedNotifications.length} notifications?`)
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedNotifications.map((id) => deleteNotification(id)),
      );
      setSelectedNotifications([]);
      toast.success(`Deleted ${selectedNotifications.length} notifications`);
    } catch (error) {
      toast.error("Failed to delete notifications");
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        selectedNotifications.map((id) => archiveNotification(id)),
      );
      setSelectedNotifications([]);
      toast.success(`Archived ${selectedNotifications.length} notifications`);
    } catch (error) {
      toast.error("Failed to archive notifications");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const notificationTypes = [
    { value: "all", label: "All Types" },
    { value: "volunteer_approved", label: "Application Approved" },
    { value: "volunteer_rejected", label: "Application Rejected" },
    { value: "volunteer_application_received", label: "New Applications" },
    { value: "volunteer_hours_logged", label: "Hours Logged" },
    { value: "project_update", label: "Project Updates" },
    { value: "system_alert", label: "System Alerts" },
  ];

  if (isLoading) {
    return <LoadingSpinner text="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BellIcon className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="mt-2 text-gray-600">
                  {unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="btn-secondary text-sm"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Mark All Read
              </button>
            )}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="input-field"
                  >
                    {notificationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-4 mb-6 bg-blue-50 border-blue-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedNotifications.length} notification
                {selectedNotifications.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Mark Read
                </button>
                <button
                  onClick={handleBulkArchive}
                  className="btn-outline text-sm py-1 px-3"
                >
                  <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                  Archive
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg transition-colors duration-200 text-sm"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredNotifications.length === 0 ? (
            <div className="card p-12 text-center">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterType !== "all" || filterStatus !== "all"
                  ? "No matching notifications"
                  : "No notifications yet"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters or search term."
                  : "You'll see notifications here when you have activity on your account."}
              </p>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="card p-4 mb-4 bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotifications.length ===
                      filteredNotifications.length
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Select all ({filteredNotifications.length})
                  </span>
                </label>
              </div>

              {/* Notification Items */}
              <div className="space-y-2">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`card overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group ${
                      notification.isRead
                        ? "bg-white"
                        : "bg-blue-50 border-l-4 border-l-primary-500"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(
                            notification._id,
                          )}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectNotification(notification._id);
                          }}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />

                        {/* Icon */}
                        <div className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3
                                className={`text-sm font-medium ${
                                  notification.isRead
                                    ? "text-gray-700"
                                    : "text-gray-900"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              <p
                                className={`text-sm mt-1 ${
                                  notification.isRead
                                    ? "text-gray-500"
                                    : "text-gray-600"
                                }`}
                              >
                                {notification.message}
                              </p>
                            </div>

                            {/* Priority Badge */}
                            {notification.priority !== "medium" && (
                              <span
                                className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                                  notification.priority,
                                )}`}
                              >
                                {notification.priority}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>

                            {/* Action Buttons */}
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification._id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  title="Mark as read"
                                >
                                  <CheckIcon className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveNotification(notification._id);
                                }}
                                className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                                title="Archive"
                              >
                                <ArchiveBoxIcon className="w-4 h-4" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm("Delete this notification?")
                                  ) {
                                    deleteNotification(notification._id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Load More */}
        {filteredNotifications.length >= 20 && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchNotifications({ limit: 50 })}
              className="btn-outline"
            >
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
