const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'volunteer', 'seller'])
    .withMessage('Role must be either admin, volunteer, or seller'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Campaign creation validation
const validateCampaignCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('type')
    .isIn(['volunteering', 'crowdfunding'])
    .withMessage('Type must be either volunteering or crowdfunding'),
  body('goalAmount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Goal amount must be a positive number'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('category')
    .optional()
    .isIn(['education', 'healthcare', 'environment', 'community', 'disaster-relief', 'other'])
    .withMessage('Invalid category'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot be more than 100 characters'),
  handleValidationErrors
];

// Donation validation
const validateDonation = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Donation amount must be at least $1'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateCampaignCreation,
  validateDonation,
  handleValidationErrors
};
