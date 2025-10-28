import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isInitialized) {
      fetchNotifications();
      fetchUnreadCount();
      setIsInitialized(true);
    } else if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setIsInitialized(false);
    }
  }, [isAuthenticated, user, isInitialized]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const cleanup = notificationService.subscribeToNotifications(
      user._id,
      (data) => {
        if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        }
      }
    );

    return cleanup;
  }, [isAuthenticated, user]);

  const fetchNotifications = async (params = {}) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications({
        limit: 50,
        ...params
      });

      if (response.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({
            ...notification,
            isRead: true,
            readAt: new Date()
          }))
        );

        // Reset unread count
        setUnreadCount(0);
      }
      return response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        // Remove from local state
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification._id !== notificationId)
        );

        // Update unread count if it was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      return response;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      const response = await notificationService.archiveNotification(notificationId);
      if (response.success) {
        // Remove from local state (archived notifications are filtered out)
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification._id !== notificationId)
        );

        // Update unread count if it was unread
        const archivedNotification = notifications.find(n => n._id === notificationId);
        if (archivedNotification && !archivedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      return response;
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  };

  const addNotification = (notification) => {
    // Add new notification to the beginning of the list
    setNotifications(prevNotifications => [notification, ...prevNotifications]);

    // Update unread count if it's unread
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }

    // Show browser notification if permission is granted
    if (Notification.permission === 'granted' && !notification.isRead) {
      notificationService.showBrowserNotification(
        notification.title,
        {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification._id,
          data: {
            notificationId: notification._id,
            actionUrl: notification.actionUrl
          }
        }
      );
    }
  };

  const requestNotificationPermission = async () => {
    return await notificationService.requestNotificationPermission();
  };

  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.isRead);
  };

  const getRecentNotifications = (limit = 5) => {
    return notifications.slice(0, limit);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    isInitialized,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    addNotification,
    requestNotificationPermission,
    clearAllNotifications,

    // Getters
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,

    // Utils
    formatTimeAgo: notificationService.formatTimeAgo,
    getNotificationIcon: notificationService.getNotificationIcon,
    getNotificationColor: notificationService.getNotificationColor,
    getPriorityColor: notificationService.getPriorityColor
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
