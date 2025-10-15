import { api } from './api';

export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  organization?: {
    name: string;
    id: string;
    logo?: string;
    website?: string;
    verified: boolean;
  };
  category: string;
  subcategory?: string;
  tags: string[];
  sustainability: {
    ecoFriendly: boolean;
    certifications: Array<{
      name: string;
      issuer: string;
      validUntil?: Date;
      certificateUrl?: string;
    }>;
    materials: Array<{
      name: string;
      percentage: number;
      sustainable: boolean;
      recyclable: boolean;
      biodegradable: boolean;
    }>;
    carbonFootprint: {
      value: number;
      unit: string;
      calculationMethod?: string;
    };
    packaging: {
      type: string;
      recyclable: boolean;
      biodegradable: boolean;
      minimal: boolean;
    };
    sourcing: {
      local: boolean;
      fairTrade: boolean;
      organic: boolean;
      crueltyFree: boolean;
      vegan: boolean;
    };
    lifecycle: {
      production: string;
      usage: string;
      disposal: string;
      recyclability: string;
    };
  };
  pricing: {
    basePrice: number;
    currency: string;
    discount: number;
    salePrice?: number;
    bulkPricing: Array<{
      minQuantity: number;
      maxQuantity: number;
      price: number;
      discount: number;
    }>;
    shipping: {
      free: boolean;
      cost: number;
      freeThreshold: number;
      estimatedDays: number;
    };
  };
  inventory: {
    sku?: string;
    quantity: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  };
  media: {
    images: Array<{
      url: string;
      alt: string;
      isPrimary: boolean;
      order: number;
    }>;
    videos: Array<{
      url: string;
      title: string;
      thumbnail: string;
    }>;
    documents: Array<{
      name: string;
      url: string;
      type: string;
    }>;
  };
  specifications: {
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    weight?: {
      value: number;
      unit: string;
    };
    color?: string;
    size?: string;
    model?: string;
    brand?: string;
    warranty?: string;
    features: string[];
    technicalSpecs: Array<{
      name: string;
      value: string;
    }>;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    reviews: Array<{
      user: {
        _id: string;
        name: string;
        email: string;
      };
      rating: number;
      title?: string;
      comment?: string;
      images: string[];
      verified: boolean;
      helpful: number;
      createdAt: Date;
    }>;
  };
  status: 'draft' | 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  visibility: 'public' | 'private' | 'unlisted';
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    slug?: string;
  };
  aiInsights?: {
    lastUpdated: Date;
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: string;
      impact: string;
    }>;
    sustainabilityScore: number;
    marketTrends: Array<{
      trend: string;
      impact: string;
      confidence: number;
    }>;
    pricingAnalysis: {
      competitive: boolean;
      suggestedPrice: number;
      marketPosition: string;
    };
    demandForecast: {
      predictedSales: number;
      confidence: number;
      factors: string[];
    };
  };
  stats: {
    views: number;
    favorites: number;
    shares: number;
    sales: number;
    revenue: number;
    conversionRate: number;
  };
  settings: {
    allowReviews: boolean;
    requireApproval: boolean;
    notifications: {
      lowStock: boolean;
      newReviews: boolean;
      salesUpdates: boolean;
    };
    privacy: {
      showSales: boolean;
      showInventory: boolean;
    };
  };
  currentPrice: number;
  sustainabilityScore: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
  notes?: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  savedForLater: Array<{
    product: Product;
    quantity: number;
    savedAt: string;
  }>;
  shipping: {
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    method: 'standard' | 'express' | 'overnight' | 'pickup';
    cost: number;
    estimatedDays?: number;
  };
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  coupons: Array<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    appliedAt: string;
  }>;
  lastUpdated: string;
  expiresAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productSnapshot: {
      name: string;
      description: string;
      images: string[];
      specifications: any;
    };
  }>;
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  shipping: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    method: 'standard' | 'express' | 'overnight' | 'pickup';
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  };
  payment: {
    method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'bank_transfer' | 'crypto' | 'wallet';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    transactionId?: string;
    gateway?: string;
    paidAt?: string;
    refundedAt?: string;
    refundAmount?: number;
    paymentDetails?: any;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy: {
      _id: string;
      name: string;
      email: string;
    };
  }>;
  notes: {
    customer?: string;
    seller?: string;
    internal?: string;
  };
  sustainability: {
    carbonOffset: {
      amount: number;
      unit: string;
      offset: boolean;
    };
    ecoFriendlyShipping: boolean;
    sustainablePackaging: boolean;
    localSourcing: boolean;
  };
  refund: {
    requested: boolean;
    reason?: string;
    amount?: number;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    requestedAt?: string;
    processedAt?: string;
    notes?: string;
  };
  reviews: {
    customer?: {
      rating: number;
      comment?: string;
      createdAt?: string;
    };
    seller?: {
      rating: number;
      comment?: string;
      createdAt?: string;
    };
  };
  analytics: {
    source?: string;
    campaign?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minSustainabilityScore?: number;
  ecoFriendly?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'pricing.basePrice' | 'reviews.averageRating' | 'sustainabilityScore';
  sortOrder?: 'asc' | 'desc';
  seller?: string;
}

export interface RecommendationOptions {
  limit?: number;
  category?: string;
  maxPrice?: number;
  minSustainabilityScore?: number;
  includeTrending?: boolean;
  includePersonalized?: boolean;
}

class MarketplaceService {
  // Product methods
  async getProducts(filters: ProductFilters | URLSearchParams = {}) {
    const params = new URLSearchParams();

    if (filters instanceof URLSearchParams) {
      return api.get(`/marketplace/products?${filters.toString()}`);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return api.get(`/marketplace/products?${params.toString()}`);
  }

  async getProduct(id: string) {
    return api.get(`/marketplace/products/${id}`);
  }

  async createProduct(productData: Partial<Product>) {
    return api.post('/marketplace/products', productData);
  }

  async updateProduct(id: string, productData: Partial<Product>) {
    return api.put(`/marketplace/products/${id}`, productData);
  }

  async deleteProduct(id: string) {
    return api.delete(`/marketplace/products/${id}`);
  }

  async getTrendingProducts(limit = 10, category?: string) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (category) params.append('category', category);

    return api.get(`/marketplace/products/trending?${params.toString()}`);
  }

  async getEcoFriendlyProducts(limit = 20, category?: string, minScore = 70) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (category) params.append('category', category);
    params.append('minScore', minScore.toString());

    return api.get(`/marketplace/products/eco-friendly?${params.toString()}`);
  }

  async getSearchSuggestions(query: string, limit = 5) {
    return api.get(`/marketplace/products/search-suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async addProductReview(productId: string, reviewData: {
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
  }) {
    return api.post(`/marketplace/products/${productId}/reviews`, reviewData);
  }

  async getProductAnalytics(productId: string) {
    return api.get(`/marketplace/products/${productId}/analytics`);
  }

  async updateProductInventory(productId: string, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set') {
    return api.put(`/marketplace/products/${productId}/inventory`, {
      quantity,
      operation
    });
  }

  // Cart methods
  async getCart() {
    return api.get('/marketplace/cart');
  }

  async getCartSummary() {
    return api.get('/marketplace/cart/summary');
  }

  async addToCart(productId: string, quantity = 1, notes = '') {
    return api.post('/marketplace/cart/items', {
      productId,
      quantity,
      notes
    });
  }

  async updateCartItem(productId: string, quantity: number) {
    return api.put(`/marketplace/cart/items/${productId}`, { quantity });
  }

  async removeFromCart(productId: string) {
    return api.delete(`/marketplace/cart/items/${productId}`);
  }

  async saveForLater(productId: string) {
    return api.post(`/marketplace/cart/items/${productId}/save-for-later`);
  }

  async moveToCart(productId: string) {
    return api.post(`/marketplace/cart/items/${productId}/move-to-cart`);
  }

  async applyCoupon(code: string, discount: number, type: 'percentage' | 'fixed' = 'percentage') {
    return api.post('/marketplace/cart/coupons', {
      code,
      discount,
      type
    });
  }

  async removeCoupon(code: string) {
    return api.delete(`/marketplace/cart/coupons/${code}`);
  }

  async updateShipping(shippingData: {
    address?: any;
    method?: string;
    cost?: number;
    estimatedDays?: number;
  }) {
    return api.put('/marketplace/cart/shipping', shippingData);
  }

  async clearCart() {
    return api.delete('/marketplace/cart');
  }

  // Order methods
  async createOrder(orderData: {
    paymentMethod: string;
    shippingAddress: any;
    notes?: {
      customer?: string;
      internal?: string;
    };
  }) {
    return api.post('/marketplace/orders', orderData);
  }

  async getUserOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return api.get(`/marketplace/orders?${params.toString()}`);
  }

  async getOrder(id: string) {
    return api.get(`/marketplace/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string, note?: string) {
    return api.put(`/marketplace/orders/${id}/status`, { status, note });
  }

  async cancelOrder(id: string, reason?: string) {
    return api.post(`/marketplace/orders/${id}/cancel`, { reason });
  }

  async addOrderReview(id: string, type: 'customer' | 'seller', rating: number, comment?: string) {
    return api.post(`/marketplace/orders/${id}/reviews`, {
      type,
      rating,
      comment
    });
  }

  async requestRefund(id: string, reason: string, amount?: number, notes?: string) {
    return api.post(`/marketplace/orders/${id}/refund`, {
      reason,
      amount,
      notes
    });
  }

  async getOrderTimeline(id: string) {
    return api.get(`/marketplace/orders/${id}/timeline`);
  }

  async getOrderAnalytics(type: 'sales' | 'customer' = 'sales', startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return api.get(`/marketplace/orders/analytics?${params.toString()}`);
  }

  // AI-powered recommendations
  async getRecommendations(options: RecommendationOptions = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return api.get(`/marketplace/recommendations?${params.toString()}`);
  }
}

export const marketplaceService = new MarketplaceService();

