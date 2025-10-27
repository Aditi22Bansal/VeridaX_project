import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DeliveryTracking = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    review: '',
    categories: {
      deliverySpeed: 5,
      communication: 5,
      productQuality: 5,
      packaging: 5,
      overallExperience: 5
    }
  });

  useEffect(() => {
    fetchDeliveries();
  }, [filter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/deliveries/volunteer?status=${filter === 'all' ? '' : filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setDeliveries(data.data);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Status updated to ${newStatus}`
        })
      });

      const data = await response.json();

      if (data.success) {
        setDeliveries(deliveries.map(delivery =>
          delivery._id === deliveryId
            ? { ...delivery, status: newStatus }
            : delivery
        ));
        toast.success('Delivery status updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Error updating delivery status. Please try again.');
    }
  };

  const handleFeedbackSubmit = async (deliveryId, feedbackType) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          feedbackType,
          rating: feedbackData.rating,
          review: feedbackData.review,
          categories: feedbackData.categories
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Feedback submitted successfully!');
        setShowFeedbackModal(false);
        setFeedbackData({
          rating: 5,
          review: '',
          categories: {
            deliverySpeed: 5,
            communication: 5,
            productQuality: 5,
            packaging: 5,
            overallExperience: 5
          }
        });
        // Refresh deliveries to show updated feedback status
        fetchDeliveries();
      } else {
        toast.error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked-up': return 'bg-yellow-100 text-yellow-800';
      case 'in-transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return <ClockIcon className="w-5 h-5" />;
      case 'picked-up': return <TruckIcon className="w-5 h-5" />;
      case 'in-transit': return <TruckIcon className="w-5 h-5" />;
      case 'delivered': return <CheckCircleIcon className="w-5 h-5" />;
      case 'failed': return <ExclamationTriangleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'assigned': return 'picked-up';
      case 'picked-up': return 'in-transit';
      case 'in-transit': return 'delivered';
      default: return null;
    }
  };

  const getNextStatusLabel = (currentStatus) => {
    switch (currentStatus) {
      case 'assigned': return 'Mark as Picked Up';
      case 'picked-up': return 'Mark as In Transit';
      case 'in-transit': return 'Mark as Delivered';
      default: return null;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your deliveries..." />;
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
            Delivery Tracking
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-600"
          >
            Track and manage your delivery assignments.
          </motion.p>
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All Deliveries' },
              { key: 'assigned', label: 'Assigned' },
              { key: 'picked-up', label: 'Picked Up' },
              { key: 'in-transit', label: 'In Transit' },
              { key: 'delivered', label: 'Delivered' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Deliveries Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {deliveries.map((delivery) => (
            <motion.div
              key={delivery._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(delivery.status)}`}>
                      {getStatusIcon(delivery.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Delivery #{delivery._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(delivery.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                    {delivery.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Order Details */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Buyer:</span> {delivery.buyerId?.name}</p>
                    <p><span className="font-medium">Seller:</span> {delivery.sellerId?.name}</p>
                    <p><span className="font-medium">Total:</span> ${delivery.orderId?.totalAmount}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{delivery.deliveryAddress.name}</p>
                    <p>{delivery.deliveryAddress.street}</p>
                    <p>{delivery.deliveryAddress.city}, {delivery.deliveryAddress.state} {delivery.deliveryAddress.zipCode}</p>
                    {delivery.deliveryAddress.phone && (
                      <p className="flex items-center mt-1">
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {delivery.deliveryAddress.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedDelivery(delivery)}
                    className="flex-1 btn-outline py-2 text-sm flex items-center justify-center"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View Details
                  </button>

                  {getNextStatus(delivery.status) && (
                    <button
                      onClick={() => handleStatusUpdate(delivery._id, getNextStatus(delivery.status))}
                      className="flex-1 btn-primary py-2 text-sm"
                    >
                      {getNextStatusLabel(delivery.status)}
                    </button>
                  )}

                  {delivery.status === 'delivered' && (
                    <button
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setShowFeedbackModal(true);
                      }}
                      className="flex-1 btn-outline py-2 text-sm flex items-center justify-center"
                    >
                      <StarIcon className="w-4 h-4 mr-2" />
                      {delivery.feedback && delivery.feedback.volunteerRating ? 'Update Feedback' : 'Give Feedback'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {deliveries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <TruckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-600">You don't have any deliveries for the selected filter.</p>
          </motion.div>
        )}
      </div>

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Delivery Details
                </h2>
                <button
                  onClick={() => setSelectedDelivery(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Status Timeline */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Status</h3>
                  <div className="flex items-center space-x-4">
                    {['assigned', 'picked-up', 'in-transit', 'delivered'].map((status, index) => (
                      <div key={status} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedDelivery.status === status
                            ? 'bg-primary-600 text-white'
                            : index < ['assigned', 'picked-up', 'in-transit', 'delivered'].indexOf(selectedDelivery.status)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {getStatusIcon(status)}
                        </div>
                        {index < 3 && (
                          <div className={`w-16 h-0.5 ${
                            index < ['assigned', 'picked-up', 'in-transit', 'delivered'].indexOf(selectedDelivery.status)
                              ? 'bg-green-600'
                              : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Pickup Address</h3>
                    <div className="text-sm text-gray-600">
                      <p>{selectedDelivery.pickupAddress.name}</p>
                      <p>{selectedDelivery.pickupAddress.street}</p>
                      <p>{selectedDelivery.pickupAddress.city}, {selectedDelivery.pickupAddress.state}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                    <div className="text-sm text-gray-600">
                      <p>{selectedDelivery.deliveryAddress.name}</p>
                      <p>{selectedDelivery.deliveryAddress.street}</p>
                      <p>{selectedDelivery.deliveryAddress.city}, {selectedDelivery.deliveryAddress.state}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedDelivery.orderId?.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.productId?.name || 'Product'}</span>
                        <span>${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Give Feedback
                </h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackData({ ...feedbackData, rating })}
                        className={`w-8 h-8 rounded-full ${
                          rating <= feedbackData.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        <StarIcon className="w-full h-full fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Ratings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Ratings
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: 'deliverySpeed', label: 'Delivery Speed' },
                      { key: 'communication', label: 'Communication' },
                      { key: 'productQuality', label: 'Product Quality' },
                      { key: 'packaging', label: 'Packaging' },
                      { key: 'overallExperience', label: 'Overall Experience' }
                    ].map((category) => (
                      <div key={category.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{category.label}</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setFeedbackData({
                                ...feedbackData,
                                categories: {
                                  ...feedbackData.categories,
                                  [category.key]: rating
                                }
                              })}
                              className={`w-6 h-6 rounded-full ${
                                rating <= feedbackData.categories[category.key]
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              <StarIcon className="w-full h-full fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review
                  </label>
                  <textarea
                    value={feedbackData.review}
                    onChange={(e) => setFeedbackData({ ...feedbackData, review: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                    placeholder="Share your experience..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleFeedbackSubmit(selectedDelivery._id, 'volunteer-to-seller')}
                    className="flex-1 btn-primary py-2"
                  >
                    Rate Seller
                  </button>
                  <button
                    onClick={() => handleFeedbackSubmit(selectedDelivery._id, 'volunteer-to-buyer')}
                    className="flex-1 btn-outline py-2"
                  >
                    Rate Buyer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;
