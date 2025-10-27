const express = require('express');
const { body, validationResult } = require('express-validator');
const Seller = require('../../models/Seller');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { authenticateToken: auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/bazaar/sellers
// @desc    Get all sellers with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      location,
      businessType,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    if (businessType) {
      filter['businessInfo.businessType'] = businessType;
    }

    if (verified !== undefined) {
      filter['verification.isVerified'] = verified === 'true';
    }

    if (search) {
      filter.$or = [
        { shopName: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') },
        { specialties: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sellers with pagination
    const sellers = await Seller.find(filter)
      .populate('userId', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Seller.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sellers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalSellers: total,
          hasNext: skip + sellers.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sellers'
    });
  }
});

// @route   GET /api/bazaar/sellers/my-profile
// @desc    Get current user's seller profile
// @access  Private
router.get('/my-profile', auth, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id })
      .populate('userId', 'name email avatar');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    res.json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller profile'
    });
  }
});

// @route   GET /api/bazaar/sellers/my-products
// @desc    Get seller's own products
// @access  Private
router.get('/my-products', auth, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    const products = await Product.find({ sellerId: seller._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller products'
    });
  }
});

// @route   GET /api/bazaar/sellers/:id
// @desc    Get single seller by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .populate('userId', 'name email avatar');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Get seller's products
    const products = await Product.find({
      sellerId: seller.userId._id,
      status: 'active'
    }).limit(12);

    res.json({
      success: true,
      data: {
        seller,
        products
      }
    });
  } catch (error) {
    console.error('Get seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller'
    });
  }
});

// @route   POST /api/bazaar/sellers
// @desc    Register as a seller
// @access  Private
router.post('/', [
  auth,
  body('shopName', 'Shop name is required').notEmpty().trim(),
  body('bio', 'Bio is required').notEmpty().trim(),
  body('location', 'Location is required').notEmpty().trim(),
  body('businessInfo.businessType', 'Business type is required').isIn(['individual', 'small-business', 'cooperative', 'non-profit']),
  body('contactInfo.phone', 'Phone number is required').optional().isMobilePhone(),
  body('contactInfo.email', 'Valid email is required').optional().isEmail()
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

    // Check if user is already a seller
    const existingSeller = await Seller.findOne({ userId: req.user.id });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'User is already registered as a seller'
      });
    }

    const {
      shopName,
      bio,
      location,
      contactInfo,
      businessInfo,
      policies,
      specialties
    } = req.body;

    const seller = new Seller({
      userId: req.user.id,
      shopName,
      bio,
      location,
      contactInfo: contactInfo || {},
      businessInfo: businessInfo || {},
      policies: policies || {},
      specialties: specialties || []
    });

    await seller.save();

    res.status(201).json({
      success: true,
      message: 'Seller registration successful. Account is pending approval.',
      data: seller
    });
  } catch (error) {
    console.error('Register seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering seller'
    });
  }
});

// @route   PUT /api/bazaar/sellers
// @desc    Update seller profile
// @access  Private (Seller)
router.put('/', [
  auth,
  body('shopName', 'Shop name is required').optional().notEmpty().trim(),
  body('bio', 'Bio is required').optional().notEmpty().trim(),
  body('location', 'Location is required').optional().notEmpty().trim()
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

    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    const updateData = req.body;
    const updatedSeller = await Seller.findByIdAndUpdate(
      seller._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email avatar');

    res.json({
      success: true,
      message: 'Seller profile updated successfully',
      data: updatedSeller
    });
  } catch (error) {
    console.error('Update seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating seller profile'
    });
  }
});

// @route   GET /api/bazaar/sellers/dashboard/stats
// @desc    Get seller dashboard stats
// @access  Private (Seller)
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    // Get recent orders
    const recentOrders = await Order.find({ sellerId: seller._id })
      .populate('buyerId', 'name')
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get product statistics
    const totalProducts = await Product.countDocuments({ sellerId: seller._id });
    const activeProducts = await Product.countDocuments({
      sellerId: seller._id,
      status: 'active'
    });
    const outOfStockProducts = await Product.countDocuments({
      sellerId: seller._id,
      status: 'out-of-stock'
    });

    // Get all-time sales and orders
    const allTimeSales = await Order.aggregate([
      {
        $match: {
          sellerId: seller._id
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Get delivered/shipped sales for revenue calculation
    const completedSales = await Order.aggregate([
      {
        $match: {
          sellerId: seller._id,
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: null,
          completedSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Calculate real-time stats from actual data
    const totalOrdersFromOrders = allTimeSales[0]?.totalOrders || 0;
    const completedSalesAmount = completedSales[0]?.completedSales || 0;

    const stats = {
      totalSales: completedSalesAmount, // Only count completed sales as revenue
      totalOrders: totalOrdersFromOrders, // Count all orders regardless of status
      totalProducts,
      activeProducts,
      outOfStockProducts,
      monthlySales: allTimeSales[0] || { totalSales: 0, totalOrders: 0 },
      averageRating: seller.averageRating,
      totalRatings: seller.totalRatings
    };

    res.json({
      success: true,
      data: {
        stats,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get seller stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller stats'
    });
  }
});

// @route   POST /api/bazaar/sellers/:id/rate
// @desc    Rate a seller
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

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const { rating, review } = req.body;

    await seller.addRating(req.user.id, rating, review);

    res.json({
      success: true,
      message: 'Seller rated successfully'
    });
  } catch (error) {
    console.error('Rate seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rating seller'
    });
  }
});

module.exports = router;
