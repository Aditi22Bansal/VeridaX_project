const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

class MarketplaceAIService {
    /**
     * Get AI-powered product recommendations for a user
     * @param {string} userId - User ID
     * @param {Object} options - Recommendation options
     * @returns {Promise<Array>} Recommended products
     */
    static async getProductRecommendations(userId, options = {}) {
        try {
            const {
                limit = 10,
                category = null,
                maxPrice = null,
                minSustainabilityScore = 0,
                includeTrending = true,
                includePersonalized = true
            } = options;

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const recommendations = [];

            // 1. Personalized recommendations based on user profile
            if (includePersonalized) {
                const personalized = await this.getPersonalizedRecommendations(user, {
                    limit: Math.ceil(limit * 0.4),
                    category,
                    maxPrice,
                    minSustainabilityScore
                });
                recommendations.push(...personalized);
            }

            // 2. Trending products
            if (includeTrending) {
                const trending = await this.getTrendingRecommendations({
                    limit: Math.ceil(limit * 0.3),
                    category,
                    maxPrice,
                    minSustainabilityScore
                });
                recommendations.push(...trending);
            }

            // 3. Sustainability-focused recommendations
            const sustainable = await this.getSustainableRecommendations({
                limit: Math.ceil(limit * 0.3),
                category,
                maxPrice,
                minSustainabilityScore
            });
            recommendations.push(...sustainable);

            // Remove duplicates and limit results
            const uniqueRecommendations = this.removeDuplicateProducts(recommendations);
            return uniqueRecommendations.slice(0, limit);

        } catch (error) {
            console.error('Error getting product recommendations:', error);
            throw error;
        }
    }

    /**
     * Get personalized recommendations based on user profile
     */
    static async getPersonalizedRecommendations(user, options) {
        const {
            limit,
            category,
            maxPrice,
            minSustainabilityScore
        } = options;

        const query = {
            status: 'active',
            visibility: 'public',
            'sustainabilityScore': { $gte: minSustainabilityScore }
        };

        if (category) query.category = category;
        if (maxPrice) query['pricing.basePrice'] = { $lte: maxPrice };

        // Get user's interests and skills
        const userInterests = user.interests || [];
        const userSkills = user.skills || [];

        // Find products matching user interests
        const interestMatches = await Product.find({
            ...query,
            $or: [
                { category: { $in: userInterests } },
                { tags: { $in: userInterests } },
                { 'sustainability.sourcing.organic': user.preferences?.organic || false },
                { 'sustainability.sourcing.local': user.preferences?.local || false }
            ]
        })
        .populate('seller', 'name email')
        .sort({ 'reviews.averageRating': -1, 'sustainabilityScore': -1 })
        .limit(limit);

        // Add recommendation reasons
        return interestMatches.map(product => ({
            ...product.toObject(),
            recommendationReason: this.getRecommendationReason(product, user),
            matchScore: this.calculateMatchScore(product, user)
        }));
    }

    /**
     * Get trending product recommendations
     */
    static async getTrendingRecommendations(options) {
        const {
            limit,
            category,
            maxPrice,
            minSustainabilityScore
        } = options;

        const query = {
            status: 'active',
            visibility: 'public',
            'sustainabilityScore': { $gte: minSustainabilityScore },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        };

        if (category) query.category = category;
        if (maxPrice) query['pricing.basePrice'] = { $lte: maxPrice };

        const trending = await Product.find(query)
            .populate('seller', 'name email')
            .sort({
                'stats.views': -1,
                'stats.sales': -1,
                'reviews.averageRating': -1
            })
            .limit(limit);

        return trending.map(product => ({
            ...product.toObject(),
            recommendationReason: 'Trending product with high engagement',
            matchScore: 0.8
        }));
    }

    /**
     * Get sustainability-focused recommendations
     */
    static async getSustainableRecommendations(options) {
        const {
            limit,
            category,
            maxPrice,
            minSustainabilityScore
        } = options;

        const query = {
            status: 'active',
            visibility: 'public',
            'sustainability.ecoFriendly': true,
            'sustainabilityScore': { $gte: minSustainabilityScore }
        };

        if (category) query.category = category;
        if (maxPrice) query['pricing.basePrice'] = { $lte: maxPrice };

        const sustainable = await Product.find(query)
            .populate('seller', 'name email')
            .sort({ 'sustainabilityScore': -1, 'reviews.averageRating': -1 })
            .limit(limit);

        return sustainable.map(product => ({
            ...product.toObject(),
            recommendationReason: 'High sustainability score and eco-friendly',
            matchScore: 0.9
        }));
    }

    /**
     * Get AI-powered search suggestions
     */
    static async getSearchSuggestions(query, limit = 5) {
        try {
            if (!query || query.length < 2) {
                return [];
            }

            // Get suggestions from product names, categories, and tags
            const suggestions = await Product.aggregate([
                {
                    $match: {
                        status: 'active',
                        visibility: 'public',
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { category: { $regex: query, $options: 'i' } },
                            { tags: { $regex: query, $options: 'i' } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: null,
                        names: { $addToSet: '$name' },
                        categories: { $addToSet: '$category' },
                        tags: { $addToSet: '$tags' }
                    }
                },
                {
                    $project: {
                        suggestions: {
                            $concatArrays: [
                                { $slice: ['$names', 3] },
                                { $slice: ['$categories', 2] },
                                { $slice: ['$tags', 5] }
                            ]
                        }
                    }
                }
            ]);

            if (suggestions.length === 0) {
                return [];
            }

            // Filter and sort suggestions
            const allSuggestions = suggestions[0].suggestions.flat();
            const filteredSuggestions = allSuggestions
                .filter(suggestion =>
                    suggestion.toLowerCase().includes(query.toLowerCase()) &&
                    suggestion !== query
                )
                .slice(0, limit);

            return [...new Set(filteredSuggestions)]; // Remove duplicates

        } catch (error) {
            console.error('Error getting search suggestions:', error);
            return [];
        }
    }

    /**
     * Get price analysis and recommendations
     */
    static async getPriceAnalysis(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            // Get similar products for price comparison
            const similarProducts = await Product.find({
                category: product.category,
                status: 'active',
                visibility: 'public',
                _id: { $ne: productId }
            }).select('pricing.basePrice reviews.averageRating stats.sales');

            if (similarProducts.length === 0) {
                return {
                    competitive: true,
                    marketPosition: 'No comparable products found',
                    suggestedPrice: product.pricing.basePrice,
                    confidence: 0
                };
            }

            // Calculate price statistics
            const prices = similarProducts.map(p => p.pricing.basePrice);
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            const currentPrice = product.pricing.basePrice;
            const isCompetitive = currentPrice >= minPrice && currentPrice <= maxPrice;
            const isBelowAverage = currentPrice < avgPrice;

            let marketPosition = 'Average';
            if (currentPrice < minPrice) marketPosition = 'Below market';
            else if (currentPrice > maxPrice) marketPosition = 'Above market';
            else if (isBelowAverage) marketPosition = 'Below average';

            return {
                competitive: isCompetitive,
                marketPosition,
                suggestedPrice: Math.round(avgPrice * 100) / 100,
                confidence: Math.min(similarProducts.length / 10, 1),
                statistics: {
                    average: Math.round(avgPrice * 100) / 100,
                    minimum: minPrice,
                    maximum: maxPrice,
                    current: currentPrice,
                    sampleSize: similarProducts.length
                }
            };

        } catch (error) {
            console.error('Error getting price analysis:', error);
            throw error;
        }
    }

    /**
     * Get sustainability insights for a product
     */
    static async getSustainabilityInsights(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            const insights = {
                score: product.sustainabilityScore,
                strengths: [],
                improvements: [],
                certifications: product.sustainability.certifications,
                impact: {
                    carbonFootprint: product.sustainability.carbonFootprint,
                    materials: product.sustainability.materials,
                    packaging: product.sustainability.packaging,
                    sourcing: product.sustainability.sourcing
                }
            };

            // Analyze strengths
            if (product.sustainability.ecoFriendly) {
                insights.strengths.push('Eco-friendly certified');
            }
            if (product.sustainability.certifications.length > 0) {
                insights.strengths.push(`Has ${product.sustainability.certifications.length} sustainability certifications`);
            }
            if (product.sustainability.packaging.recyclable) {
                insights.strengths.push('Recyclable packaging');
            }
            if (product.sustainability.sourcing.local) {
                insights.strengths.push('Locally sourced');
            }

            // Suggest improvements
            if (!product.sustainability.ecoFriendly) {
                insights.improvements.push('Consider eco-friendly certification');
            }
            if (!product.sustainability.packaging.recyclable) {
                insights.improvements.push('Switch to recyclable packaging');
            }
            if (!product.sustainability.sourcing.local) {
                insights.improvements.push('Consider local sourcing options');
            }
            if (product.sustainability.carbonFootprint.value > 0) {
                insights.improvements.push('Consider carbon offset options');
            }

            return insights;

        } catch (error) {
            console.error('Error getting sustainability insights:', error);
            throw error;
        }
    }

    /**
     * Get market trends and insights
     */
    static async getMarketTrends(category = null, timeframe = 30) {
        try {
            const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

            const query = {
                status: 'active',
                visibility: 'public',
                createdAt: { $gte: startDate }
            };

            if (category) query.category = category;

            const trends = await Product.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            category: '$category',
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        avgPrice: { $avg: '$pricing.basePrice' },
                        avgSustainability: { $avg: '$sustainabilityScore' },
                        totalViews: { $sum: '$stats.views' },
                        totalSales: { $sum: '$stats.sales' }
                    }
                },
                {
                    $sort: { '_id.month': 1 }
                }
            ]);

            return trends;

        } catch (error) {
            console.error('Error getting market trends:', error);
            throw error;
        }
    }

    /**
     * Calculate match score between product and user
     */
    static calculateMatchScore(product, user) {
        let score = 0;
        let factors = 0;

        // Interest matching
        if (user.interests && user.interests.length > 0) {
            const interestMatches = user.interests.filter(interest =>
                product.category === interest ||
                product.tags.includes(interest)
            ).length;
            score += (interestMatches / user.interests.length) * 0.3;
            factors += 1;
        }

        // Sustainability preference
        if (user.preferences?.sustainability) {
            score += (product.sustainabilityScore / 100) * 0.3;
            factors += 1;
        }

        // Price range preference
        if (user.preferences?.maxPrice && product.pricing.basePrice <= user.preferences.maxPrice) {
            score += 0.2;
            factors += 1;
        }

        // Rating preference
        if (product.reviews.averageRating >= 4) {
            score += 0.2;
            factors += 1;
        }

        return factors > 0 ? score / factors : 0;
    }

    /**
     * Get recommendation reason
     */
    static getRecommendationReason(product, user) {
        const reasons = [];

        if (user.interests && user.interests.includes(product.category)) {
            reasons.push('Matches your interests');
        }

        if (product.sustainabilityScore >= 80) {
            reasons.push('High sustainability score');
        }

        if (product.reviews.averageRating >= 4.5) {
            reasons.push('Highly rated by customers');
        }

        if (product.stats.sales > 100) {
            reasons.push('Popular choice');
        }

        return reasons.length > 0 ? reasons.join(', ') : 'Recommended for you';
    }

    /**
     * Remove duplicate products from recommendations
     */
    static removeDuplicateProducts(products) {
        const seen = new Set();
        return products.filter(product => {
            const id = product._id.toString();
            if (seen.has(id)) {
                return false;
            }
            seen.add(id);
            return true;
        });
    }
}

module.exports = MarketplaceAIService;

