import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingCartIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const BazaarHome = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { addItem, isInCart, getItemQuantity } = useCart();

  // Fetch products
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/bazaar/products?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [filters, currentPage, fetchProducts]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
  };

  const categories = [
    'handmade', 'eco-friendly', 'artisan', 'upcycled',
    'organic', 'sustainable', 'community-crafted', 'other'
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'averageRating', label: 'Highest Rated' },
    { value: 'name', label: 'Name A-Z' }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIconSolid
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const ProductCard = ({ product }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover group"
    >
      <div className="relative">
        <img
          src={product.images[0] || '/api/placeholder/300/200'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <button className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
            <HeartIcon className="w-4 h-4 text-gray-600" />
          </button>
          <Link
            to={`/bazaar/product/${product._id}`}
            className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
          >
            <EyeIcon className="w-4 h-4 text-gray-600" />
          </Link>
        </div>
        {product.sustainabilityRating >= 4 && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Eco-Friendly
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category}
          </span>
          <div className="flex items-center space-x-1">
            {renderStars(product.averageRating)}
            <span className="text-sm text-gray-600 ml-1">
              ({product.totalRatings})
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-primary-600">
              ${product.price}
            </span>
            {product.deliveryInfo?.shippingCost > 0 && (
              <span className="text-sm text-gray-500 ml-1">
                +${product.deliveryInfo.shippingCost} shipping
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {product.location}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            by {product.sellerId?.name || 'Unknown Seller'}
          </span>
          <div className="flex space-x-2">
            {isInCart(product._id) ? (
              <span className="text-sm text-green-600 font-medium">
                In Cart ({getItemQuantity(product._id)})
              </span>
            ) : (
              <button
                onClick={() => handleAddToCart(product)}
                className="btn-primary text-sm px-3 py-1 flex items-center space-x-1"
              >
                <ShoppingCartIcon className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading && products.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              VeridaBazaar
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover sustainable, handmade, and community-crafted products
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products, sellers, or categories..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-4 py-2"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Browse All Items Button */}
            <div className="mt-6">
              <Link
                to="/bazaar/browse"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Browse All Items
                <EyeIcon className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                >
                  <FunnelIcon className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full input-field"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, State, Country"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="input-field"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange('sortBy', sortBy);
                      handleFilterChange('sortOrder', sortOrder);
                    }}
                    className="w-full input-field"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <MagnifyingGlassIcon className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or browse all products.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">
                    Showing {products.length} of {pagination.totalProducts} products
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 border rounded-md ${
                              currentPage === page
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BazaarHome;
