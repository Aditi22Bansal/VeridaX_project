import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
  EyeIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyShop = () => {
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  const { addItem, isInCart } = useCart();
  const { user } = useAuth();

  const fetchShopData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch seller profile
      const sellerResponse = await fetch('/api/bazaar/sellers/my-profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const sellerData = await sellerResponse.json();

      if (sellerData.success && sellerData.data) {
        const sellerInfo = sellerData.data;
        setSeller(sellerInfo);

        // Fetch seller's products
        const productsResponse = await fetch(`/api/bazaar/products?sellerId=${sellerInfo._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const productsData = await productsResponse.json();

        if (productsData.success) {
          const productsList = productsData.data.products || productsData.data || [];
          setProducts(productsList);
        }

        // Calculate shop stats
        const productsList = productsData.data.products || productsData.data || [];
        const shopStats = {
          totalProducts: productsList.length,
          averageRating: sellerInfo.averageRating || 0,
          totalSales: sellerInfo.totalSales || 0,
          memberSince: new Date(sellerInfo.createdAt).getFullYear()
        };
        setStats(shopStats);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIcon key={fullStars} className="w-4 h-4 text-yellow-400" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<StarIcon key={fullStars + i + 1} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Seller Profile Required</h2>
          <p className="text-gray-600 mb-6">
            You need to register as a seller to access your shop.
            {user && user.role === 'seller' ? ' Complete your seller profile setup.' : ' Register as a seller first.'}
          </p>
          <div className="space-x-4">
            {user && user.role === 'seller' ? (
              <Link to="/bazaar/seller/register" className="btn-primary">
                Complete Seller Setup
              </Link>
            ) : (
              <Link to="/bazaar/seller/register" className="btn-primary">
                Register as Seller
              </Link>
            )}
            <Link to="/bazaar" className="btn-outline">
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{seller.shopName || 'My Shop'}</h1>
                <p className="text-gray-600">by {seller.userId?.name || 'Unknown Seller'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(seller.averageRating || 0)}
                    <span className="text-sm text-gray-600 ml-1">
                      ({seller.averageRating?.toFixed(1) || '0.0'})
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="text-sm">{seller.location || 'Location not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{stats.totalSales}</div>
                <div className="text-sm text-gray-600">Sales</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{stats.memberSince}</div>
                <div className="text-sm text-gray-600">Member Since</div>
              </div>
            </div>
          </div>

          {/* Shop Description */}
          {seller.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">About This Shop</h3>
              <p className="text-gray-600">{seller.bio}</p>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Products ({products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-400 mb-4">
                <ShoppingCartIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">This seller hasn't added any products yet.</p>
              {user && user.role === 'seller' && (
                <Link to="/bazaar/seller/add-product" className="btn-primary">
                  Add Your First Product
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <Link to={`/bazaar/product/${product._id}`}>
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                      <button className="text-gray-400 hover:text-red-500 transition-colors">
                        <HeartIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                    {/* Rating */}
                    <div className="flex items-center space-x-1 mb-3">
                      <div className="flex">
                        {renderStars(product.averageRating || 0)}
                      </div>
                      <span className="text-sm text-gray-500">
                        ({product.ratings?.length || 0} reviews)
                      </span>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">${product.price}</span>
                        {product.stock > 0 ? (
                          <span className="text-sm text-green-600 ml-2">In Stock</span>
                        ) : (
                          <span className="text-sm text-red-600 ml-2">Out of Stock</span>
                        )}
                      </div>

                      {/* Check if current user is the seller */}
                      {user && product.sellerId && user.id === product.sellerId.userId ? (
                        <span className="text-blue-600 text-sm bg-blue-50 px-3 py-1 rounded-lg">
                          Your Product
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0 || isInCart(product._id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {isInCart(product._id) ? 'In Cart' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyShop;
