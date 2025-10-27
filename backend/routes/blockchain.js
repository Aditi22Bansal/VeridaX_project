const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

// Initialize blockchain service
blockchainService.initialize().catch(console.error);

// @route   POST /api/blockchain/campaigns
// @desc    Create a new campaign on blockchain
// @access  Private
router.post('/campaigns', auth, async (req, res) => {
  try {
    const { title, description, goal, deadline } = req.body;
    
    if (!title || !description || !goal || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, goal, and deadline are required'
      });
    }

    // Convert deadline to timestamp
    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    
    const result = await blockchainService.createCampaign(
      title,
      description,
      goal,
      deadlineTimestamp
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Campaign created successfully on blockchain',
        campaignId: result.campaignId,
        transactionHash: result.transactionHash
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign on blockchain',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating campaign'
    });
  }
});

// @route   POST /api/blockchain/donate
// @desc    Donate to a campaign
// @access  Private
router.post('/donate', auth, async (req, res) => {
  try {
    const { campaignId, amount } = req.body;
    
    if (!campaignId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Donation amount must be greater than 0'
      });
    }

    const result = await blockchainService.donate(campaignId, amount);

    if (result.success) {
      res.json({
        success: true,
        message: 'Donation successful',
        transactionHash: result.transactionHash
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process donation',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing donation'
    });
  }
});

// @route   POST /api/blockchain/withdraw
// @desc    Withdraw funds from completed campaign
// @access  Private
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    const result = await blockchainService.withdrawFunds(campaignId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Funds withdrawn successfully',
        transactionHash: result.transactionHash
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw funds',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while withdrawing funds'
    });
  }
});

// @route   GET /api/blockchain/campaigns/:id
// @desc    Get campaign details from blockchain
// @access  Private
router.get('/campaigns/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await blockchainService.getCampaign(id);

    if (result.success) {
      res.json({
        success: true,
        campaign: result.campaign
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Campaign not found on blockchain',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching campaign'
    });
  }
});

// @route   GET /api/blockchain/campaigns/:id/donations
// @desc    Get donations for a campaign
// @access  Private
router.get('/campaigns/:id/donations', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await blockchainService.getDonations(id);

    if (result.success) {
      res.json({
        success: true,
        donations: result.donations
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Failed to fetch donations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching donations'
    });
  }
});

// @route   GET /api/blockchain/campaigns
// @desc    Get all campaigns count
// @access  Private
router.get('/campaigns', auth, async (req, res) => {
  try {
    const result = await blockchainService.getCampaignCount();

    if (result.success) {
      res.json({
        success: true,
        count: result.count
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get campaign count',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get campaign count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching campaign count'
    });
  }
});

// @route   GET /api/blockchain/user/campaigns
// @desc    Get user's campaigns
// @access  Private
router.get('/user/campaigns', auth, async (req, res) => {
  try {
    const userAddress = req.user.blockchainAddress || req.user.email; // Fallback to email if no blockchain address
    
    const result = await blockchainService.getUserCampaigns(userAddress);

    if (result.success) {
      res.json({
        success: true,
        campaigns: result.campaigns
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get user campaigns',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get user campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user campaigns'
    });
  }
});

// @route   GET /api/blockchain/user/donations
// @desc    Get user's donations
// @access  Private
router.get('/user/donations', auth, async (req, res) => {
  try {
    const userAddress = req.user.blockchainAddress || req.user.email; // Fallback to email if no blockchain address
    
    const result = await blockchainService.getUserDonations(userAddress);

    if (result.success) {
      res.json({
        success: true,
        donations: result.donations
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get user donations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user donations'
    });
  }
});

// @route   GET /api/blockchain/campaigns/:id/status
// @desc    Check if campaign is completed
// @access  Private
router.get('/campaigns/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await blockchainService.isCampaignCompleted(id);

    if (result.success) {
      res.json({
        success: true,
        isCompleted: result.isCompleted
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to check campaign status',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Check campaign status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking campaign status'
    });
  }
});

module.exports = router;

