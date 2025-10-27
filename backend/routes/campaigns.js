const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getMyCampaigns,
  registerVolunteer,
  makeDonation,
  getCampaignVolunteers
} = require('../controllers/campaignController');
const { authenticateToken, requireAdmin, requireVolunteer } = require('../middleware/auth');
const { validateCampaignCreation, validateDonation } = require('../middleware/validation');

// Public routes
router.get('/', getCampaigns);

// Protected routes - Admin only
router.post('/', authenticateToken, requireAdmin, validateCampaignCreation, createCampaign);
router.get('/my-campaigns', authenticateToken, requireAdmin, getMyCampaigns);

// Specific routes (must come after specific routes like /my-campaigns)
router.get('/:id', getCampaign);
router.put('/:id', authenticateToken, requireAdmin, updateCampaign);
router.delete('/:id', authenticateToken, requireAdmin, deleteCampaign);
router.get('/:id/volunteers', authenticateToken, requireAdmin, getCampaignVolunteers);

// Protected routes - Volunteer actions
router.post('/:id/volunteer', authenticateToken, requireVolunteer, registerVolunteer);
router.post('/:id/donate', authenticateToken, validateDonation, makeDonation);

module.exports = router;
