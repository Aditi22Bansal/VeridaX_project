const Payment = require('../models/Payment');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const paymentService = require('../services/paymentService');

// @desc    Get donors for a campaign (creator-only)
// @route   GET /api/payments/campaign/:id/donors
// @access  Private (Campaign Creator only)
const getCampaignDonors = async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Validate campaign and ownership
    const campaign = await Campaign.findById(campaignId).select('createdBy title donations').populate('donations.volunteerId', 'name email');
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the campaign creator can view donors.'
      });
    }

    // Fetch succeeded payments for the campaign
    const payments = await Payment.find({
      campaignId,
      status: 'succeeded'
    })
      .populate('donorId', 'name email')
      .select('amount donorName donorId isAnonymous message createdAt');

    // Build unified donation items list
    let donationItems;
    if (payments && payments.length > 0) {
      donationItems = payments.map((p) => ({
        donorId: p.isAnonymous ? null : p.donorId?._id?.toString() || null,
        donorName: p.isAnonymous ? 'Anonymous' : (p.donorId?.name || p.donorName || 'Donor'),
        donorEmail: p.isAnonymous ? undefined : (p.donorId?.email || undefined),
        isAnonymous: !!p.isAnonymous,
        amount: p.amount,
        message: p.message || '',
        createdAt: p.createdAt
      }));
    } else {
      const donationEntries = Array.isArray(campaign.donations) ? campaign.donations : [];
      donationItems = donationEntries.map((d) => ({
        donorId: d.volunteerId?._id?.toString() || null,
        donorName: d.volunteerId?.name || 'Donor',
        donorEmail: d.volunteerId?.email || undefined,
        isAnonymous: false,
        amount: d.amount,
        message: '',
        createdAt: d.donatedAt || campaign.createdAt
      }));
    }

    // Aggregate by donor (id when present, else donorName for anonymous)
    const donorMap = new Map();
    for (const item of donationItems) {
      const key = item.donorId ? `id:${item.donorId}` : `anon:${item.donorName}`;
      if (!donorMap.has(key)) {
        donorMap.set(key, {
          key,
          isAnonymous: item.isAnonymous,
          donor: item.isAnonymous
            ? { name: 'Anonymous' }
            : { id: item.donorId, name: item.donorName, email: item.donorEmail },
          totalAmount: 0,
          donations: []
        });
      }
      const entry = donorMap.get(key);
      entry.totalAmount += item.amount;
      entry.donations.push({ amount: item.amount, message: item.message, createdAt: item.createdAt });
    }

    // Final donors array
    const donors = Array.from(donorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    // Sort newest first
    donors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: {
        campaign: {
          id: campaignId,
          title: campaign.title
        },
        donors
      }
    });
  } catch (error) {
    console.error('Get campaign donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Create payment intent for donation
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const { campaignId, amount, currency = 'usd', isAnonymous = false, message = '' } = req.body;

    // Validate input
    if (!campaignId || !amount || amount < 0.50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID or amount. Minimum donation is $0.50'
      });
    }

    // Check if campaign exists and is active
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.type !== 'crowdfunding') {
      return res.status(400).json({
        success: false,
        message: 'This campaign does not accept donations'
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot donate to inactive campaign'
      });
    }

    // Get donor information
    const donor = await User.findById(req.user._id).select('name email');
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create payment intent with Stripe
    const paymentResult = await paymentService.createPaymentIntent(
      amount,
      currency,
      {
        campaignId: campaignId.toString(),
        donorId: req.user._id.toString(),
        campaignTitle: campaign.title,
        donorName: isAnonymous ? 'Anonymous' : donor.name,
        donorEmail: donor.email
      }
    );

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment intent',
        error: paymentResult.error
      });
    }

    // Create payment record in database
    const payment = new Payment({
      campaignId,
      donorId: req.user._id,
      amount,
      currency,
      stripePaymentIntentId: paymentResult.paymentIntentId,
      donorEmail: donor.email,
      donorName: isAnonymous ? 'Anonymous' : donor.name,
      isAnonymous,
      message: message.trim(),
      status: 'pending'
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.paymentIntentId,
        amount,
        currency
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Confirm payment and process donation
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      donorId: req.user._id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Confirm payment with Stripe
    const confirmResult = await paymentService.confirmPaymentIntent(paymentIntentId);

    if (!confirmResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment confirmation failed',
        error: confirmResult.error
      });
    }

    if (confirmResult.status === 'succeeded') {
      // Update payment status
      payment.status = 'succeeded';
      payment.stripeChargeId = confirmResult.paymentIntent.latest_charge;
      await payment.save();

      // Add donation to campaign
      await payment.campaignId.addDonation(payment.donorId, payment.amount);

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          paymentId: payment._id,
          amount: payment.amount,
          campaignId: payment.campaignId
        }
      });
    } else if (confirmResult.status === 'requires_action') {
      res.status(200).json({
        success: true,
        message: 'Payment requires additional action',
        data: {
          requiresAction: true,
          clientSecret: confirmResult.paymentIntent.client_secret
        }
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Payment failed',
        error: confirmResult.error
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get payment history for user
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { donorId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .populate('campaignId', 'title imageURL type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayments: total,
          hasNext: skip + payments.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get campaign donation stats
// @route   GET /api/payments/campaign/:id/stats
// @access  Public
const getCampaignDonationStats = async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get donation stats
    const stats = await Payment.getCampaignStats(campaignId);

    // Get recent donations
    const recentDonations = await Payment.find({
      campaignId,
      status: 'succeeded'
    })
      .populate('donorId', 'name')
      .select('amount donorName isAnonymous message createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          title: campaign.title,
          goalAmount: campaign.goalAmount,
          raisedAmount: campaign.raisedAmount
        },
        stats: {
          totalAmount: stats.totalAmount,
          totalDonations: stats.totalDonations,
          averageDonation: stats.averageDonation,
          refundedAmount: stats.refundedAmount,
          netAmount: stats.totalAmount - stats.refundedAmount
        },
        recentDonations
      }
    });
  } catch (error) {
    console.error('Get campaign donation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Process refund
// @route   POST /api/payments/:id/refund
// @access  Private (Admin only)
const processRefund = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const paymentId = req.params.id;

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user is admin or campaign creator
    const campaign = await Campaign.findById(payment.campaignId);
    if (req.user.role !== 'admin' && campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process refunds for this payment'
      });
    }

    // Process refund with Stripe
    const refundResult = await paymentService.createRefund(
      payment.stripeChargeId,
      amount || payment.amount,
      reason || 'requested_by_customer'
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Refund failed',
        error: refundResult.error
      });
    }

    // Update payment record
    await payment.processRefund(amount || payment.amount, reason);

    // Update campaign raised amount
    const refundAmount = amount || payment.amount;
    campaign.raisedAmount = Math.max(0, campaign.raisedAmount - refundAmount);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundResult.refund.id,
        amount: refundAmount,
        newRaisedAmount: campaign.raisedAmount
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getCampaignDonationStats,
  processRefund,
  getCampaignDonors
};
