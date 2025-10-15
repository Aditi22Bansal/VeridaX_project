import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  Star,
  ShoppingCart,
  Leaf,
  MapPin,
  Clock,
  Shield,
  Truck,
  ArrowLeft,
  Share2,
  Flag
} from 'lucide-react';
import { marketplaceService } from '@/services/marketplaceService';
import { Product } from '@/types/marketplace';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Load product details
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await marketplaceService.getProduct(id);
        setProduct(response.data);
      } catch (err) {
        setError('Failed to load product details');
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getSustainabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStockStatus = (quantity: number, lowStockThreshold: number) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (quantity <= lowStockThreshold) return { text: 'Low Stock', color: 'text-orange-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  const handleAddToCart = () => {
    if (!product) return;
    // Implement add to cart logic
    console.log('Add to cart:', product._id, quantity);
  };

  const handleBuyNow = () => {
    if (!product) return;
    // Implement buy now logic
    console.log('Buy now:', product._id, quantity);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Implement favorite logic
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <Button onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.inventory.quantity, product.inventory.lowStockThreshold);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/marketplace')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              {product.media.images && product.media.images.length > 0 ? (
                <img
                  src={product.media.images[selectedImage]?.url}
                  alt={product.media.images[selectedImage]?.alt || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.media.images && product.media.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.media.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleToggleFavorite}>
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Flag className="h-5 w-5 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Category and Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{product.category}</Badge>
                {product.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>

              {/* Rating */}
              {product.reviews.averageRating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.reviews.averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.reviews.averageRating.toFixed(1)} ({product.reviews.totalReviews} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.currentPrice, product.pricing.currency)}
                </span>
                {product.pricing.discount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.pricing.basePrice, product.pricing.currency)}
                    </span>
                    <Badge className="bg-red-600 text-white">
                      -{product.pricing.discount}% OFF
                    </Badge>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className={`font-medium ${stockStatus.color}`}>
                  {stockStatus.text}
                </span>
                <span className="text-gray-600">
                  ({product.inventory.quantity} available)
                </span>
              </div>

              {/* Sustainability Score */}
              <div className="flex items-center gap-2 mb-6">
                <Leaf className="h-5 w-5 text-green-600" />
                <span className="font-medium">Sustainability Score:</span>
                <Badge className={`${getSustainabilityColor(product.sustainabilityScore)}`}>
                  {product.sustainabilityScore}/100
                </Badge>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-gray-600 mb-6">{product.shortDescription}</p>
              )}

              {/* Quantity and Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-medium">Quantity:</label>
                  <Input
                    type="number"
                    min="1"
                    max={product.inventory.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.inventory.quantity === 0}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={product.inventory.quantity === 0}
                    className="flex-1"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>

              {/* Seller Info */}
              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {product.seller?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{product.seller?.name || 'Unknown Seller'}</p>
                      <p className="text-sm text-gray-600">Verified Seller</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    {product.description}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sustainability" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Sustainability Score */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {product.sustainabilityScore}/100
                      </div>
                      <p className="text-gray-600">Sustainability Score</p>
                    </div>

                    {/* Certifications */}
                    {product.sustainability.certifications.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Certifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {product.sustainability.certifications.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                              <Shield className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">{cert.name}</p>
                                <p className="text-sm text-gray-600">{cert.issuer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Materials */}
                    {product.sustainability.materials.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Materials</h3>
                        <div className="space-y-2">
                          {product.sustainability.materials.map((material, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span>{material.name}</span>
                                <span className="text-sm text-gray-600">({material.percentage}%)</span>
                              </div>
                              <div className="flex gap-2">
                                {material.sustainable && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Sustainable
                                  </Badge>
                                )}
                                {material.recyclable && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    Recyclable
                                  </Badge>
                                )}
                                {material.biodegradable && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Biodegradable
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sourcing */}
                    <div>
                      <h3 className="font-semibold mb-3">Sourcing</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {product.sustainability.sourcing.local && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <MapPin className="h-5 w-5 text-green-600" />
                            <span>Local</span>
                          </div>
                        )}
                        {product.sustainability.sourcing.fairTrade && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Shield className="h-5 w-5 text-green-600" />
                            <span>Fair Trade</span>
                          </div>
                        )}
                        {product.sustainability.sourcing.organic && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Leaf className="h-5 w-5 text-green-600" />
                            <span>Organic</span>
                          </div>
                        )}
                        {product.sustainability.sourcing.crueltyFree && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Shield className="h-5 w-5 text-green-600" />
                            <span>Cruelty Free</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {product.reviews.averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 ${
                            i < Math.floor(product.reviews.averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">
                      Based on {product.reviews.totalReviews} reviews
                    </p>
                  </div>

                  {product.reviews.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {product.reviews.reviews.map((review, index) => (
                        <div key={index} className="border-b border-gray-200 pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                            {review.verified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          {review.title && (
                            <h4 className="font-medium mb-1">{review.title}</h4>
                          )}
                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-600">No reviews yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

