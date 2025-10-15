import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Star, Leaf, TrendingUp, RefreshCw } from 'lucide-react';
import ProductCard from '@/components/marketplace/ProductCard';
import { marketplaceService } from '@/services/marketplaceService';
import { Product } from '@/types/marketplace';

const ProductListing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minSustainabilityScore, setMinSustainabilityScore] = useState(searchParams.get('minSustainabilityScore') || '');
  const [ecoFriendly, setEcoFriendly] = useState(searchParams.get('ecoFriendly') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const categories = [
    'Food & Beverages',
    'Clothing & Accessories',
    'Home & Garden',
    'Beauty & Personal Care',
    'Electronics',
    'Books & Media',
    'Sports & Outdoors',
    'Toys & Games',
    'Health & Wellness',
    'Office Supplies',
    'Automotive',
    'Other'
  ];

  // Load products
  const loadProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minSustainabilityScore) params.append('minSustainabilityScore', minSustainabilityScore);
      if (ecoFriendly) params.append('ecoFriendly', 'true');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await marketplaceService.getProducts(params);
      setProducts(response.data);
      setTotalPages(response.pagination.pages);
      setTotalProducts(response.pagination.total);
      setCurrentPage(page);

    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load recommendations
  const loadRecommendations = async () => {
    try {
      const response = await marketplaceService.getRecommendations({
        limit: 6,
        includeTrending: true,
        includePersonalized: true
      });
      setRecommendations(response.data);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  // Load search suggestions
  const loadSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await marketplaceService.getSearchSuggestions(query);
      setSuggestions(response.data);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    }
  };

  // Update URL params
  const updateURLParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (category) params.append('category', category);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (minSustainabilityScore) params.append('minSustainabilityScore', minSustainabilityScore);
    if (ecoFriendly) params.append('ecoFriendly', 'true');
    if (sortBy !== 'createdAt') params.append('sortBy', sortBy);
    if (sortOrder !== 'desc') params.append('sortOrder', sortOrder);

    setSearchParams(params);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    loadSuggestions(query);
  };

  // Handle filter change
  const handleFilterChange = () => {
    setCurrentPage(1);
    updateURLParams();
    loadProducts(1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setCurrentPage(1);
    updateURLParams();
    loadProducts(1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinSustainabilityScore('');
    setEcoFriendly(false);
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    setSearchParams({});
    loadProducts(1);
  };

  // Effects
  useEffect(() => {
    loadProducts();
    loadRecommendations();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        loadSuggestions(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sustainable Marketplace
          </h1>
          <p className="text-gray-600">
            Discover eco-friendly products from verified sellers worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for products, categories, or brands..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 pr-4 py-2"
                />

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category */}
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Price Range */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Min Price"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <Input
                    placeholder="Max Price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                {/* Sustainability Score */}
                <Input
                  placeholder="Min Sustainability Score"
                  type="number"
                  min="0"
                  max="100"
                  value={minSustainabilityScore}
                  onChange={(e) => setMinSustainabilityScore(e.target.value)}
                />

                {/* Sort */}
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Newest</SelectItem>
                      <SelectItem value="pricing.basePrice">Price</SelectItem>
                      <SelectItem value="reviews.averageRating">Rating</SelectItem>
                      <SelectItem value="sustainabilityScore">Sustainability</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleFilterChange} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button variant="outline" onClick={() => loadProducts(currentPage)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Active Filters */}
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>×</button>
                  </Badge>
                )}
                {category && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {category}
                    <button onClick={() => setCategory('')}>×</button>
                  </Badge>
                )}
                {ecoFriendly && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    Eco-Friendly
                    <button onClick={() => setEcoFriendly(false)}>×</button>
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => loadProducts()}>Try Again</Button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {totalProducts} Products Found
                </h2>
                <p className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={(productId) => {
                      // Handle add to cart
                      console.log('Add to cart:', productId);
                    }}
                    onViewDetails={(productId) => {
                      navigate(`/marketplace/products/${productId}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No products found matching your criteria</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => loadProducts(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    onClick={() => loadProducts(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => loadProducts(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Recommended for You
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {recommendations.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onViewDetails={(productId) => {
                        navigate(`/marketplace/products/${productId}`);
                      }}
                      showAddToCart={false}
                      className="h-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductListing;

