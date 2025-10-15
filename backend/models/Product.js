const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organization: {
        name: String,
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        logo: String,
        website: String,
        verified: {
            type: Boolean,
            default: false
        }
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Food & Beverages', 'Clothing & Accessories', 'Home & Garden',
            'Beauty & Personal Care', 'Electronics', 'Books & Media',
            'Sports & Outdoors', 'Toys & Games', 'Health & Wellness',
            'Office Supplies', 'Automotive', 'Other'
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    sustainability: {
        ecoFriendly: {
            type: Boolean,
            default: false
        },
        certifications: [{
            name: String,
            issuer: String,
            validUntil: Date,
            certificateUrl: String
        }],
        materials: [{
            name: String,
            percentage: Number,
            sustainable: Boolean,
            recyclable: Boolean,
            biodegradable: Boolean
        }],
        carbonFootprint: {
            value: Number,
            unit: String, // kg CO2, tons CO2, etc.
            calculationMethod: String
        },
        packaging: {
            type: String,
            recyclable: Boolean,
            biodegradable: Boolean,
            minimal: Boolean
        },
        sourcing: {
            local: Boolean,
            fairTrade: Boolean,
            organic: Boolean,
            crueltyFree: Boolean,
            vegan: Boolean
        },
        lifecycle: {
            production: String,
            usage: String,
            disposal: String,
            recyclability: String
        }
    },
    pricing: {
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [0, 'Price cannot be negative']
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']
        },
        discount: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        salePrice: Number,
        bulkPricing: [{
            minQuantity: Number,
            maxQuantity: Number,
            price: Number,
            discount: Number
        }],
        shipping: {
            free: Boolean,
            cost: Number,
            freeThreshold: Number,
            estimatedDays: Number
        }
    },
    inventory: {
        sku: String,
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be negative']
        },
        lowStockThreshold: {
            type: Number,
            default: 10
        },
        trackInventory: {
            type: Boolean,
            default: true
        },
        allowBackorder: {
            type: Boolean,
            default: false
        }
    },
    media: {
        images: [{
            url: String,
            alt: String,
            isPrimary: Boolean,
            order: Number
        }],
        videos: [{
            url: String,
            title: String,
            thumbnail: String
        }],
        documents: [{
            name: String,
            url: String,
            type: String // manual, certificate, etc.
        }]
    },
    specifications: {
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: String // cm, inches, etc.
        },
        weight: {
            value: Number,
            unit: String // kg, lbs, etc.
        },
        color: String,
        size: String,
        model: String,
        brand: String,
        warranty: String,
        features: [String],
        technicalSpecs: [{
            name: String,
            value: String
        }]
    },
    reviews: {
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        reviews: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            title: String,
            comment: String,
            images: [String],
            verified: {
                type: Boolean,
                default: false
            },
            helpful: {
                type: Number,
                default: 0
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'discontinued', 'out_of_stock'],
        default: 'draft'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public'
    },
    seo: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String],
        slug: String
    },
    aiInsights: {
        lastUpdated: Date,
        recommendations: [{
            type: String,
            title: String,
            description: String,
            priority: String,
            impact: String
        }],
        sustainabilityScore: Number,
        marketTrends: [{
            trend: String,
            impact: String,
            confidence: Number
        }],
        pricingAnalysis: {
            competitive: Boolean,
            suggestedPrice: Number,
            marketPosition: String
        },
        demandForecast: {
            predictedSales: Number,
            confidence: Number,
            factors: [String]
        }
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        favorites: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        sales: {
            type: Number,
            default: 0
        },
        revenue: {
            type: Number,
            default: 0
        },
        conversionRate: {
            type: Number,
            default: 0
        }
    },
    settings: {
        allowReviews: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        notifications: {
            lowStock: {
                type: Boolean,
                default: true
            },
            newReviews: {
                type: Boolean,
                default: true
            },
            salesUpdates: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            showSales: {
                type: Boolean,
                default: true
            },
            showInventory: {
                type: Boolean,
                default: true
            }
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ 'sustainability.ecoFriendly': 1 });
productSchema.index({ 'pricing.basePrice': 1 });
productSchema.index({ status: 1, visibility: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ 'reviews.averageRating': -1 });
productSchema.index({ createdAt: -1 });

// Virtual for current price
productSchema.virtual('currentPrice').get(function() {
    if (this.pricing.salePrice && this.pricing.salePrice > 0) {
        return this.pricing.salePrice;
    }
    if (this.pricing.discount > 0) {
        return this.pricing.basePrice * (1 - this.pricing.discount / 100);
    }
    return this.pricing.basePrice;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.inventory.quantity === 0) {
        return 'out_of_stock';
    }
    if (this.inventory.quantity <= this.inventory.lowStockThreshold) {
        return 'low_stock';
    }
    return 'in_stock';
});

// Virtual for sustainability score
productSchema.virtual('sustainabilityScore').get(function() {
    let score = 0;
    let factors = 0;

    // Eco-friendly certification
    if (this.sustainability.ecoFriendly) {
        score += 20;
        factors += 1;
    }

    // Certifications
    if (this.sustainability.certifications.length > 0) {
        score += 15;
        factors += 1;
    }

    // Sustainable materials
    const sustainableMaterials = this.sustainability.materials.filter(m => m.sustainable).length;
    if (sustainableMaterials > 0) {
        score += (sustainableMaterials / this.sustainability.materials.length) * 20;
        factors += 1;
    }

    // Packaging
    if (this.sustainability.packaging.recyclable) {
        score += 10;
        factors += 1;
    }
    if (this.sustainability.packaging.biodegradable) {
        score += 10;
        factors += 1;
    }

    // Sourcing
    if (this.sustainability.sourcing.local) {
        score += 10;
        factors += 1;
    }
    if (this.sustainability.sourcing.fairTrade) {
        score += 10;
        factors += 1;
    }
    if (this.sustainability.sourcing.organic) {
        score += 10;
        factors += 1;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
});

// Method to add review
productSchema.methods.addReview = function(userId, rating, title, comment, images = []) {
    const review = {
        user: userId,
        rating,
        title,
        comment,
        images,
        createdAt: new Date()
    };

    this.reviews.reviews.push(review);

    // Update average rating
    const totalRating = this.reviews.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.reviews.averageRating = totalRating / this.reviews.reviews.length;
    this.reviews.totalReviews = this.reviews.reviews.length;

    return this.save();
};

// Method to update inventory
productSchema.methods.updateInventory = function(quantity, operation = 'subtract') {
    if (operation === 'subtract') {
        this.inventory.quantity = Math.max(0, this.inventory.quantity - quantity);
    } else if (operation === 'add') {
        this.inventory.quantity += quantity;
    } else if (operation === 'set') {
        this.inventory.quantity = quantity;
    }

    // Update status based on inventory
    if (this.inventory.quantity === 0) {
        this.status = 'out_of_stock';
    } else if (this.status === 'out_of_stock') {
        this.status = 'active';
    }

    return this.save();
};

// Method to calculate shipping cost
productSchema.methods.calculateShipping = function(quantity = 1, destination = null) {
    if (this.pricing.shipping.free) {
        return 0;
    }

    if (this.pricing.shipping.freeThreshold &&
        (this.currentPrice * quantity) >= this.pricing.shipping.freeThreshold) {
        return 0;
    }

    return this.pricing.shipping.cost || 0;
};

// Static method to find eco-friendly products
productSchema.statics.findEcoFriendly = function(filters = {}) {
    const query = {
        status: 'active',
        visibility: 'public',
        'sustainability.ecoFriendly': true,
        ...filters
    };

    return this.find(query)
        .populate('seller', 'name email')
        .populate('organization.id', 'name email')
        .sort({ 'sustainabilityScore': -1 });
};

// Static method to find products by sustainability score
productSchema.statics.findBySustainabilityScore = function(minScore = 0, maxScore = 100) {
    return this.find({
        status: 'active',
        visibility: 'public'
    })
    .populate('seller', 'name email')
    .then(products => {
        return products
            .filter(product => {
                const score = product.sustainabilityScore;
                return score >= minScore && score <= maxScore;
            })
            .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);
    });
};

// Static method to get trending products
productSchema.statics.getTrending = function(limit = 10, category = null) {
    const query = {
        status: 'active',
        visibility: 'public'
    };

    if (category) {
        query.category = category;
    }

    return this.find(query)
        .populate('seller', 'name email')
        .sort({ 'stats.views': -1, 'stats.sales': -1, 'reviews.averageRating': -1 })
        .limit(limit);
};

// Static method to search products
productSchema.statics.searchProducts = function(searchQuery, filters = {}) {
    const query = {
        status: 'active',
        visibility: 'public',
        ...filters
    };

    if (searchQuery) {
        query.$text = { $search: searchQuery };
    }

    return this.find(query)
        .populate('seller', 'name email')
        .populate('organization.id', 'name email')
        .sort({ score: { $meta: 'textScore' }, 'reviews.averageRating': -1 });
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

