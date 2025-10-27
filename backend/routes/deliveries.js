const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Seller = require('../models/Seller');

// Helper function to update seller ratings
const updateSellerRatings = async (sellerUserId) => {
  try {
    // Find all feedback for this seller
    const sellerFeedbacks = await Feedback.find({
      toUserId: sellerUserId,
      feedbackType: { $in: ['buyer-to-seller', 'volunteer-to-seller'] },
      status: 'approved'
    });

    if (sellerFeedbacks.length === 0) return;

    // Calculate average rating
    const totalRating = sellerFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = Math.round((totalRating / sellerFeedbacks.length) * 10) / 10;

    // Calculate category averages if available
    const categoryAverages = {};
    const categories = ['deliverySpeed', 'communication', 'productQuality', 'packaging', 'overallExperience'];

    categories.forEach(category => {
      const categoryFeedbacks = sellerFeedbacks.filter(fb => fb.categories && fb.categories[category]);
      if (categoryFeedbacks.length > 0) {
        const categoryTotal = categoryFeedbacks.reduce((sum, fb) => sum + fb.categories[category], 0);
        categoryAverages[category] = Math.round((categoryTotal / categoryFeedbacks.length) * 10) / 10;
      }
    });

    // Update seller profile
    const seller = await Seller.findOne({ userId: sellerUserId });
    if (seller) {
      seller.averageRating = averageRating;
      seller.totalRatings = sellerFeedbacks.length;
      seller.categoryRatings = categoryAverages;
      await seller.save();
    }

    // Update user profile if needed
    const user = await User.findById(sellerUserId);
    if (user) {
      user.averageRating = averageRating;
      user.totalRatings = sellerFeedbacks.length;
      await user.save();
    }

  } catch (error) {
    console.error('Error updating seller ratings:', error);
  }
};

// @route   GET /api/deliveries/volunteer
// @desc    Get volunteer's deliveries
// @access  Private (Volunteer)
router.get('/volunteer', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { volunteerId: req.user.id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Delivery.find(filter)
      .populate('orderId', 'items totalAmount status')
      .populate('sellerId', 'name email')
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(filter);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDeliveries: total,
        hasNext: skip + deliveries.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get volunteer deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deliveries'
    });
  }
});

// @route   GET /api/deliveries/seller
// @desc    Get seller's deliveries
// @access  Private (Seller)
router.get('/seller', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { sellerId: req.user.id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Delivery.find(filter)
      .populate('orderId', 'items totalAmount status')
      .populate('volunteerId', 'name email avatar')
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(filter);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDeliveries: total,
        hasNext: skip + deliveries.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get seller deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deliveries'
    });
  }
});

// @route   GET /api/deliveries/buyer
// @desc    Get buyer's deliveries
// @access  Private (Buyer)
router.get('/buyer', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { buyerId: req.user.id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Delivery.find(filter)
      .populate('orderId', 'items totalAmount status')
      .populate('volunteerId', 'name email avatar')
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(filter);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDeliveries: total,
        hasNext: skip + deliveries.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get buyer deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deliveries'
    });
  }
});

// @route   GET /api/deliveries/:id
// @desc    Get single delivery by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('orderId', 'items totalAmount status')
      .populate('volunteerId', 'name email avatar')
      .populate('sellerId', 'name email')
      .populate('buyerId', 'name email');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check if user is authorized to view this delivery
    const isBuyer = delivery.buyerId._id.toString() === req.user.id;
    const isSeller = delivery.sellerId._id.toString() === req.user.id;
    const isVolunteer = delivery.volunteerId._id.toString() === req.user.id;

    if (!isBuyer && !isSeller && !isVolunteer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this delivery'
      });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery'
    });
  }
});

// @route   PUT /api/deliveries/:id/status
// @desc    Update delivery status
// @access  Private (Volunteer)
router.put('/:id/status', [
  auth,
  body('status', 'Valid status is required').isIn(['picked-up', 'in-transit', 'delivered', 'failed']),
  body('note', 'Status note must be less than 200 characters').optional().isLength({ max: 200 }),
  body('location.latitude', 'Valid latitude is required').optional().isFloat({ min: -90, max: 90 }),
  body('location.longitude', 'Valid longitude is required').optional().isFloat({ min: -180, max: 180 })
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

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check if user is the volunteer
    if (delivery.volunteerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    const { status, note, location } = req.body;

    // Validate status transitions
    const validTransitions = {
      'assigned': ['picked-up'],
      'picked-up': ['in-transit', 'failed'],
      'in-transit': ['delivered', 'failed'],
      'delivered': [],
      'failed': []
    };

    if (!validTransitions[delivery.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${delivery.status} to ${status}`
      });
    }

    await delivery.updateStatus(status, note, location);

    // If delivered, update order status
    if (status === 'delivered') {
      const order = await Order.findById(delivery.orderId);
      if (order) {
        order.status = 'delivered';
        await order.save();
      }
    }

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating delivery status'
    });
  }
});

// @route   POST /api/deliveries/:id/feedback
// @desc    Submit feedback for delivery
// @access  Private
router.post('/:id/feedback', [
  auth,
  body('feedbackType', 'Valid feedback type is required').isIn(['buyer-to-seller', 'buyer-to-volunteer', 'seller-to-volunteer', 'volunteer-to-seller', 'volunteer-to-buyer']),
  body('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
  body('review', 'Review must be less than 500 characters').optional().isLength({ max: 500 }),
  body('categories.deliverySpeed', 'Delivery speed rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
  body('categories.communication', 'Communication rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
  body('categories.productQuality', 'Product quality rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
  body('categories.packaging', 'Packaging rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
  body('categories.overallExperience', 'Overall experience rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 })
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

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    const { feedbackType, rating, review, categories, isAnonymous = false } = req.body;

    // Determine who is giving feedback to whom
    let toUserId;
    if (feedbackType === 'buyer-to-seller') {
      toUserId = delivery.sellerId;
    } else if (feedbackType === 'buyer-to-volunteer') {
      toUserId = delivery.volunteerId;
    } else if (feedbackType === 'seller-to-volunteer') {
      toUserId = delivery.volunteerId;
    } else if (feedbackType === 'volunteer-to-seller') {
      toUserId = delivery.sellerId;
    } else if (feedbackType === 'volunteer-to-buyer') {
      toUserId = delivery.buyerId;
    }

    // Check if user is authorized to give this feedback
    const isAuthorized =
      (feedbackType.startsWith('buyer') && delivery.buyerId.toString() === req.user.id) ||
      (feedbackType.startsWith('seller') && delivery.sellerId.toString() === req.user.id) ||
      (feedbackType.startsWith('volunteer') && delivery.volunteerId.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this feedback'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      deliveryId: delivery._id,
      fromUserId: req.user.id,
      feedbackType
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this delivery'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      fromUserId: req.user.id,
      toUserId,
      feedbackType,
      rating,
      review,
      categories,
      isAnonymous
    });

    await feedback.save();

    // Update delivery feedback
    if (feedbackType === 'buyer-to-seller') {
      delivery.feedback.buyerRating = rating;
      delivery.feedback.buyerReview = review;
    } else if (feedbackType === 'seller-to-volunteer') {
      delivery.feedback.sellerRating = rating;
      delivery.feedback.sellerReview = review;
    } else if (feedbackType === 'volunteer-to-seller') {
      delivery.feedback.volunteerRating = rating;
      delivery.feedback.volunteerReview = review;
    }

    await delivery.save();

    // Update seller ratings if feedback is for a seller
    if (feedbackType === 'buyer-to-seller' || feedbackType === 'volunteer-to-seller') {
      await updateSellerRatings(toUserId);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback'
    });
  }
});

// @route   GET /api/deliveries/:id/feedback
// @desc    Get feedback for delivery
// @access  Private
router.get('/:id/feedback', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check if user is authorized to view feedback
    const isBuyer = delivery.buyerId.toString() === req.user.id;
    const isSeller = delivery.sellerId.toString() === req.user.id;
    const isVolunteer = delivery.volunteerId.toString() === req.user.id;

    if (!isBuyer && !isSeller && !isVolunteer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view feedback for this delivery'
      });
    }

    const feedback = await Feedback.find({ deliveryId: delivery._id })
      .populate('fromUserId', 'name avatar')
      .populate('toUserId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback'
    });
  }
});

// @route   POST /api/deliveries/create-for-order/:orderId
// @desc    Create delivery record for existing order
// @access  Private (Admin/Seller)
router.post('/create-for-order/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ orderId });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery record already exists for this order'
      });
    }

    // Find a volunteer for this delivery
    const User = require('../../models/User');
    const volunteer = await User.findOne({ role: 'volunteer' });

    if (!volunteer) {
      return res.status(400).json({
        success: false,
        message: 'No volunteers available for delivery'
      });
    }

    // Create delivery record
    const delivery = new Delivery({
      orderId: order._id,
      volunteerId: volunteer._id,
      sellerId: order.sellerId,
      buyerId: order.buyerId,
      status: order.status === 'delivered' ? 'delivered' : 'assigned',
      deliveryAddress: order.shippingAddress,
      pickupAddress: {
        name: 'Seller Location',
        street: '123 Seller Street',
        city: 'Seller City',
        state: 'Seller State',
        zipCode: '12345',
        country: 'Seller Country',
        phone: '123-456-7890'
      },
      estimatedDeliveryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveredAt: order.status === 'delivered' ? new Date() : null
    });

    await delivery.save();

    res.status(201).json({
      success: true,
      message: 'Delivery record created successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Create delivery for order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating delivery record'
    });
  }
});

module.exports = router;
