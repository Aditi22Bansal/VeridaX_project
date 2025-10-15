const express = require('express');
const router = express.Router();
const crowdfundingService = require('../services/crowdfundingService');
const { upload } = require('../middleware/multer');
const Campaign = require('../models/Campaign');

// Create a new campaign
router.post('/campaigns', upload.single('image'), async (req, res) => {
    try {
        const { title, description, goal, duration, organization, category } = req.body;
        const imageUrl = req.file ? `/uploads/campaigns/${req.file.filename}` : null;

        // Calculate deadline from duration
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + parseInt(duration));

        // Create campaign in database
        const campaign = new Campaign({
            title,
            organization: organization || 'Unknown Organization',
            description,
            goal: parseFloat(goal),
            raised: 0,
            deadline,
            category: category || 'General',
            image: imageUrl
        });

        const savedCampaign = await campaign.save();

        // Try to create on blockchain as well (optional)
        try {
            const blockchainResult = await crowdfundingService.createCampaign(
                title,
                description,
                goal,
                duration,
                imageUrl
            );
            console.log('Campaign also created on blockchain');
        } catch (blockchainError) {
            console.log('Campaign created in database only (blockchain unavailable):', blockchainError.message);
        }

        res.status(201).json(savedCampaign);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({
            error: 'Failed to create campaign',
            details: error.message
        });
    }
});

// Get all campaigns from the smart contract or database
router.get('/campaigns', async (req, res) => {
    try {
        console.log('Fetching campaigns...');

        // Try to get campaigns from blockchain first
        try {
            const count = await crowdfundingService.contract.campaignCount();
            console.log('Campaign count from blockchain:', count.toString());

            if (count.toString() === '0') {
                // If no campaigns on blockchain, try database
                const dbCampaigns = await Campaign.find({}).sort({ createdAt: -1 });
                return res.json(dbCampaigns);
            }

            const campaigns = [];
            for (let i = 1; i <= Number(count); i++) {
                try {
                    console.log(`Fetching details for campaign ${i}...`);
                    const details = await crowdfundingService.getCampaignDetails(i);
                    campaigns.push({ id: i, ...details });
                } catch (err) {
                    console.error(`Error fetching campaign ${i}:`, err);
                    // Continue with other campaigns even if one fails
                }
            }

            return res.json(campaigns);
        } catch (blockchainError) {
            console.log('Blockchain not available, falling back to database:', blockchainError.message);

            // Fallback to database
            const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
            return res.json(campaigns);
        }
    } catch (error) {
        console.error('Error in /campaigns route:', error);
        res.status(500).json({
            error: error.message,
            details: error.stack
        });
    }
});

// Contribute to a campaign
router.post('/campaigns/:id/contribute', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const txHash = await crowdfundingService.contribute(id, amount);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Withdraw funds from a completed campaign
router.post('/campaigns/:id/withdraw', async (req, res) => {
    try {
        const { id } = req.params;
        const txHash = await crowdfundingService.withdrawFunds(id);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get campaign details
router.get('/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const details = await crowdfundingService.getCampaignDetails(id);
        res.json({ success: true, details });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user's contribution to a campaign
router.get('/campaigns/:id/contribution/:address', async (req, res) => {
    try {
        const { id, address } = req.params;
        const contribution = await crowdfundingService.getContribution(id, address);
        res.json({ success: true, contribution });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a campaign (on-chain)
router.delete('/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tx = await crowdfundingService.contract.deleteCampaign(id);
        await tx.wait();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
