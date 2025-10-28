const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { authenticateToken: auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/bazaar/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role = 'buyer' } = req.query;

    let filter = {};
    if (role === 'buyer') {
      filter.buyerId = req.user.id;
    } else if (role === 'seller') {
      filter.sellerId = req.user.id;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { createdAt: -1 };

    const orders = await Order.find(filter)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name shopName')
      .populate('items.productId', 'name images price')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNext: skip + orders.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// @route   GET /api/bazaar/orders/seller
// @desc    Get seller's orders
// @access  Private (Seller)
router.get('/seller', auth, async (req, res) => {
  try {
    // Find the seller profile for this user
    const Seller = require('../../models/Seller');
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    // Order.sellerId stores the seller's User _id, not the Seller document _id
    let filter = { sellerId: seller.userId };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { createdAt: -1 };

    const orders = await Order.find(filter)
      .populate('buyerId', 'name email')
      .populate('items.productId', 'name images price')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller orders'
    });
  }
});

// @route   GET /api/bazaar/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name shopName contactInfo')
      .populate('items.productId', 'name images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    const isBuyer = order.buyerId._id.toString() === req.user.id;

    // Check if user is the seller by looking up the seller profile
    const Seller = require('../../models/Seller');
    const seller = await Seller.findOne({ userId: req.user.id });
    const isSeller = seller && order.sellerId._id.toString() === seller.userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
});

// @route   POST /api/bazaar/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  auth,
  body('items', 'Order items are required').isArray({ min: 1 }),
  body('items.*.productId', 'Product ID is required').isMongoId(),
  body('items.*.quantity', 'Valid quantity is required').isInt({ min: 1 }),
  body('shippingAddress.name', 'Shipping name is required').notEmpty().trim(),
  body('shippingAddress.street', 'Shipping street is required').notEmpty().trim(),
  body('shippingAddress.city', 'Shipping city is required').notEmpty().trim(),
  body('shippingAddress.state', 'Shipping state is required').notEmpty().trim(),
  body('shippingAddress.zipCode', 'Shipping zip code is required').notEmpty().trim(),
  body('shippingAddress.country', 'Shipping country is required').notEmpty().trim(),
  body('paymentInfo.method', 'Payment method is required').isIn(['credit-card', 'debit-card', 'paypal', 'bank-transfer', 'cash-on-delivery'])
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

    const { items, shippingAddress, paymentInfo, notes } = req.body;

    // Validate products and calculate totals
    let totalAmount = 0;
    let sellerId = null;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (!product.isInStock) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is out of stock`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      // Set seller ID (assuming all items are from same seller)
      if (!sellerId) {
        sellerId = product.sellerId;
      } else if (sellerId.toString() !== product.sellerId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All items must be from the same seller'
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create order
    const order = new Order({
      buyerId: req.user.id,
      sellerId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentInfo,
      notes: notes || {}
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
});

// @route   PUT /api/bazaar/orders/:id/status
// @desc    Update order status
// @access  Private (Seller or Buyer)
router.put('/:id/status', [
  auth,
  body('status', 'Valid status is required').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  body('note', 'Status note must be less than 200 characters').optional().isLength({ max: 200 })
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isBuyer = order.buyerId.toString() === req.user.id;

    // Check if user is the seller by looking up the seller profile
    const Seller = require('../../models/Seller');
    const seller = await Seller.findOne({ userId: req.user.id });
    // Order.sellerId stores the seller's User _id
    const isSeller = seller && order.sellerId.toString() === seller.userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    const { status, note } = req.body;

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'shipped', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    await order.updateStatus(status, note);

    // If order is shipped, create a delivery record
    if (status === 'shipped') {
      try {
        const Delivery = require('../../models/Delivery');

        // Find a volunteer for this delivery (for now, we'll assign the first available volunteer)
        // In a real system, you'd have a volunteer assignment algorithm
        const User = require('../../models/User');
        const volunteer = await User.findOne({ role: 'volunteer' });

        if (volunteer) {
          const delivery = new Delivery({
            orderId: order._id,
            volunteerId: volunteer._id,
            sellerId: order.sellerId,
            buyerId: order.buyerId,
            status: 'assigned',
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
            estimatedDeliveryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
          });

          await delivery.save();
        }
      } catch (deliveryError) {
        console.error('Error creating delivery record:', deliveryError);
        // Don't fail the order update if delivery creation fails
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});

// @route   PUT /api/bazaar/orders/:id/tracking
// @desc    Add tracking information
// @access  Private (Seller)
router.put('/:id/tracking', [
  auth,
  body('trackingNumber', 'Tracking number is required').notEmpty().trim(),
  body('carrier', 'Carrier is required').notEmpty().trim(),
  body('estimatedDelivery', 'Estimated delivery date is required').isISO8601()
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the seller
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can add tracking information'
      });
    }

    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    await order.addTracking(trackingNumber, carrier, new Date(estimatedDelivery));

    res.json({
      success: true,
      message: 'Tracking information added successfully',
      data: order
    });
  } catch (error) {
    console.error('Add tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding tracking information'
    });
  }
});

// @route   PUT /api/bazaar/orders/:id/delivered
// @desc    Mark order as delivered
// @access  Private (Buyer)
router.put('/:id/delivered', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can mark order as delivered'
      });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: 'Order must be shipped before marking as delivered'
      });
    }

    await order.markAsDelivered();

    res.json({
      success: true,
      message: 'Order marked as delivered successfully',
      data: order
    });
  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking order as delivered'
    });
  }
});

module.exports = router;
