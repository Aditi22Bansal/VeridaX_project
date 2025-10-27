import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  StarIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';

const SellerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch seller profile
      const sellerResponse = await fetch('/api/bazaar/sellers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const sellerData = await sellerResponse.json();

      if (sellerData.success && sellerData.data.sellers.length > 0) {
        setSeller(sellerData.data.sellers[0]);
      }

      // Fetch seller's products
      const productsResponse = await fetch('/api/bazaar/sellers/my-products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const productsData = await productsResponse.json();

      if (productsData.success) {
        setProducts(productsData.data);
      }

      // Fetch seller stats
      const statsResponse = await fetch('/api/bazaar/sellers/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data.stats);
        setRecentOrders(statsData.data.recentOrders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/bazaar/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setProducts(products.filter(p => p._id !== productId));
          alert('Product deleted successfully!');
        } else {
          alert(data.message || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your products and track performance
              </p>
            </div>
            <Link to="/bazaar/seller/add-product" className="btn-primary flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalSales?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProducts || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <StarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <div className="flex items-center space-x-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <StarIconSolid className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-500">
                    ({stats.totalRatings || 0})
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <Link to="/bazaar/seller/orders" className="text-primary-600 hover:text-primary-700 text-sm">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Order #{order._id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.buyerId?.name || 'Unknown Buyer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${order.totalAmount?.toFixed(2)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
                <Link to="/bazaar/seller/products" className="text-primary-600 hover:text-primary-700 text-sm">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No products yet</p>
                  <Link to="/bazaar/seller/add-product" className="btn-primary">
                    Add Your First Product
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <div key={product._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={product.images[0] || '/api/placeholder/60/60'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${product.price} • {product.stock} in stock
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                        <div className="flex space-x-1">
                          <Link
                            to={`/bazaar/product/${product._id}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/bazaar/seller/edit-product/${product._id}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/bazaar/seller/add-product"
              className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <PlusIcon className="w-6 h-6 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Add Product</p>
                <p className="text-sm text-gray-500">List a new item for sale</p>
              </div>
            </Link>

            <Link
              to="/bazaar/seller/orders"
              className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <TruckIcon className="w-6 h-6 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage Orders</p>
                <p className="text-sm text-gray-500">Track and fulfill orders</p>
              </div>
            </Link>

            <Link
              to="/bazaar/shop"
              className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <ChartBarIcon className="w-6 h-6 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">View My Shop</p>
                <p className="text-sm text-gray-500">See how customers view your shop</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
