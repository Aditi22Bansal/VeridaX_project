const { body, validationResult } = require("express-validator");

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
      details: errors
        .array()
        .map((err) => `${err.path}: ${err.msg}`)
        .join(", "),
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .isIn(["admin", "volunteer", "seller"])
    .withMessage("Role must be either admin, volunteer, or seller"),
  handleValidationErrors,
];

// User login validation
const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Campaign creation validation
const validateCampaignCreation = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be between 20 and 2000 characters"),
  body("type")
    .isIn(["volunteering", "crowdfunding"])
    .withMessage("Type must be either volunteering or crowdfunding"),
  body("goalAmount")
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage("Goal amount must be a positive number"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate").isISO8601().withMessage("End date must be a valid date"),
  body("category")
    .optional()
    .isIn([
      "education",
      "healthcare",
      "environment",
      "community",
      "disaster-relief",
      "other",
    ])
    .withMessage("Invalid category"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot be more than 100 characters"),
  handleValidationErrors,
];

// Donation validation
const validateDonation = [
  body("amount")
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage("Donation amount must be at least $1"),
  handleValidationErrors,
];

// Volunteer profile validation
const validateVolunteerProfile = [
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("skills.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Skill name must be between 1 and 50 characters"),
  body("skills.*.level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage(
      "Skill level must be beginner, intermediate, advanced, or expert",
    ),
  body("interests")
    .optional()
    .isArray()
    .withMessage("Interests must be an array"),
  body("availability.hoursPerWeek")
    .optional()
    .isNumeric()
    .isInt({ min: 1, max: 168 })
    .withMessage("Hours per week must be between 1 and 168"),
  body("availability.preferredDays")
    .optional()
    .isArray()
    .withMessage("Preferred days must be an array"),
  body("location.pincode")
    .optional()
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be 6 digits"),
  handleValidationErrors,
];

// Volunteer application validation
const validateApplication = [
  body("motivation")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Motivation cannot exceed 1000 characters"),
  body("availability.hoursPerWeek")
    .optional()
    .isNumeric({ no_symbols: true })
    .isInt({ min: 1, max: 40 })
    .withMessage("Hours per week must be between 1 and 40"),
  body("availability.startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("experience.relevantExperience")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Relevant experience cannot exceed 1000 characters"),
  body("experience.skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),
  body("experience.skills.*.skill")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Each skill name must be between 1 and 100 characters"),
  body("experience.skills.*.level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage(
      "Skill level must be one of: beginner, intermediate, advanced, expert",
    ),
  handleValidationErrors,
];

// Hour logging validation
const validateHourLog = [
  body("campaignId")
    .notEmpty()
    .isMongoId()
    .withMessage("Valid campaign ID is required"),
  body("startTime").isISO8601().withMessage("Start time must be a valid date"),
  body("endTime").isISO8601().withMessage("End time must be a valid date"),
  body("activity")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Activity description must be between 3 and 200 characters"),
  body("breakDuration")
    .optional()
    .isNumeric()
    .isInt({ min: 0, max: 480 })
    .withMessage("Break duration must be between 0 and 480 minutes"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  handleValidationErrors,
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateCampaignCreation,
  validateDonation,
  validateVolunteerProfile,
  validateApplication,
  validateHourLog,
  handleValidationErrors,
};
