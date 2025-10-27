import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  TruckIcon,
  HomeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/bazaar/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Order Placed Successfully!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your order has been confirmed and will be processed soon.
          </p>

          {order && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium text-gray-900">#{order._id.slice(-8)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium text-gray-900">${order.totalAmount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/bazaar"
              className="btn-primary flex items-center justify-center space-x-2 px-6 py-3"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>

            <Link
              to="/"
              className="btn-outline flex items-center justify-center space-x-2 px-6 py-3"
            >
              <HomeIcon className="w-5 h-5" />
              <span>Go Home</span>
            </Link>
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <TruckIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">What's Next?</h3>
            </div>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• You will receive an email confirmation shortly</p>
              <p>• The seller will process your order within 1-2 business days</p>
              <p>• You'll receive tracking information once your order ships</p>
              <p>• Estimated delivery: 5-7 business days</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess;
