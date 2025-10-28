const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../../models/Product');
const Seller = require('../../models/Seller');
const { authenticateToken: auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/bazaar/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      sellerId
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    if (sellerId) {
      filter.sellerId = sellerId;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('sellerId', 'name shopName userId')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          hasNext: skip + products.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @route   GET /api/bazaar/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name shopName location contactInfo')
      .populate('ratings.userId', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
});

// @route   POST /api/bazaar/products
// @desc    Create new product
// @access  Private (Seller)
router.post('/', [
  auth,
  body('name', 'Product name is required').notEmpty().trim(),
  body('description', 'Product description is required').notEmpty().trim(),
  body('price', 'Valid price is required').isNumeric().isFloat({ min: 0 }),
  body('category', 'Valid category is required').isIn(['handmade', 'eco-friendly', 'artisan', 'upcycled', 'organic', 'sustainable', 'community-crafted', 'other']),
  body('stock', 'Valid stock quantity is required').isInt({ min: 0 }),
  body('location', 'Location is required').notEmpty().trim(),
  body('images', 'At least one image is required').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user is a seller
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'User is not registered as a seller. Please complete seller registration first.'
      });
    }

    // Allow adding products for active sellers (and pending-approval during initial onboarding)
    if (!['active', 'pending-approval'].includes(seller.status)) {
      return res.status(403).json({
        success: false,
        message: 'Seller account is not active'
      });
    }

    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      materials,
      sustainabilityRating,
      location,
      deliveryInfo,
      tags,
      weight,
      dimensions
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      category,
      images,
      sellerId: req.user.id,
      stock,
      materials: materials || [],
      sustainabilityRating: sustainabilityRating || 3,
      location,
      deliveryInfo: deliveryInfo || {},
      tags: tags || [],
      weight,
      dimensions
    });

    await product.save();

    // Update seller's product count
    await seller.updateStats(0, 0, 1);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
});

// @route   PUT /api/bazaar/products/:id
// @desc    Update product
// @access  Private (Seller - Owner)
router.put('/:id', [
  auth,
  body('name', 'Product name is required').optional().notEmpty().trim(),
  body('description', 'Product description is required').optional().notEmpty().trim(),
  body('price', 'Valid price is required').optional().isNumeric().isFloat({ min: 0 }),
  body('stock', 'Valid stock quantity is required').optional().isInt({ min: 0 })
], async (req, res) => {
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

    // Find the seller profile for this user
    const Seller = require('../../models/Seller');
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    // Check if user owns this product
    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const updateData = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
});

// @route   DELETE /api/bazaar/products/:id
// @desc    Delete product
// @access  Private (Seller - Owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the seller profile for this user
    const Seller = require('../../models/Seller');
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    // Check if user owns this product
    if (product.sellerId.toString() !== seller._id.toString()) {
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
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
});

// @route   POST /api/bazaar/products/:id/rate
// @desc    Rate a product
// @access  Private
router.post('/:id/rate', [
  auth,
  body('rating', 'Valid rating is required').isInt({ min: 1, max: 5 }),
  body('review', 'Review must be less than 500 characters').optional().isLength({ max: 500 })
], async (req, res) => {
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

    const { rating, review } = req.body;

    await product.addRating(req.user.id, rating, review);

    res.json({
      success: true,
      message: 'Product rated successfully'
    });
  } catch (error) {
    console.error('Rate product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rating product'
    });
  }
});

module.exports = router;
