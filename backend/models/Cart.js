const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 99
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    savedForLater: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        savedAt: {
            type: Date,
            default: Date.now
        }
    }],
    shipping: {
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        method: {
            type: String,
            enum: ['standard', 'express', 'overnight', 'pickup'],
            default: 'standard'
        },
        cost: {
            type: Number,
            default: 0
        },
        estimatedDays: Number
    },
    pricing: {
        subtotal: {
            type: Number,
            default: 0
        },
        shipping: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    coupons: [{
        code: String,
        discount: Number,
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        }
    }
}, {
    timestamps: true
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1, notes = '') {
    const existingItem = this.items.find(item =>
        item.product.toString() === productId.toString()
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        if (notes) existingItem.notes = notes;
    } else {
        this.items.push({
            product: productId,
            quantity,
            notes
        });
    }

    this.lastUpdated = new Date();
    return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(item =>
        item.product.toString() !== productId.toString()
    );
    this.lastUpdated = new Date();
    return this.save();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = function(productId, quantity) {
    const item = this.items.find(item =>
        item.product.toString() === productId.toString()
    );

    if (item) {
        if (quantity <= 0) {
            return this.removeItem(productId);
        }
        item.quantity = quantity;
        this.lastUpdated = new Date();
    }

    return this.save();
};

// Method to move item to saved for later
cartSchema.methods.saveForLater = function(productId) {
    const itemIndex = this.items.findIndex(item =>
        item.product.toString() === productId.toString()
    );

    if (itemIndex !== -1) {
        const item = this.items[itemIndex];
        this.savedForLater.push({
            product: item.product,
            quantity: item.quantity,
            savedAt: new Date()
        });
        this.items.splice(itemIndex, 1);
        this.lastUpdated = new Date();
    }

    return this.save();
};

// Method to move item from saved for later to cart
cartSchema.methods.moveToCart = function(productId) {
    const itemIndex = this.savedForLater.findIndex(item =>
        item.product.toString() === productId.toString()
    );

    if (itemIndex !== -1) {
        const item = this.savedForLater[itemIndex];
        this.addItem(item.product, item.quantity);
        this.savedForLater.splice(itemIndex, 1);
    }

    return this.save();
};

// Method to clear cart
cartSchema.methods.clear = function() {
    this.items = [];
    this.savedForLater = [];
    this.pricing = {
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 0,
        currency: 'USD'
    };
    this.coupons = [];
    this.lastUpdated = new Date();
    return this.save();
};

// Method to calculate totals
cartSchema.methods.calculateTotals = async function() {
    const Product = mongoose.model('Product');

    let subtotal = 0;

    for (const item of this.items) {
        const product = await Product.findById(item.product);
        if (product) {
            const price = product.currentPrice || product.pricing.basePrice;
            subtotal += price * item.quantity;
        }
    }

    this.pricing.subtotal = subtotal;
    this.pricing.shipping = this.shipping.cost || 0;
    this.pricing.tax = this.pricing.subtotal * 0.08; // 8% tax - should be configurable
    this.pricing.discount = this.coupons.reduce((total, coupon) => {
        if (coupon.type === 'percentage') {
            return total + (this.pricing.subtotal * coupon.discount / 100);
        } else {
            return total + coupon.discount;
        }
    }, 0);

    this.pricing.total = this.pricing.subtotal + this.pricing.shipping + this.pricing.tax - this.pricing.discount;
    this.lastUpdated = new Date();

    return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(code, discount, type = 'percentage') {
    // Check if coupon already applied
    const existingCoupon = this.coupons.find(coupon => coupon.code === code);
    if (existingCoupon) {
        throw new Error('Coupon already applied');
    }

    this.coupons.push({
        code,
        discount,
        type,
        appliedAt: new Date()
    });

    return this.calculateTotals();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function(code) {
    this.coupons = this.coupons.filter(coupon => coupon.code !== code);
    return this.calculateTotals();
};

// Method to get cart summary
cartSchema.methods.getSummary = function() {
    return {
        itemCount: this.items.length,
        totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: this.pricing.subtotal,
        shipping: this.pricing.shipping,
        tax: this.pricing.tax,
        discount: this.pricing.discount,
        total: this.pricing.total,
        currency: this.pricing.currency,
        savedForLaterCount: this.savedForLater.length
    };
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
    let cart = await this.findOne({ user: userId });

    if (!cart) {
        cart = new this({ user: userId });
        await cart.save();
    }

    return cart;
};

// Static method to clean expired carts
cartSchema.statics.cleanExpiredCarts = function() {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

