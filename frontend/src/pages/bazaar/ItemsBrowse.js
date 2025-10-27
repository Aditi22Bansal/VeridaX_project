import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ShoppingCartIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const ItemsBrowse = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  const { addItem, isInCart } = useCart();
  const { user } = useAuth();

  const categories = [
    'handmade', 'eco-friendly', 'artisan', 'upcycled',
    'organic', 'sustainable', 'community-crafted', 'other'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'name', label: 'Name A-Z' }
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      params.append('sortBy', sortBy);
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/bazaar/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product) => {
    addItem(product, 1);
  };

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

  const getImpactMessage = (category) => {
    const impactMessages = {
      'eco-friendly': '🌱 Reduces environmental impact',
      'handmade': '✋ Supports local artisans',
      'upcycled': '♻️ Gives new life to materials',
      'organic': '🌿 Chemical-free production',
      'sustainable': '🌍 Long-term environmental benefit',
      'community-crafted': '🤝 Strengthens community bonds'
    };
    return impactMessages[category] || '💚 Makes a positive impact';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VeridaBazaar</h1>
          <p className="text-gray-600">Discover sustainable, handmade products from local artisans</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ShoppingCartIcon className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
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

                    {/* Impact Badge */}
                    <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {getImpactMessage(product.category)}
                    </div>
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
  );
};

export default ItemsBrowse;
