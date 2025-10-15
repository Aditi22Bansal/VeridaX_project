const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { validationResult } = require('express-validator');

class OrderController {
    /**
     * Create order from cart
     */
    static async createOrder(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { paymentMethod, shippingAddress, notes = {} } = req.body;

            // Get user's cart
            const cart = await Cart.findOne({ user: req.user.id })
                .populate('items.product');

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Validate all items are still available
            for (const item of cart.items) {
                const product = await Product.findById(item.product._id);
                if (!product || product.status !== 'active') {
                    return res.status(400).json({
                        success: false,
                        message: `Product ${item.product.name} is no longer available`
                    });
                }

                if (product.inventory.quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient inventory for ${item.product.name}`
                    });
                }
            }

            // Group items by seller
            const sellerGroups = {};
            for (const item of cart.items) {
                const sellerId = item.product.seller.toString();
                if (!sellerGroups[sellerId]) {
                    sellerGroups[sellerId] = [];
                }
                sellerGroups[sellerId].push(item);
            }

            const orders = [];

            // Create separate order for each seller
            for (const [sellerId, items] of Object.entries(sellerGroups)) {
                const seller = await User.findById(sellerId);
                if (!seller) {
                    continue; // Skip if seller not found
                }

                // Calculate order totals
                let subtotal = 0;
                const orderItems = [];

                for (const item of items) {
                    const product = await Product.findById(item.product._id);
                    const unitPrice = product.currentPrice || product.pricing.basePrice;
                    const totalPrice = unitPrice * item.quantity;

                    orderItems.push({
                        product: item.product._id,
                        quantity: item.quantity,
                        unitPrice,
                        totalPrice,
                        productSnapshot: {
                            name: item.product.name,
                            description: item.product.description,
                            images: item.product.media.images.map(img => img.url),
                            specifications: item.product.specifications
                        }
                    });

                    subtotal += totalPrice;
                }

                const shipping = cart.shipping.cost || 0;
                const tax = subtotal * 0.08; // 8% tax - should be configurable
                const discount = cart.pricing.discount || 0;
                const total = subtotal + shipping + tax - discount;

                // Create order
                const order = new Order({
                    customer: req.user.id,
                    seller: sellerId,
                    items: orderItems,
                    pricing: {
                        subtotal,
                        shipping,
                        tax,
                        discount,
                        total,
                        currency: cart.pricing.currency
                    },
                    shipping: {
                        address: shippingAddress || cart.shipping.address,
                        method: cart.shipping.method,
                        cost: shipping,
                        estimatedDays: cart.shipping.estimatedDays
                    },
                    payment: {
                        method: paymentMethod,
                        status: 'pending'
                    },
                    notes: {
                        customer: notes.customer || '',
                        internal: notes.internal || ''
                    },
                    sustainability: {
                        carbonOffset: {
                            amount: 0, // Calculate based on shipping
                            unit: 'kg CO2',
                            offset: false
                        },
                        ecoFriendlyShipping: cart.shipping.method === 'standard',
                        sustainablePackaging: true, // Assume sustainable packaging
                        localSourcing: false // Calculate based on seller location
                    }
                });

                await order.save();
                orders.push(order);

                // Update product inventory
                for (const item of orderItems) {
                    const product = await Product.findById(item.product);
                    await product.updateInventory(item.quantity, 'subtract');
                }
            }

            // Clear cart after successful order creation
            await cart.clear();

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: orders
            });

        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: error.message
            });
        }
    }

    /**
     * Get user's orders
     */
    static async getUserOrders(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const query = {
                $or: [
                    { customer: req.user.id },
                    { seller: req.user.id }
                ]
            };

            if (status) {
                query.status = status;
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const orders = await Order.find(query)
                .populate('customer', 'name email')
                .populate('seller', 'name email')
                .populate('items.product', 'name images')
                .sort(sortOptions)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Order.countDocuments(query);

            res.json({
                success: true,
                data: orders,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error getting user orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get orders',
                error: error.message
            });
        }
    }

    /**
     * Get order by ID
     */
    static async getOrderById(req, res) {
        try {
            const order = await Order.findById(req.params.id)
                .populate('customer', 'name email')
                .populate('seller', 'name email')
                .populate('items.product', 'name images specifications')
                .populate('timeline.updatedBy', 'name email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user is authorized to view this order
            if (order.customer._id.toString() !== req.user.id &&
                order.seller._id.toString() !== req.user.id) {
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
            console.error('Error getting order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get order',
                error: error.message
            });
        }
    }

    /**
     * Update order status
     */
    static async updateOrderStatus(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { status, note = '' } = req.body;

            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user is authorized to update this order
            if (order.seller._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this order'
                });
            }

            await order.updateStatus(status, note, req.user.id);

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });

        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    }

    /**
     * Cancel order
     */
    static async cancelOrder(req, res) {
        try {
            const { reason = 'Customer requested cancellation' } = req.body;

            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user is authorized to cancel this order
            if (order.customer._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to cancel this order'
                });
            }

            // Check if order can be cancelled
            if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Order cannot be cancelled at this stage'
                });
            }

            await order.updateStatus('cancelled', reason, req.user.id);

            // Restore inventory
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    await product.updateInventory(item.quantity, 'add');
                }
            }

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                data: order
            });

        } catch (error) {
            console.error('Error cancelling order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order',
                error: error.message
            });
        }
    }

    /**
     * Add order review
     */
    static async addOrderReview(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { type, rating, comment } = req.body;

            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user is authorized to review this order
            if (order.customer._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to review this order'
                });
            }

            // Check if order is delivered
            if (order.status !== 'delivered') {
                return res.status(400).json({
                    success: false,
                    message: 'Order must be delivered before reviewing'
                });
            }

            await order.addReview(type, rating, comment);

            res.json({
                success: true,
                message: 'Review added successfully'
            });

        } catch (error) {
            console.error('Error adding order review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add review',
                error: error.message
            });
        }
    }

    /**
     * Request refund
     */
    static async requestRefund(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { reason, amount, notes = '' } = req.body;

            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user is authorized to request refund
            if (order.customer._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to request refund for this order'
                });
            }

            // Check if refund can be requested
            if (order.refund.requested) {
                return res.status(400).json({
                    success: false,
                    message: 'Refund already requested for this order'
                });
            }

            await order.processRefund(amount, reason, notes);

            res.json({
                success: true,
                message: 'Refund request submitted successfully',
                data: order.refund
            });

        } catch (error) {
            console.error('Error requesting refund:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to request refund',
                error: error.message
            });
        }
    }

    /**
     * Get order analytics
     */
    static async getOrderAnalytics(req, res) {
        try {
            const { startDate, endDate, type = 'sales' } = req.query;

            let analytics;

            if (type === 'sales') {
                analytics = await Order.getSalesAnalytics(req.user.id, startDate, endDate);
            } else if (type === 'customer') {
                analytics = await Order.getCustomerAnalytics(req.user.id, startDate, endDate);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid analytics type'
                });
            }

            res.json({
                success: true,
                data: analytics
            });

        } catch (error) {
            console.error('Error getting order analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get order analytics',
                error: error.message
            });
        }
    }

    /**
     * Get order timeline
     */
    static async getOrderTimeline(req, res) {
        try {
            const order = await Order.findById(req.params.id)
                .populate('timeline.updatedBy', 'name email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if user is authorized to view this order
            if (order.customer._id.toString() !== req.user.id &&
                order.seller._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this order'
                });
            }

            res.json({
                success: true,
                data: order.timeline
            });

        } catch (error) {
            console.error('Error getting order timeline:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get order timeline',
                error: error.message
            });
        }
    }
}

module.exports = OrderController;

