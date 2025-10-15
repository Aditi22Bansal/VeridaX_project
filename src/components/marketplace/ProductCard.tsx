import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Star, ShoppingCart, Leaf, MapPin, Clock } from 'lucide-react';
import { Product } from '@/types/marketplace';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  isFavorite?: boolean;
  showAddToCart?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  onViewDetails,
  isFavorite = false,
  showAddToCart = true,
  className = ''
}) => {
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

  const stockStatus = getStockStatus(product.inventory.quantity, product.inventory.lowStockThreshold);

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className="p-0 relative">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {product.media.images && product.media.images.length > 0 ? (
            <img
              src={product.media.images[0].url}
              alt={product.media.images[0].alt || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={() => onToggleFavorite?.(product._id)}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </Button>

          {/* Sustainability Badge */}
          {product.sustainability.ecoFriendly && (
            <Badge className="absolute top-2 left-2 bg-green-600 text-white">
              <Leaf className="h-3 w-3 mr-1" />
              Eco-Friendly
            </Badge>
          )}

          {/* Sale Badge */}
          {product.pricing.discount > 0 && (
            <Badge className="absolute bottom-2 left-2 bg-red-600 text-white">
              -{product.pricing.discount}% OFF
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Product Name */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Category and Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
          {product.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Sustainability Score */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Leaf className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Sustainability</span>
          </div>
          <Badge className={`text-xs ${getSustainabilityColor(product.sustainabilityScore)}`}>
            {product.sustainabilityScore}/100
          </Badge>
        </div>

        {/* Location */}
        {product.sustainability.sourcing.local && (
          <div className="flex items-center gap-1 mb-3 text-sm text-green-600">
            <MapPin className="h-4 w-4" />
            <span>Locally Sourced</span>
          </div>
        )}

        {/* Stock Status */}
        <div className="flex items-center gap-1 mb-3 text-sm">
          <Clock className="h-4 w-4" />
          <span className={stockStatus.color}>{stockStatus.text}</span>
        </div>

        {/* Rating */}
        {product.reviews.averageRating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.reviews.averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({product.reviews.totalReviews})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.currentPrice, product.pricing.currency)}
          </span>
          {product.pricing.discount > 0 && (
            <span className="text-lg text-gray-500 line-through">
              {formatPrice(product.pricing.basePrice, product.pricing.currency)}
            </span>
          )}
        </div>

        {/* Seller Info */}
        <div className="text-sm text-gray-600 mb-3">
          by {product.seller?.name || 'Unknown Seller'}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {showAddToCart && (
          <Button
            onClick={() => onAddToCart?.(product._id)}
            className="flex-1"
            disabled={product.inventory.quantity === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.inventory.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => onViewDetails?.(product._id)}
          className="flex-1"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

