const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../middleware/validation');

// Public routes
router.post('/signup', validateUserRegistration, signup);
router.post('/login', validateUserLogin, login);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
