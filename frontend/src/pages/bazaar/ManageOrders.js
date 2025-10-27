import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bazaar/orders/seller', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/bazaar/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setOrders(orders.map(order =>
          order._id === orderId
            ? { ...order, status: newStatus }
            : order
        ));
        alert('Order status updated successfully!');
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'shipped': return <TruckIcon className="w-4 h-4" />;
      case 'delivered': return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'shipped';
      case 'shipped': return 'delivered';
      default: return null;
    }
  };

  const getStatusButtonText = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return 'Confirm Order';
      case 'confirmed': return 'Mark as Shipped';
      case 'shipped': return 'Mark as Delivered';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
          <p className="text-gray-600 mt-2">
            Track and manage all your customer orders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">
                {filter === 'all'
                  ? "You don't have any orders yet."
                  : `No orders with status "${filter}".`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order._id.slice(-8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-medium text-gray-900">
                            {order.buyerId?.name || 'Unknown Customer'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="font-medium text-gray-900">
                            ${order.totalAmount?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Items</p>
                          <p className="font-medium text-gray-900">
                            {order.items?.length || 0} item(s)
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                        <div className="space-y-2">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3 text-sm">
                              <span className="text-gray-600">{item.quantity}x</span>
                              <span className="text-gray-900">{item.productId?.name || 'Product'}</span>
                              <span className="text-gray-500">${item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Shipping Address:</h4>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-6">
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, getNextStatus(order.status))}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          {getStatusButtonText(order.status)}
                        </button>
                      )}

                      <button className="btn-outline text-sm px-4 py-2 flex items-center space-x-2">
                        <EyeIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TruckIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Shipped</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'shipped').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
