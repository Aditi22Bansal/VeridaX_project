const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        },
        productSnapshot: {
            name: String,
            description: String,
            images: [String],
            specifications: mongoose.Schema.Types.Mixed
        }
    }],
    pricing: {
        subtotal: {
            type: Number,
            required: true
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
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
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
        trackingNumber: String,
        carrier: String,
        estimatedDelivery: Date,
        actualDelivery: Date,
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending'
        }
    },
    payment: {
        method: {
            type: String,
            enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'crypto', 'wallet'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
            default: 'pending'
        },
        transactionId: String,
        gateway: String,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: Number,
        paymentDetails: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    timeline: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    notes: {
        customer: String,
        seller: String,
        internal: String
    },
    sustainability: {
        carbonOffset: {
            amount: Number,
            unit: String,
            offset: Boolean
        },
        ecoFriendlyShipping: Boolean,
        sustainablePackaging: Boolean,
        localSourcing: Boolean
    },
    refund: {
        requested: {
            type: Boolean,
            default: false
        },
        reason: String,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'processed'],
            default: 'pending'
        },
        requestedAt: Date,
        processedAt: Date,
        notes: String
    },
    reviews: {
        customer: {
            rating: Number,
            comment: String,
            createdAt: Date
        },
        seller: {
            rating: Number,
            comment: String,
            createdAt: Date
        }
    },
    analytics: {
        source: String, // organic, search, social, referral, etc.
        campaign: String,
        utm: {
            source: String,
            medium: String,
            campaign: String
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ seller: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Method to add timeline entry
orderSchema.methods.addTimelineEntry = function(status, note, updatedBy) {
    this.timeline.push({
        status,
        note,
        updatedBy,
        timestamp: new Date()
    });
    return this.save();
};

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
    this.status = newStatus;
    this.addTimelineEntry(newStatus, note, updatedBy);
    return this.save();
};

// Method to calculate total
orderSchema.methods.calculateTotal = function() {
    this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.pricing.total = this.pricing.subtotal + this.pricing.shipping + this.pricing.tax - this.pricing.discount;
    return this.save();
};

// Method to process refund
orderSchema.methods.processRefund = function(amount, reason, notes) {
    this.refund = {
        requested: true,
        reason,
        amount: amount || this.pricing.total,
        status: 'pending',
        requestedAt: new Date(),
        notes
    };
    return this.save();
};

// Method to add review
orderSchema.methods.addReview = function(type, rating, comment) {
    if (type === 'customer') {
        this.reviews.customer = {
            rating,
            comment,
            createdAt: new Date()
        };
    } else if (type === 'seller') {
        this.reviews.seller = {
            rating,
            comment,
            createdAt: new Date()
        };
    }
    return this.save();
};

// Static method to get orders by status
orderSchema.statics.getByStatus = function(status, userId = null) {
    const query = { status };
    if (userId) {
        query.$or = [
            { customer: userId },
            { seller: userId }
        ];
    }
    return this.find(query)
        .populate('customer', 'name email')
        .populate('seller', 'name email')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 });
};

// Static method to get sales analytics
orderSchema.statics.getSalesAnalytics = function(sellerId, startDate, endDate) {
    const matchStage = {
        seller: mongoose.Types.ObjectId(sellerId),
        status: { $in: ['delivered', 'completed'] }
    };

    if (startDate && endDate) {
        matchStage.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.total' },
                averageOrderValue: { $avg: '$pricing.total' },
                totalItems: { $sum: { $sum: '$items.quantity' } }
            }
        }
    ]);
};

// Static method to get customer analytics
orderSchema.statics.getCustomerAnalytics = function(customerId, startDate, endDate) {
    const matchStage = { customer: mongoose.Types.ObjectId(customerId) };

    if (startDate && endDate) {
        matchStage.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$pricing.total' },
                averageOrderValue: { $avg: '$pricing.total' },
                totalItems: { $sum: { $sum: '$items.quantity' } },
                categories: { $addToSet: '$items.product' }
            }
        }
    ]);
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

