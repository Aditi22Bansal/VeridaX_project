const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const CartController = require('../controllers/cartController');
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');
const { body, query, param } = require('express-validator');

// Product routes
router.get('/products', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isString().trim(),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
    query('minSustainabilityScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Sustainability score must be between 0 and 100'),
    query('ecoFriendly').optional().isBoolean().withMessage('Eco friendly must be a boolean'),
    query('search').optional().isString().trim(),
    query('sortBy').optional().isIn(['createdAt', 'pricing.basePrice', 'reviews.averageRating', 'sustainabilityScore']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('seller').optional().isMongoId().withMessage('Invalid seller ID')
], ProductController.getProducts);

router.get('/products/trending', [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('category').optional().isString().trim()
], ProductController.getTrendingProducts);

router.get('/products/eco-friendly', [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isString().trim(),
    query('minScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Min score must be between 0 and 100')
], ProductController.getEcoFriendlyProducts);

router.get('/products/search-suggestions', [
    query('q').isString().isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
], ProductController.getSearchSuggestions);

router.get('/products/:id', [
    param('id').isMongoId().withMessage('Invalid product ID')
], ProductController.getProductById);

router.post('/products', authenticateToken, [
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be 1-100 characters'),
    body('description').isString().isLength({ min: 1, max: 2000 }).withMessage('Description is required and must be 1-2000 characters'),
    body('category').isIn([
        'Food & Beverages', 'Clothing & Accessories', 'Home & Garden',
        'Beauty & Personal Care', 'Electronics', 'Books & Media',
        'Sports & Outdoors', 'Toys & Games', 'Health & Wellness',
        'Office Supplies', 'Automotive', 'Other'
    ]).withMessage('Invalid category'),
    body('pricing.basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('inventory.quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('sustainability.ecoFriendly').optional().isBoolean(),
    body('sustainability.certifications').optional().isArray(),
    body('sustainability.materials').optional().isArray(),
    body('sustainability.packaging.recyclable').optional().isBoolean(),
    body('sustainability.sourcing.local').optional().isBoolean(),
    body('sustainability.sourcing.fairTrade').optional().isBoolean(),
    body('sustainability.sourcing.organic').optional().isBoolean()
], ProductController.createProduct);

router.put('/products/:id', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('description').optional().isString().isLength({ min: 1, max: 2000 }).withMessage('Description must be 1-2000 characters'),
    body('pricing.basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('inventory.quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
], ProductController.updateProduct);

router.delete('/products/:id', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid product ID')
], ProductController.deleteProduct);

router.post('/products/:id/reviews', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title').optional().isString().isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
    body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters'),
    body('images').optional().isArray().withMessage('Images must be an array')
], ProductController.addReview);

router.get('/products/:id/analytics', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid product ID')
], ProductController.getProductAnalytics);

router.put('/products/:id/inventory', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('operation').optional().isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract')
], ProductController.updateInventory);

// Cart routes
router.get('/cart', authenticateToken, CartController.getCart);
router.get('/cart/summary', authenticateToken, CartController.getCartSummary);

router.post('/cart/items', authenticateToken, [
    body('productId').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
    body('notes').optional().isString().isLength({ max: 200 }).withMessage('Notes must be less than 200 characters')
], CartController.addToCart);

router.put('/cart/items/:productId', authenticateToken, [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 0, max: 99 }).withMessage('Quantity must be between 0 and 99')
], CartController.updateCartItem);

router.delete('/cart/items/:productId', authenticateToken, [
    param('productId').isMongoId().withMessage('Invalid product ID')
], CartController.removeFromCart);

router.post('/cart/items/:productId/save-for-later', authenticateToken, [
    param('productId').isMongoId().withMessage('Invalid product ID')
], CartController.saveForLater);

router.post('/cart/items/:productId/move-to-cart', authenticateToken, [
    param('productId').isMongoId().withMessage('Invalid product ID')
], CartController.moveToCart);

router.post('/cart/coupons', authenticateToken, [
    body('code').isString().isLength({ min: 1, max: 20 }).withMessage('Code is required and must be 1-20 characters'),
    body('discount').isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
    body('type').optional().isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed')
], CartController.applyCoupon);

router.delete('/cart/coupons/:code', authenticateToken, [
    param('code').isString().isLength({ min: 1, max: 20 }).withMessage('Code must be 1-20 characters')
], CartController.removeCoupon);

router.put('/cart/shipping', authenticateToken, [
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('method').optional().isIn(['standard', 'express', 'overnight', 'pickup']).withMessage('Invalid shipping method'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('estimatedDays').optional().isInt({ min: 1 }).withMessage('Estimated days must be a positive integer')
], CartController.updateShipping);

router.delete('/cart', authenticateToken, CartController.clearCart);

// Order routes
router.post('/orders', authenticateToken, [
    body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'crypto', 'wallet']).withMessage('Invalid payment method'),
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress.street').isString().isLength({ min: 1 }).withMessage('Street is required'),
    body('shippingAddress.city').isString().isLength({ min: 1 }).withMessage('City is required'),
    body('shippingAddress.country').isString().isLength({ min: 1 }).withMessage('Country is required'),
    body('notes').optional().isObject().withMessage('Notes must be an object')
], OrderController.createOrder);

router.get('/orders', authenticateToken, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
    query('sortBy').optional().isIn(['createdAt', 'pricing.total', 'status']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], OrderController.getUserOrders);

router.get('/orders/:id', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid order ID')
], OrderController.getOrderById);

router.put('/orders/:id/status', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
    body('note').optional().isString().isLength({ max: 500 }).withMessage('Note must be less than 500 characters')
], OrderController.updateOrderStatus);

router.post('/orders/:id/cancel', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], OrderController.cancelOrder);

router.post('/orders/:id/reviews', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('type').isIn(['customer', 'seller']).withMessage('Type must be customer or seller'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
], OrderController.addOrderReview);

router.post('/orders/:id/refund', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('reason').isString().isLength({ min: 1, max: 500 }).withMessage('Reason is required and must be 1-500 characters'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], OrderController.requestRefund);

router.get('/orders/:id/timeline', authenticateToken, [
    param('id').isMongoId().withMessage('Invalid order ID')
], OrderController.getOrderTimeline);

router.get('/orders/analytics', authenticateToken, [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('type').optional().isIn(['sales', 'customer']).withMessage('Type must be sales or customer')
], OrderController.getOrderAnalytics);

// AI-powered recommendations (protected route)
router.get('/recommendations', authenticateToken, [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('category').optional().isString().trim(),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
    query('minSustainabilityScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Sustainability score must be between 0 and 100'),
    query('includeTrending').optional().isBoolean().withMessage('Include trending must be a boolean'),
    query('includePersonalized').optional().isBoolean().withMessage('Include personalized must be a boolean')
], ProductController.getRecommendations);

module.exports = router;

