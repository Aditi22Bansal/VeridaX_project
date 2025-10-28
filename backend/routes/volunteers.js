const express = require("express");
const router = express.Router();
const {
  getVolunteerProfile,
  updateVolunteerProfile,
  getVolunteerOpportunities,
  getVolunteerOpportunity,
  applyForOpportunity,
  getVolunteerApplications,
  getVolunteerApplication,
  withdrawApplication,
  logVolunteerHours,
  getVolunteerImpact,
  getRecommendations,
  getVolunteerBadges,
  getTrendingData,
} = require("../controllers/volunteerController");

const { protect } = require("../middleware/auth");
const { validateApplication } = require("../middleware/validation");

// Public routes
router.get("/trending", getTrendingData);

// Protected routes - require authentication
router.use(protect);

// Volunteer profile routes
router.route("/profile").get(getVolunteerProfile).put(updateVolunteerProfile);

// Volunteer opportunities routes
router.get("/opportunities", getVolunteerOpportunities);
router.get("/opportunities/:id", getVolunteerOpportunity);
router.post(
  "/opportunities/:id/apply",
  validateApplication,
  applyForOpportunity,
);

// Volunteer applications routes
router.get("/applications", getVolunteerApplications);
router.get("/applications/:id", getVolunteerApplication);
router.delete("/applications/:id", withdrawApplication);

// Impact tracking routes
router.post("/log-hours", logVolunteerHours);
router.get("/impact", getVolunteerImpact);

// AI recommendations and badges
router.get("/recommendations", getRecommendations);
router.get("/badges", getVolunteerBadges);

module.exports = router;
