const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getCampaignDonationStats,
  processRefund
} = require('../controllers/paymentController');

const router = express.Router();

// @route   POST /api/payments/create-intent
// @desc    Create payment intent for donation
// @access  Private
router.post('/create-intent', [
  auth,
  body('campaignId', 'Campaign ID is required').notEmpty(),
  body('amount', 'Amount is required and must be at least $0.50').isFloat({ min: 0.50 }),
  body('currency', 'Invalid currency').optional().isIn(['usd', 'eur', 'gbp', 'cad', 'aud']),
  body('isAnonymous', 'isAnonymous must be boolean').optional().isBoolean(),
  body('message', 'Message cannot exceed 500 characters').optional().isLength({ max: 500 })
], createPaymentIntent);

// @route   POST /api/payments/confirm
// @desc    Confirm payment and process donation
// @access  Private
router.post('/confirm', [
  auth,
  body('paymentIntentId', 'Payment intent ID is required').notEmpty()
], confirmPayment);

// @route   GET /api/payments/history
// @desc    Get payment history for user
// @access  Private
router.get('/history', auth, getPaymentHistory);

// @route   GET /api/payments/campaign/:id/stats
// @desc    Get campaign donation stats
// @access  Public
router.get('/campaign/:id/stats', getCampaignDonationStats);

// @route   POST /api/payments/:id/refund
// @desc    Process refund
// @access  Private (Admin or Campaign Creator)
router.post('/:id/refund', [
  auth,
  body('amount', 'Amount must be a positive number').optional().isFloat({ min: 0.01 }),
  body('reason', 'Reason cannot exceed 500 characters').optional().isLength({ max: 500 })
], processRefund);

module.exports = router;
