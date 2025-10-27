import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('isRead', filter === 'read');
      }

      const response = await fetch(`/api/vverse/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        console.warn('Notifications data is not an array:', data);
        setNotifications([]);
        if (data.message) {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/vverse/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/vverse/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true, readAt: new Date() }))
        );
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllNotifications = () => {
    setSelectedNotifications(notifications.map(n => n._id));
  };

  const deselectAllNotifications = () => {
    setSelectedNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'room_invite':
        return '🎉';
      case 'room_message':
        return '💬';
      case 'room_mention':
        return '👤';
      case 'room_announcement':
        return '📢';
      case 'project_update':
        return '📝';
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'deadline_reminder':
        return '⏰';
      case 'skill_match':
        return '⭐';
      case 'member_joined':
        return '👥';
      case 'member_left':
        return '👋';
      case 'file_shared':
        return '📎';
      case 'system_alert':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent') return 'border-red-200 bg-red-50';
    if (priority === 'high') return 'border-orange-200 bg-orange-50';
    if (priority === 'medium') return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner text="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Stay updated with your VVerse activities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {notifications.filter(n => !n.isRead).length} unread
              </div>
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="btn-outline text-sm"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'read', label: 'Read' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          {Array.isArray(notifications) && notifications.length > 0 ? (
            notifications.map((notification) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card p-4 border-l-4 ${getNotificationColor(notification.type, notification.priority)} ${
                  !notification.isRead ? 'ring-2 ring-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(notification.createdAt)}</span>
                          {notification.priority && (
                            <span className={`px-2 py-1 rounded-full ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              notification.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.priority}
                            </span>
                          )}
                          {!notification.isRead && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Mark as read"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        )}
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {notification.actionText || 'View'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No notifications' :
                 filter === 'unread' ? 'No unread notifications' :
                 'No read notifications'}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' ? 'You\'re all caught up!' :
                 filter === 'unread' ? 'All notifications have been read!' :
                 'No read notifications yet'}
              </p>
            </div>
          )}
        </div>

        {/* Load More */}
        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <button className="btn-outline">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
