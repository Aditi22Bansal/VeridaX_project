const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const MarketplaceAIService = require('../services/marketplaceAIService');
const { validationResult } = require('express-validator');

class ProductController {
    /**
     * Create a new product
     */
    static async createProduct(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const productData = {
                ...req.body,
                seller: req.user.id
            };

            // Handle organization if provided
            if (req.body.organization) {
                productData.organization = {
                    ...req.body.organization,
                    id: req.user.id
                };
            }

            const product = new Product(productData);
            await product.save();

            // Generate AI insights
            try {
                const sustainabilityInsights = await MarketplaceAIService.getSustainabilityInsights(product._id);
                const priceAnalysis = await MarketplaceAIService.getPriceAnalysis(product._id);

                product.aiInsights = {
                    lastUpdated: new Date(),
                    sustainabilityScore: sustainabilityInsights.score,
                    pricingAnalysis: priceAnalysis,
                    recommendations: sustainabilityInsights.improvements.map(improvement => ({
                        type: 'sustainability',
                        title: 'Sustainability Improvement',
                        description: improvement,
                        priority: 'medium',
                        impact: 'positive'
                    }))
                };
                await product.save();
            } catch (aiError) {
                console.warn('AI insights generation failed:', aiError.message);
            }

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product
            });

        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: error.message
            });
        }
    }

    /**
     * Get all products with filtering and pagination
     */
    static async getProducts(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                category,
                minPrice,
                maxPrice,
                minSustainabilityScore,
                ecoFriendly,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                seller
            } = req.query;

            const query = {
                status: 'active',
                visibility: 'public'
            };

            // Apply filters
            if (category) query.category = category;
            if (minPrice || maxPrice) {
                query['pricing.basePrice'] = {};
                if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
                if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
            }
            if (minSustainabilityScore) {
                query['sustainabilityScore'] = { $gte: parseFloat(minSustainabilityScore) };
            }
            if (ecoFriendly === 'true') {
                query['sustainability.ecoFriendly'] = true;
            }
            if (seller) query.seller = seller;

            // Text search
            if (search) {
                query.$text = { $search: search };
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const products = await Product.find(query)
                .populate('seller', 'name email')
                .populate('organization.id', 'name email')
                .sort(sortOptions)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Product.countDocuments(query);

            res.json({
                success: true,
                data: products,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error.message
            });
        }
    }

    /**
     * Get product by ID
     */
    static async getProductById(req, res) {
        try {
            const product = await Product.findById(req.params.id)
                .populate('seller', 'name email')
                .populate('organization.id', 'name email')
                .populate('reviews.reviews.user', 'name email');

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Increment view count
            product.stats.views += 1;
            await product.save();

            res.json({
                success: true,
                data: product
            });

        } catch (error) {
            console.error('Error getting product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product',
                error: error.message
            });
        }
    }

    /**
     * Update product
     */
    static async updateProduct(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check ownership
            if (product.seller.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this product'
                });
            }

            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            ).populate('seller', 'name email');

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct
            });

        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error.message
            });
        }
    }

    /**
     * Delete product
     */
    static async deleteProduct(req, res) {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check ownership
            if (product.seller.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this product'
                });
            }

            await Product.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error.message
            });
        }
    }

    /**
     * Get AI-powered product recommendations
     */
    static async getRecommendations(req, res) {
        try {
            const {
                limit = 10,
                category,
                maxPrice,
                minSustainabilityScore,
                includeTrending = true,
                includePersonalized = true
            } = req.query;

            const recommendations = await MarketplaceAIService.getProductRecommendations(
                req.user.id,
                {
                    limit: parseInt(limit),
                    category,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : null,
                    minSustainabilityScore: minSustainabilityScore ? parseFloat(minSustainabilityScore) : 0,
                    includeTrending: includeTrending === 'true',
                    includePersonalized: includePersonalized === 'true'
                }
            );

            res.json({
                success: true,
                data: recommendations
            });

        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recommendations',
                error: error.message
            });
        }
    }

    /**
     * Get search suggestions
     */
    static async getSearchSuggestions(req, res) {
        try {
            const { q: query, limit = 5 } = req.query;

            if (!query || query.length < 2) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const suggestions = await MarketplaceAIService.getSearchSuggestions(query, parseInt(limit));

            res.json({
                success: true,
                data: suggestions
            });

        } catch (error) {
            console.error('Error getting search suggestions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get search suggestions',
                error: error.message
            });
        }
    }

    /**
     * Add product review
     */
    static async addReview(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { rating, title, comment, images = [] } = req.body;

            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if user has purchased this product
            const hasPurchased = await Order.findOne({
                customer: req.user.id,
                'items.product': req.params.id,
                status: { $in: ['delivered', 'completed'] }
            });

            if (!hasPurchased) {
                return res.status(403).json({
                    success: false,
                    message: 'You must purchase this product before reviewing'
                });
            }

            // Check if user already reviewed this product
            const existingReview = product.reviews.reviews.find(
                review => review.user.toString() === req.user.id
            );

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already reviewed this product'
                });
            }

            await product.addReview(req.user.id, rating, title, comment, images);

            res.json({
                success: true,
                message: 'Review added successfully'
            });

        } catch (error) {
            console.error('Error adding review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add review',
                error: error.message
            });
        }
    }

    /**
     * Get product analytics
     */
    static async getProductAnalytics(req, res) {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check ownership
            if (product.seller.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view analytics'
                });
            }

            const analytics = {
                overview: {
                    views: product.stats.views,
                    favorites: product.stats.favorites,
                    shares: product.stats.shares,
                    sales: product.stats.sales,
                    revenue: product.stats.revenue,
                    conversionRate: product.stats.conversionRate,
                    averageRating: product.reviews.averageRating,
                    totalReviews: product.reviews.totalReviews
                },
                sustainability: {
                    score: product.sustainabilityScore,
                    insights: await MarketplaceAIService.getSustainabilityInsights(product._id)
                },
                pricing: await MarketplaceAIService.getPriceAnalysis(product._id),
                trends: await MarketplaceAIService.getMarketTrends(product.category, 30)
            };

            res.json({
                success: true,
                data: analytics
            });

        } catch (error) {
            console.error('Error getting product analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product analytics',
                error: error.message
            });
        }
    }

    /**
     * Get trending products
     */
    static async getTrendingProducts(req, res) {
        try {
            const { limit = 10, category } = req.query;

            const products = await Product.getTrending(parseInt(limit), category);

            res.json({
                success: true,
                data: products
            });

        } catch (error) {
            console.error('Error getting trending products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get trending products',
                error: error.message
            });
        }
    }

    /**
     * Get eco-friendly products
     */
    static async getEcoFriendlyProducts(req, res) {
        try {
            const { limit = 20, category, minScore = 70 } = req.query;

            const products = await Product.findEcoFriendly({
                category,
                'sustainabilityScore': { $gte: parseInt(minScore) }
            }).limit(parseInt(limit));

            res.json({
                success: true,
                data: products
            });

        } catch (error) {
            console.error('Error getting eco-friendly products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get eco-friendly products',
                error: error.message
            });
        }
    }

    /**
     * Update product inventory
     */
    static async updateInventory(req, res) {
        try {
            const { quantity, operation = 'set' } = req.body;

            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check ownership
            if (product.seller.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update inventory'
                });
            }

            await product.updateInventory(quantity, operation);

            res.json({
                success: true,
                message: 'Inventory updated successfully',
                data: {
                    quantity: product.inventory.quantity,
                    status: product.status
                }
            });

        } catch (error) {
            console.error('Error updating inventory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update inventory',
                error: error.message
            });
        }
    }
}

module.exports = ProductController;

