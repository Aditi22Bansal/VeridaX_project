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

export interface CartSummary {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  savedForLaterCount: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalItems: number;
  categories?: string[];
}

export interface ProductAnalytics {
  overview: {
    views: number;
    favorites: number;
    shares: number;
    sales: number;
    revenue: number;
    conversionRate: number;
    averageRating: number;
    totalReviews: number;
  };
  sustainability: {
    score: number;
    insights: {
      score: number;
      strengths: string[];
      improvements: string[];
      certifications: Array<{
        name: string;
        issuer: string;
        validUntil?: Date;
        certificateUrl?: string;
      }>;
      impact: {
        carbonFootprint: {
          value: number;
          unit: string;
          calculationMethod?: string;
        };
        materials: Array<{
          name: string;
          percentage: number;
          sustainable: boolean;
          recyclable: boolean;
          biodegradable: boolean;
        }>;
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
      };
    };
  };
  pricing: {
    competitive: boolean;
    marketPosition: string;
    suggestedPrice: number;
    confidence: number;
    statistics: {
      average: number;
      minimum: number;
      maximum: number;
      current: number;
      sampleSize: number;
    };
  };
  trends: Array<{
    _id: {
      category: string;
      month: number;
    };
    count: number;
    avgPrice: number;
    avgSustainability: number;
    totalViews: number;
    totalSales: number;
  }>;
}

