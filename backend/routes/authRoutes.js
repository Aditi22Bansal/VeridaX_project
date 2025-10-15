const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/send-email-verification', authenticateToken, authController.sendEmailVerification);
router.post('/change-password', authenticateToken, authController.changePassword);
router.post('/skills', authenticateToken, authController.addSkill);
router.delete('/skills/:skillName', authenticateToken, authController.removeSkill);
router.post('/stats', authenticateToken, authController.updateStats);

module.exports = router;