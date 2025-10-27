import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCartIcon,
  HeartIcon,
  ShareIcon,
  TruckIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImpactMeter from '../../components/ImpactMeter';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  const { addItem, isInCart, getItemQuantity } = useCart();
  const { user } = useAuth();

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bazaar/products/${id}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIconSolid
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/bazaar/products/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating: review.rating,
          review: review.comment
        })
      });

      if (response.ok) {
        setShowReviewForm(false);
        setReview({ rating: 5, comment: '' });
        fetchProduct(); // Refresh product data
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link to="/bazaar" className="btn-primary">
            Back to Bazaar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/bazaar" className="hover:text-primary-600">
              Bazaar
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
              <img
                src={product.images[selectedImage] || '/api/placeholder/600/600'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index
                        ? 'border-primary-500'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                  {product.category}
                </span>
                <div className="flex items-center space-x-1">
                  {renderStars(product.averageRating)}
                  <span className="text-sm text-gray-600 ml-1">
                    ({product.totalRatings} reviews)
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  ${product.price}
                </span>
                {product.deliveryInfo?.shippingCost > 0 && (
                  <span className="text-gray-500">
                    +${product.deliveryInfo.shippingCost} shipping
                  </span>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Sustainability Rating */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Sustainability Rating</span>
              </div>
              <div className="flex items-center space-x-1">
                {renderStars(product.sustainabilityRating)}
                <span className="text-sm text-green-700 ml-2">
                  {product.sustainabilityRating}/5
                </span>
              </div>
            </div>

            {/* Materials */}
            {product.materials && product.materials.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Materials Used</h3>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((material, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-50"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-1 border-x border-gray-300">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-50"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stock} available
                </span>
              </div>

              <div className="flex space-x-4">
                {/* Check if current user is the seller */}
                {user && product.sellerId && user.id === product.sellerId.userId ? (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                    <span>This is your product</span>
                  </div>
                ) : isInCart(product._id) ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <ShoppingCartIcon className="w-5 h-5" />
                    <span>In Cart ({getItemQuantity(product._id)})</span>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="btn-primary flex items-center space-x-2 px-6 py-3"
                  >
                    <ShoppingCartIcon className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                )}

                <button className="btn-outline flex items-center space-x-2 px-6 py-3">
                  <HeartIcon className="w-5 h-5" />
                  <span>Save</span>
                </button>

                <button className="btn-outline flex items-center space-x-2 px-6 py-3">
                  <ShareIcon className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TruckIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Delivery Information</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Estimated delivery: {product.deliveryInfo?.estimatedDays || 7} days</p>
                <p>Location: {product.location}</p>
                {product.deliveryInfo?.freeShippingThreshold && (
                  <p>Free shipping on orders over ${product.deliveryInfo.freeShippingThreshold}</p>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Sold by</h3>
                <Link
                  to={`/bazaar/seller/${product.sellerId._id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  View Shop
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {product.sellerId.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {product.sellerId.name || 'Unknown Seller'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.sellerId.shopName || 'Individual Seller'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="btn-outline text-sm px-4 py-2 flex items-center space-x-1">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span>Message Seller</span>
                </button>
              </div>
            </div>

            {/* Impact Meter */}
            <ImpactMeter product={product} className="mt-6" />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn-primary"
            >
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
            >
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReview(prev => ({ ...prev, rating: star }))}
                        className="focus:outline-none"
                      >
                        <StarIconSolid
                          className={`w-6 h-6 ${
                            star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review
                  </label>
                  <textarea
                    value={review.comment}
                    onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full input-field"
                    placeholder="Share your experience with this product..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary">
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {product.ratings.map((rating, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {rating.userId?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {rating.userId?.name || 'Anonymous'}
                      </p>
                      <div className="flex items-center space-x-1">
                        {renderStars(rating.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {rating.review && (
                  <p className="text-gray-700 mt-2">{rating.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
