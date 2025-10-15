const express = require('express');
const router = express.Router();
const volunteerOpportunityController = require('../controllers/volunteerOpportunityController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', volunteerOpportunityController.getOpportunities);
router.get('/search', volunteerOpportunityController.searchOpportunities);
router.get('/trending-skills', volunteerOpportunityController.getTrendingSkills);
router.get('/statistics', volunteerOpportunityController.getStatistics);
router.get('/organization/:organizationId', volunteerOpportunityController.getOpportunitiesByOrganization);
router.get('/:id', volunteerOpportunityController.getOpportunityById);

// Protected routes
router.post('/', authenticateToken, volunteerOpportunityController.createOpportunity);
router.put('/:id', authenticateToken, volunteerOpportunityController.updateOpportunity);
router.delete('/:id', authenticateToken, volunteerOpportunityController.deleteOpportunity);

// Application routes
router.post('/:id/apply', authenticateToken, volunteerOpportunityController.applyToOpportunity);
router.get('/applications/my', authenticateToken, volunteerOpportunityController.getUserApplications);
router.put('/:id/applications/:volunteerId', authenticateToken, volunteerOpportunityController.updateApplicationStatus);

// AI-powered routes
router.get('/recommendations/personalized', authenticateToken, volunteerOpportunityController.getRecommendations);
router.get('/:opportunityId/skill-gaps', authenticateToken, volunteerOpportunityController.analyzeSkillGaps);
router.get('/:opportunityId/impact-prediction', volunteerOpportunityController.predictImpact);

module.exports = router;

