const Campaign = require("../models/Campaign");
const User = require("../models/User");
const VolunteerRegistration = require("../models/VolunteerRegistration");
const Notification = require("../models/Notification");

// @desc    Get volunteer profile
// @route   GET /api/volunteers/profile
// @access  Private
const getVolunteerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create basic profile from user data
    const profile = {
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      skills: user.skills || [],
      interests: user.interests || [],
      experience: user.experience || "beginner",
      statistics: {
        totalHours: 0,
        campaignsCompleted: 0,
        impactScore: 0,
        badges: [],
      },
    };

    res.status(200).json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    console.error("Get volunteer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Update volunteer profile
// @route   PUT /api/volunteers/profile
// @access  Private
const updateVolunteerProfile = async (req, res) => {
  try {
    const { skills, interests, experience } = req.body;

    const updateData = {};
    if (skills) updateData.skills = skills;
    if (interests) updateData.interests = interests;
    if (experience) updateData.experience = experience;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: {
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          skills: user.skills || [],
          interests: user.interests || [],
          experience: user.experience || "beginner",
        },
      },
    });
  } catch (error) {
    console.error("Update volunteer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get volunteer opportunities (campaigns)
// @route   GET /api/volunteers/opportunities
// @access  Private
const getVolunteerOpportunities = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, search } = req.query;

    // Build filter
    const filter = { status: "active" };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Campaign.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        opportunities: campaigns,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOpportunities: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get volunteer opportunities error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single volunteer opportunity (campaign)
// @route   GET /api/volunteers/opportunities/:id
// @access  Private
const getVolunteerOpportunity = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("createdBy", "name email avatar")
      .populate("volunteers", "name email avatar");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check if user already registered
    const isRegistered = campaign.volunteers.some(
      (volunteer) => volunteer._id.toString() === req.user._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: {
        opportunity: campaign,
        hasApplied: isRegistered,
        applicationStatus: isRegistered ? "registered" : null,
      },
    });
  } catch (error) {
    console.error("Get volunteer opportunity error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Apply for volunteer opportunity (register for campaign)
// @route   POST /api/volunteers/opportunities/:id/apply
// @access  Private
const applyForOpportunity = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const volunteerId = req.user._id;
    const { motivation, availability, experience } = req.body;

    console.log("=== VOLUNTEER OPPORTUNITY APPLICATION RECEIVED ===");
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
      return res.status(400).json({
        success: false,
        message: "Cannot register for inactive campaign",
      });
    }

    // Check if volunteer is already registered
    const existingRegistration = await VolunteerRegistration.findOne({
      campaignId,
      volunteerId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this campaign",
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

    // Create volunteer registration with detailed application data
    const registration = await VolunteerRegistration.create({
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
        application: {
          _id: registration._id,
          status: registration.status,
          submittedAt: registration.registeredAt,
        },
      },
    });
  } catch (error) {
    console.error("Apply for opportunity error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get volunteer applications
// @route   GET /api/volunteers/applications
// @access  Private
const getVolunteerApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { volunteerId: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await VolunteerRegistration.find(filter)
      .populate("campaignId", "title category imageURL description")
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VolunteerRegistration.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalApplications: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get volunteer applications error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single volunteer application
// @route   GET /api/volunteers/applications/:id
// @access  Private
const getVolunteerApplication = async (req, res) => {
  try {
    const application = await VolunteerRegistration.findOne({
      _id: req.params.id,
      volunteerId: req.user._id,
    }).populate("campaignId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Get volunteer application error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Withdraw volunteer application
// @route   DELETE /api/volunteers/applications/:id
// @access  Private
const withdrawApplication = async (req, res) => {
  try {
    const application = await VolunteerRegistration.findOne({
      _id: req.params.id,
      volunteerId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Remove from volunteer registration
    await VolunteerRegistration.findByIdAndDelete(req.params.id);

    // Remove from campaign volunteers list
    const campaign = await Campaign.findById(application.campaignId);
    if (campaign) {
      campaign.volunteers = campaign.volunteers.filter(
        (v) => v.toString() !== req.user._id.toString(),
      );
      await campaign.save();
    }

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    console.error("Withdraw application error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Log volunteer hours
// @route   POST /api/volunteers/log-hours
// @access  Private
const logVolunteerHours = async (req, res) => {
  try {
    const { campaignId, hours, activity, date } = req.body;
    const volunteerId = req.user._id;

    console.log("Logging hours:", {
      campaignId,
      hours,
      activity,
      date,
      volunteerId,
    });

    // Validate required fields
    if (!campaignId || !hours || !activity) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID, hours, and activity are required",
      });
    }

    // Validate hours
    const numericHours = parseFloat(hours);
    if (isNaN(numericHours) || numericHours <= 0 || numericHours > 24) {
      return res.status(400).json({
        success: false,
        message: "Hours must be a number between 0 and 24",
      });
    }

    // Find the volunteer registration
    const registration = await VolunteerRegistration.findOne({
      campaignId,
      volunteerId,
      status: "approved",
    }).populate("campaignId", "title createdBy");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "No approved volunteer registration found for this campaign",
      });
    }

    // Log hours using the registration method
    const logDate = date ? new Date(date) : new Date();
    await registration.logHours(logDate, numericHours, activity);

    console.log(
      "Hours logged successfully for registration:",
      registration._id,
    );

    // Send notification to campaign creator
    try {
      await Notification.createVolunteerHoursLogged(
        registration.campaignId.createdBy,
        registration.campaignId._id,
        registration.campaignId.title,
        numericHours,
      );
      console.log("Sent hours logged notification to campaign creator");
    } catch (notificationError) {
      console.error("Failed to send hours notification:", notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Hours logged successfully",
      data: {
        hoursLogged: numericHours,
        activity,
        totalHours: registration.volunteeringRecord.totalHours,
        date: logDate,
      },
    });
  } catch (error) {
    console.error("Log volunteer hours error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    Get volunteer impact records
// @route   GET /api/volunteers/impact
// @access  Private
const getVolunteerImpact = async (req, res) => {
  try {
    // For now, return mock data based on user's volunteer registrations
    const registrations = await VolunteerRegistration.find({
      volunteerId: req.user._id,
    }).populate("campaignId", "title category");

    const summary = {
      totalHours: registrations.length * 8, // Mock 8 hours per registration
      totalBeneficiaries: registrations.length * 5, // Mock 5 people per registration
      totalImpactPoints: registrations.length * 100, // Mock 100 points per registration
      verifiedRecords: Math.floor(registrations.length * 0.8), // Mock 80% verified
      recordsCount: registrations.length,
    };

    // Create mock impact records
    const impactRecords = registrations.map((reg, index) => ({
      _id: reg._id,
      campaignId: reg.campaignId,
      timeRecord: {
        hoursContributed: 8,
        startTime: new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() -
            (index + 1) * 7 * 24 * 60 * 60 * 1000 +
            8 * 60 * 60 * 1000,
        ),
      },
      impact: {
        description: `Volunteered for ${reg.campaignId.title}`,
        category: reg.campaignId.category,
        beneficiaries: { directCount: 5 },
      },
      scoring: { totalScore: 100 },
      verification: { status: index % 5 === 0 ? "pending" : "verified" },
      skillsUtilized: [],
      blockchain: { isRecorded: false },
      createdAt: reg.registeredAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        impactRecords,
        summary,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: impactRecords.length,
          hasNext: false,
          hasPrev: false,
        },
      },
    });
  } catch (error) {
    console.error("Get volunteer impact error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get AI-powered recommendations
// @route   GET /api/volunteers/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get active campaigns that user hasn't joined yet
    const userRegistrations = await VolunteerRegistration.find({
      volunteerId: req.user._id,
    });
    const joinedCampaignIds = userRegistrations.map((reg) => reg.campaignId);

    const campaigns = await Campaign.find({
      status: "active",
      _id: { $nin: joinedCampaignIds },
    })
      .populate("createdBy", "name email")
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Add mock AI scoring
    const recommendations = campaigns.map((campaign, index) => ({
      campaign,
      opportunities: [],
      matchScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      matchBreakdown: {
        skills: { score: Math.floor(Math.random() * 30) + 70 },
        location: { score: Math.floor(Math.random() * 30) + 70 },
        availability: { score: Math.floor(Math.random() * 30) + 70 },
        experience: { score: Math.floor(Math.random() * 30) + 70 },
        interest: { score: Math.floor(Math.random() * 30) + 70 },
      },
      recommendationReason: `This ${campaign.category} campaign matches your interests and skills.`,
      priority: index < 2 ? "high" : index < 5 ? "medium" : "low",
      estimatedHours: Math.floor(Math.random() * 20) + 10,
      skillGains: ["Leadership", "Communication", "Project Management"].slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      ),
    }));

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        totalFound: recommendations.length,
        volunteerProfile: null,
        matchingCriteria: {
          skillWeight: 0.3,
          locationWeight: 0.2,
          availabilityWeight: 0.25,
          experienceWeight: 0.15,
          interestWeight: 0.1,
        },
      },
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
    });
  }
};

// @desc    Get volunteer badges and achievements
// @route   GET /api/volunteers/badges
// @access  Private
const getVolunteerBadges = async (req, res) => {
  try {
    const registrations = await VolunteerRegistration.find({
      volunteerId: req.user._id,
    });

    // Create mock badges based on volunteer activity
    const badges = [];

    if (registrations.length >= 1) {
      badges.push({
        _id: "first-volunteer",
        name: "First Steps",
        description: "Joined your first campaign",
        category: "campaigns",
        rarity: "common",
        earnedAt: registrations[0].registeredAt,
      });
    }

    if (registrations.length >= 3) {
      badges.push({
        _id: "active-volunteer",
        name: "Active Volunteer",
        description: "Joined 3+ campaigns",
        category: "campaigns",
        rarity: "uncommon",
        earnedAt: registrations[2].registeredAt,
      });
    }

    if (registrations.length >= 5) {
      badges.push({
        _id: "community-champion",
        name: "Community Champion",
        description: "Joined 5+ campaigns",
        category: "community",
        rarity: "rare",
        earnedAt: registrations[4].registeredAt,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        badges,
        totalBadges: badges.length,
        categories: [...new Set(badges.map((b) => b.category))],
        recentBadges: badges.slice(-3),
      },
    });
  } catch (error) {
    console.error("Get volunteer badges error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get trending skills and categories
// @route   GET /api/volunteers/trending
// @access  Public
const getTrendingData = async (req, res) => {
  try {
    // Mock trending data
    const trendingData = {
      skills: [
        { skill: "Teaching", demand: 15 },
        { skill: "Marketing", demand: 12 },
        { skill: "Web Design", demand: 10 },
        { skill: "Photography", demand: 8 },
        { skill: "Event Planning", demand: 7 },
      ],
      categories: [
        { category: "education", campaigns: 25 },
        { category: "community", campaigns: 20 },
        { category: "healthcare", campaigns: 15 },
        { category: "environment", campaigns: 12 },
        { category: "disaster-relief", campaigns: 8 },
      ],
      updatedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: trendingData,
    });
  } catch (error) {
    console.error("Get trending data error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
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
};
