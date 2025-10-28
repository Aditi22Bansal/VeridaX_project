const Campaign = require('../models/Campaign');
const VolunteerRegistration = require('../models/VolunteerRegistration');

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private (Admin only)
const createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      imageURL,
      type,
      goalAmount,
      startDate,
      endDate,
      category,
      location
    } = req.body;

    const campaign = await Campaign.create({
      title,
      description,
      imageURL,
      type,
      goalAmount,
      startDate,
      endDate,
      category,
      location,
      createdBy: req.user._id
    });

    // Populate createdBy field
    await campaign.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        campaign
      }
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res) => {
  try {
    const {
      type,
      category,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Campaign.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        campaigns,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCampaigns: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Public
const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('volunteers', 'name email avatar')
      .populate({
        path: 'donations.volunteerId',
        select: 'name email'
      });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        campaign
      }
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private (Admin - Owner only)
const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is the creator
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own campaigns.'
      });
    }

    // Build whitelist of fields that can be updated
    const updatableFields = [
      'title',
      'description',
      'imageURL',
      'type',
      'goalAmount',
      'startDate',
      'endDate',
      'category',
      'location',
      'status'
    ];

    const updates = {};
    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    // Pre-validate dates so we can give a 400 instead of a generic 500
    if (updates.startDate || updates.endDate) {
      const nextStartDate = updates.startDate ? new Date(updates.startDate) : campaign.startDate;
      const nextEndDate = updates.endDate ? new Date(updates.endDate) : campaign.endDate;
      if (!(nextEndDate > nextStartDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Apply updates on the document and save so validators run with correct context
    Object.assign(campaign, updates);
    const saved = await campaign.save();
    const updatedCampaign = await saved.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: {
        campaign: updatedCampaign
      }
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Admin - Owner only)
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is the creator
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own campaigns.'
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    // Also delete related volunteer registrations
    await VolunteerRegistration.deleteMany({ campaignId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get campaigns created by user
// @route   GET /api/campaigns/my-campaigns
// @access  Private (Admin only)
const getMyCampaigns = async (req, res) => {
  try {
    console.log('Getting campaigns for user:', req.user._id);

    const campaigns = await Campaign.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Compute volunteerCount as unique donors (volunteers array ∪ donations.volunteerId)
    const campaignsWithCounts = campaigns.map((doc) => {
      const obj = doc.toObject();
      const uniqueIds = new Set();
      (obj.volunteers || []).forEach((v) => uniqueIds.add(v?.toString()))
      ;
      (obj.donations || []).forEach((d) => {
        if (d && d.volunteerId) uniqueIds.add(d.volunteerId.toString());
      });
      obj.volunteerCount = Array.from(uniqueIds).filter(Boolean).length;
      return obj;
    });

    console.log('Found campaigns:', campaigns.length);

    res.status(200).json({
      success: true,
      data: {
        campaigns: campaignsWithCounts
      }
    });
  } catch (error) {
    console.error('Get my campaigns error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Register volunteer for campaign
// @route   POST /api/campaigns/:id/volunteer
// @access  Private (Volunteer only)
const registerVolunteer = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const volunteerId = req.user._id;

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign is active
    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for inactive campaign'
      });
    }

    // Check if volunteer is already registered
    const existingRegistration = await VolunteerRegistration.findOne({
      campaignId,
      volunteerId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this campaign'
      });
    }

    // Create volunteer registration
    const registration = await VolunteerRegistration.create({
      campaignId,
      volunteerId
    });

    // Add volunteer to campaign
    await campaign.addVolunteer(volunteerId);

    res.status(201).json({
      success: true,
      message: 'Successfully registered as volunteer',
      data: {
        registration
      }
    });
  } catch (error) {
    console.error('Register volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Make donation to campaign
// @route   POST /api/campaigns/:id/donate
// @access  Private
const makeDonation = async (req, res) => {
  try {
    const { amount } = req.body;
    const campaignId = req.params.id;
    const volunteerId = req.user._id;

    // Ensure amount is a number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation amount'
      });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign accepts donations
    if (campaign.type !== 'crowdfunding') {
      return res.status(400).json({
        success: false,
        message: 'This campaign does not accept donations'
      });
    }

    // Check if campaign is active
    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot donate to inactive campaign'
      });
    }

    // Add donation to campaign
    await campaign.addDonation(volunteerId, numericAmount);

    res.status(200).json({
      success: true,
      message: 'Donation made successfully',
      data: {
        amount: numericAmount,
        newRaisedAmount: campaign.raisedAmount
      }
    });
  } catch (error) {
    console.error('Make donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get volunteers for campaign
// @route   GET /api/campaigns/:id/volunteers
// @access  Private (Admin - Owner only)
const getCampaignVolunteers = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is the creator
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view volunteers for your own campaigns.'
      });
    }

    const volunteers = await VolunteerRegistration.find({ campaignId: req.params.id })
      .populate('volunteerId', 'name email avatar')
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        volunteers
      }
    });
  } catch (error) {
    console.error('Get campaign volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getMyCampaigns,
  registerVolunteer,
  makeDonation,
  getCampaignVolunteers
};
