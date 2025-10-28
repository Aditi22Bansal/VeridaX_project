const Campaign = require("../models/Campaign");
const VolunteerRegistration = require("../models/VolunteerRegistration");
const Notification = require("../models/Notification");

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
      location,
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
      createdBy: req.user._id,
    });

    // Populate createdBy field
    await campaign.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: {
        campaign,
      },
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const campaigns = await Campaign.find(filter)
      .populate("createdBy", "name email")
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
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Public
const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("volunteers", "name email avatar")
      .populate({
        path: "donations.volunteerId",
        select: "name email",
      });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        campaign,
      },
    });
  } catch (error) {
    console.error("Get campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
        message: "Campaign not found",
      });
    }

    // Check if user is the creator
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own campaigns.",
      });
    }

    // Build whitelist of fields that can be updated
    const updatableFields = [
      "title",
      "description",
      "imageURL",
      "type",
      "goalAmount",
      "startDate",
      "endDate",
      "category",
      "location",
      "status",
    ];

    const updates = {};
    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    // Pre-validate dates so we can give a 400 instead of a generic 500
    if (updates.startDate || updates.endDate) {
      const nextStartDate = updates.startDate
        ? new Date(updates.startDate)
        : campaign.startDate;
      const nextEndDate = updates.endDate
        ? new Date(updates.endDate)
        : campaign.endDate;
      if (!(nextEndDate > nextStartDate)) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        });
      }
    }

    // Apply updates on the document and save so validators run with correct context
    Object.assign(campaign, updates);
    const saved = await campaign.save();
    const updatedCampaign = await saved.populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: {
        campaign: updatedCampaign,
      },
    });
  } catch (error) {
    console.error("Update campaign error:", error);
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || "Internal server error",
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
        message: "Campaign not found",
      });
    }

    // Check if user is the creator
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own campaigns.",
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    // Also delete related volunteer registrations
    await VolunteerRegistration.deleteMany({ campaignId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get campaigns created by user
// @route   GET /api/campaigns/my-campaigns
// @access  Private (Admin only)
const getMyCampaigns = async (req, res) => {
  try {
    console.log("Getting campaigns for user:", req.user._id);

    const campaigns = await Campaign.find({ createdBy: req.user._id })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Compute volunteerCount as unique donors (volunteers array ∪ donations.volunteerId)
    const campaignsWithCounts = campaigns.map((doc) => {
      const obj = doc.toObject();
      const uniqueIds = new Set();
      (obj.volunteers || []).forEach((v) => uniqueIds.add(v?.toString()));
      (obj.donations || []).forEach((d) => {
        if (d && d.volunteerId) uniqueIds.add(d.volunteerId.toString());
      });
      obj.volunteerCount = Array.from(uniqueIds).filter(Boolean).length;
      return obj;
    });

    console.log("Found campaigns:", campaigns.length);

    res.status(200).json({
      success: true,
      data: {
        campaigns: campaignsWithCounts,
      },
    });
  } catch (error) {
    console.error("Get my campaigns error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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
    const { motivation, availability, experience } = req.body;

    console.log("=== VOLUNTEER APPLICATION RECEIVED ===");
    console.log("Campaign ID:", campaignId);
    console.log("Volunteer ID:", volunteerId);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Extracted data:", { motivation, availability, experience });

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check if campaign is active
    if (campaign.status !== "active") {
      console.log("Campaign status check failed:", campaign.status);
      return res.status(400).json({
        success: false,
        message: "Cannot register for inactive campaign",
        debug: { campaignStatus: campaign.status },
      });
    }

    // Check if volunteer is already registered
    const existingRegistration = await VolunteerRegistration.findOne({
      campaignId,
      volunteerId,
    });

    if (existingRegistration) {
      console.log("Volunteer already registered:", existingRegistration._id);
      return res.status(400).json({
        success: false,
        message: "You are already registered for this campaign",
        debug: { existingRegistrationId: existingRegistration._id },
      });
    }

    // Log the application data being saved
    console.log("Creating volunteer registration with data:", {
      campaignId,
      volunteerId,
      motivation: motivation || "",
      availability: {
        hoursPerWeek: availability?.hoursPerWeek || 5,
        startDate: availability?.startDate || new Date(),
      },
      experience: {
        relevantExperience: experience?.relevantExperience || "",
        skills: experience?.skills || [],
      },
    });

    // Validate and prepare registration data
    const registrationData = {
      campaignId,
      volunteerId,
      motivation: motivation || "",
      availability: {
        hoursPerWeek: availability?.hoursPerWeek || 5,
        startDate: availability?.startDate
          ? new Date(availability.startDate)
          : new Date(),
      },
      experience: {
        relevantExperience: experience?.relevantExperience || "",
        skills: experience?.skills || [],
      },
    };

    console.log(
      "Final registration data:",
      JSON.stringify(registrationData, null, 2),
    );

    // Create volunteer registration with detailed application data
    const registration = await VolunteerRegistration.create(registrationData);

    console.log("Successfully created registration:", registration._id);

    // Add volunteer to campaign
    await campaign.addVolunteer(volunteerId);

    // Send notification to campaign creator about new volunteer application
    try {
      await Notification.createVolunteerApplicationReceived(
        campaign.createdBy,
        campaign._id,
        campaign.title,
        req.user.name,
      );
      console.log("Sent application notification to campaign creator");
    } catch (notificationError) {
      console.error(
        "Failed to send application notification:",
        notificationError,
      );
      // Don't fail the main operation if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Successfully registered as volunteer",
      data: {
        registration,
      },
    });
  } catch (error) {
    console.error("Register volunteer error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });

    // Handle specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error: " + error.message,
        errors: error.errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        debug: { error: error.message },
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      debug:
        process.env.NODE_ENV === "development" ? { stack: error.stack } : {},
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
        message: "Invalid donation amount",
      });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check if campaign accepts donations
    if (campaign.type !== "crowdfunding") {
      return res.status(400).json({
        success: false,
        message: "This campaign does not accept donations",
      });
    }

    // Check if campaign is active
    if (campaign.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot donate to inactive campaign",
      });
    }

    // Add donation to campaign
    await campaign.addDonation(volunteerId, numericAmount);

    res.status(200).json({
      success: true,
      message: "Donation made successfully",
      data: {
        amount: numericAmount,
        newRaisedAmount: campaign.raisedAmount,
      },
    });
  } catch (error) {
    console.error("Make donation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
        message: "Campaign not found",
      });
    }

    // Check if user is the creator
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view volunteers for your own campaigns.",
      });
    }

    const volunteers = await VolunteerRegistration.find({
      campaignId: req.params.id,
    })
      .populate("volunteerId", "name email avatar")
      .populate("review.reviewedBy", "name")
      .sort({ registeredAt: -1 })
      .lean();
    console.log("Found volunteers:", volunteers.length);
    if (volunteers.length > 0) {
      console.log(
        "Sample volunteer data:",
        JSON.stringify(volunteers[0], null, 2),
      );
      console.log("Volunteer keys:", Object.keys(volunteers[0]));
      console.log("Has motivation?", !!volunteers[0].motivation);
      console.log("Has availability?", !!volunteers[0].availability);
      console.log("Has experience?", !!volunteers[0].experience);

      // Add enhanced volunteer data with debug flags
      const enhancedVolunteers = volunteers.map((v) => ({
        ...v,
        isLegacyApplication: !v.motivation && !v.availability && !v.experience,
        hasDetailedData: !!(v.motivation || v.availability || v.experience),
      }));

      console.log(
        "Enhanced volunteers with debug flags:",
        enhancedVolunteers.length,
      );
    }

    // Add enhanced volunteer data with debug flags
    const enhancedVolunteers = volunteers.map((v) => ({
      ...v,
      isLegacyApplication: !v.motivation && !v.availability && !v.experience,
      hasDetailedData: !!(v.motivation || v.availability || v.experience),
    }));

    res.status(200).json({
      success: true,
      data: {
        volunteers: enhancedVolunteers,
      },
    });
  } catch (error) {
    console.error("Get campaign volunteers error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    Update volunteer status
// @route   PUT /api/campaigns/:id/volunteers/:volunteerId
// @access  Private (Admin - Owner only)
const updateVolunteerStatus = async (req, res) => {
  try {
    const { id: campaignId, volunteerId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "registered",
      "under-review",
      "approved",
      "rejected",
      "completed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    // Check if campaign exists and user is the creator
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only manage volunteers for your own campaigns.",
      });
    }

    // Update volunteer registration status
    const volunteerRegistration = await VolunteerRegistration.findByIdAndUpdate(
      volunteerId,
      { status },
      { new: true },
    ).populate("volunteerId", "name email");

    if (!volunteerRegistration) {
      return res.status(404).json({
        success: false,
        message: "Volunteer registration not found",
      });
    }

    console.log(
      `Updated volunteer ${volunteerRegistration.volunteerId.name} status to ${status}`,
    );

    // Send notification to volunteer based on status change
    try {
      if (status === "approved") {
        await Notification.createVolunteerApproved(
          volunteerRegistration.volunteerId._id,
          campaign._id,
          campaign.title,
        );
        console.log("Sent approval notification to volunteer");
      } else if (status === "rejected") {
        await Notification.createVolunteerRejected(
          volunteerRegistration.volunteerId._id,
          campaign._id,
          campaign.title,
        );
        console.log("Sent rejection notification to volunteer");
      }
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Volunteer ${status} successfully`,
      data: {
        volunteer: volunteerRegistration,
      },
    });
  } catch (error) {
    console.error("Update volunteer status error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
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
  getCampaignVolunteers,
  updateVolunteerStatus,
};
