const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

class CartController {
    /**
     * Get user's cart
     */
    static async getCart(req, res) {
        try {
            const cart = await Cart.findOne({ user: req.user.id })
                .populate('items.product', 'name description pricing images specifications')
                .populate('savedForLater.product', 'name description pricing images specifications');

            if (!cart) {
                // Create new cart if doesn't exist
                const newCart = new Cart({ user: req.user.id });
                await newCart.save();
                return res.json({
                    success: true,
                    data: newCart
                });
            }

            // Calculate totals
            await cart.calculateTotals();

            res.json({
                success: true,
                data: cart
            });

        } catch (error) {
            console.error('Error getting cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get cart',
                error: error.message
            });
        }
    }

    /**
     * Add item to cart
     */
    static async addToCart(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { productId, quantity = 1, notes = '' } = req.body;

            // Check if product exists and is available
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (product.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Product is not available for purchase'
                });
            }

            if (product.inventory.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient inventory'
                });
            }

            // Get or create cart
            let cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                cart = new Cart({ user: req.user.id });
            }

            // Add item to cart
            await cart.addItem(productId, quantity, notes);
            await cart.calculateTotals();

            // Populate product details
            await cart.populate('items.product', 'name description pricing images specifications');

            res.json({
                success: true,
                message: 'Item added to cart successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add item to cart',
                error: error.message
            });
        }
    }

    /**
     * Update cart item quantity
     */
    static async updateCartItem(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { quantity } = req.body;
            const { productId } = req.params;

            if (quantity < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity cannot be negative'
                });
            }

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            // Check product availability if adding quantity
            if (quantity > 0) {
                const product = await Product.findById(productId);
                if (!product || product.status !== 'active') {
                    return res.status(400).json({
                        success: false,
                        message: 'Product is not available'
                    });
                }

                if (product.inventory.quantity < quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Insufficient inventory'
                    });
                }
            }

            await cart.updateQuantity(productId, quantity);
            await cart.calculateTotals();

            // Populate product details
            await cart.populate('items.product', 'name description pricing images specifications');

            res.json({
                success: true,
                message: 'Cart updated successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error updating cart item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update cart item',
                error: error.message
            });
        }
    }

    /**
     * Remove item from cart
     */
    static async removeFromCart(req, res) {
        try {
            const { productId } = req.params;

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            await cart.removeItem(productId);
            await cart.calculateTotals();

            // Populate product details
            await cart.populate('items.product', 'name description pricing images specifications');

            res.json({
                success: true,
                message: 'Item removed from cart successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error removing from cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from cart',
                error: error.message
            });
        }
    }

    /**
     * Save item for later
     */
    static async saveForLater(req, res) {
        try {
            const { productId } = req.params;

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            await cart.saveForLater(productId);
            await cart.calculateTotals();

            // Populate product details
            await cart.populate('items.product', 'name description pricing images specifications');
            await cart.populate('savedForLater.product', 'name description pricing images specifications');

            res.json({
                success: true,
                message: 'Item saved for later successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error saving for later:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save item for later',
                error: error.message
            });
        }
    }

    /**
     * Move item from saved for later to cart
     */
    static async moveToCart(req, res) {
        try {
            const { productId } = req.params;

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            await cart.moveToCart(productId);
            await cart.calculateTotals();

            // Populate product details
            await cart.populate('items.product', 'name description pricing images specifications');
            await cart.populate('savedForLater.product', 'name description pricing images specifications');

            res.json({
                success: true,
                message: 'Item moved to cart successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error moving to cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to move item to cart',
                error: error.message
            });
        }
    }

    /**
     * Apply coupon to cart
     */
    static async applyCoupon(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { code, discount, type = 'percentage' } = req.body;

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            if (cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            try {
                await cart.applyCoupon(code, discount, type);
                await cart.calculateTotals();

                // Populate product details
                await cart.populate('items.product', 'name description pricing images specifications');

                res.json({
                    success: true,
                    message: 'Coupon applied successfully',
                    data: cart
                });
            } catch (couponError) {
                res.status(400).json({
                    success: false,
                    message: couponError.message
                });
            }

        } catch (error) {
            console.error('Error applying coupon:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to apply coupon',
                error: error.message
            });
        }
    }

    /**
     * Remove coupon from cart
     */
    static async removeCoupon(req, res) {
        try {
            const { code } = req.params;

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            await cart.removeCoupon(code);
            await cart.calculateTotals();

            // Populate product details
            await cart.populate('items.product', 'name description pricing images specifications');

            res.json({
                success: true,
                message: 'Coupon removed successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error removing coupon:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove coupon',
                error: error.message
            });
        }
    }

    /**
     * Update shipping information
     */
    static async updateShipping(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { address, method, cost, estimatedDays } = req.body;

            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            cart.shipping = {
                address: address || cart.shipping.address,
                method: method || cart.shipping.method,
                cost: cost !== undefined ? cost : cart.shipping.cost,
                estimatedDays: estimatedDays || cart.shipping.estimatedDays
            };

            await cart.calculateTotals();

            // Populate product details
            await cart.populate('items.product', 'name description pricing images specifications');

            res.json({
                success: true,
                message: 'Shipping information updated successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error updating shipping:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update shipping information',
                error: error.message
            });
        }
    }

    /**
     * Clear cart
     */
    static async clearCart(req, res) {
        try {
            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            await cart.clear();

            res.json({
                success: true,
                message: 'Cart cleared successfully',
                data: cart
            });

        } catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clear cart',
                error: error.message
            });
        }
    }

    /**
     * Get cart summary
     */
    static async getCartSummary(req, res) {
        try {
            const cart = await Cart.findOne({ user: req.user.id })
                .populate('items.product', 'name pricing images');

            if (!cart) {
                return res.json({
                    success: true,
                    data: {
                        itemCount: 0,
                        totalQuantity: 0,
                        subtotal: 0,
                        shipping: 0,
                        tax: 0,
                        discount: 0,
                        total: 0,
                        currency: 'USD',
                        savedForLaterCount: 0
                    }
                });
            }

            await cart.calculateTotals();
            const summary = cart.getSummary();

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('Error getting cart summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get cart summary',
                error: error.message
            });
        }
    }
}

module.exports = CartController;

