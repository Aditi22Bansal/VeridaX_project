import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const FeedbackDashboard = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);

      // Get deliveries for this seller
      const deliveriesResponse = await fetch('/api/deliveries/seller', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const deliveriesData = await deliveriesResponse.json();

      if (deliveriesData.success) {
        const deliveries = deliveriesData.data;
        const feedbackPromises = deliveries.map(delivery =>
          fetch(`/api/deliveries/${delivery._id}/feedback`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(res => res.json())
        );

        const feedbackResponses = await Promise.all(feedbackPromises);
        const allFeedback = feedbackResponses
          .filter(response => response.success)
          .flatMap(response => response.data)
          .filter(fb => fb.toUserId === user._id);

        setFeedback(allFeedback);

        // Calculate stats
        const totalFeedbacks = allFeedback.length;
        const averageRating = totalFeedbacks > 0
          ? allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedbacks
          : 0;

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allFeedback.forEach(fb => {
          ratingDistribution[fb.rating]++;
        });

        setStats({
          totalFeedbacks,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getFeedbackTypeLabel = (type) => {
    switch (type) {
      case 'buyer-to-seller': return 'From Buyer';
      case 'volunteer-to-seller': return 'From Volunteer';
      default: return 'Feedback';
    }
  };

  const getFeedbackTypeIcon = (type) => {
    switch (type) {
      case 'buyer-to-seller': return <UserIcon className="w-5 h-5" />;
      case 'volunteer-to-seller': return <TruckIcon className="w-5 h-5" />;
      default: return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading feedback..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            Feedback Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-600"
          >
            See what customers and volunteers say about your service.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFeedbacks}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">5-Star Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ratingDistribution[5]}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <div className="flex items-center w-20">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current ml-1" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${stats.totalFeedbacks > 0 ? (stats.ratingDistribution[rating] / stats.totalFeedbacks) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm text-gray-600">{stats.ratingDistribution[rating]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feedback List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
          <div className="space-y-4">
            {feedback.length > 0 ? (
              feedback.slice(0, 10).map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        {getFeedbackTypeIcon(item.feedbackType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {getFeedbackTypeLabel(item.feedbackType)}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          {renderStars(item.rating)}
                          <span className="text-sm text-gray-600">({item.rating}/5)</span>
                        </div>
                        {item.review && (
                          <p className="text-gray-700">{item.review}</p>
                        )}

                        {/* Category Ratings */}
                        {item.categories && (
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                            {Object.entries(item.categories).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-1">
                                <span className="text-xs text-gray-600 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-600">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.status === 'approved' && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      )}
                      {item.status === 'pending' && (
                        <ClockIcon className="w-5 h-5 text-yellow-500" />
                      )}
                      {item.status === 'rejected' && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
                <p className="text-gray-600">You'll see customer and volunteer feedback here once they start reviewing your deliveries.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
