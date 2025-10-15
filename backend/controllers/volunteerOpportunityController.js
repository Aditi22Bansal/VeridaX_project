const VolunteerOpportunity = require('../models/VolunteerOpportunity');
const User = require('../models/User');
const AIService = require('../services/aiService');

const volunteerOpportunityController = {
    // Create a new volunteer opportunity
    async createOpportunity(req, res) {
        try {
            const opportunityData = {
                ...req.body,
                organization: {
                    ...req.body.organization,
                    id: req.user._id
                }
            };

            const opportunity = new VolunteerOpportunity(opportunityData);
            await opportunity.save();

            res.status(201).json({
                message: 'Volunteer opportunity created successfully',
                opportunity: opportunity.toObject()
            });
        } catch (error) {
            console.error('Error creating opportunity:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            res.status(500).json({ message: 'Failed to create opportunity' });
        }
    },

    // Get all opportunities with filtering and pagination
    async getOpportunities(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                location,
                skills,
                duration,
                status = 'active',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const filter = { status, visibility: 'public' };

            // Apply filters
            if (category) filter.category = category;
            if (duration) filter['schedule.duration'] = duration;
            if (location) {
                filter.$or = [
                    { 'location.city': new RegExp(location, 'i') },
                    { 'location.country': new RegExp(location, 'i') }
                ];
            }
            if (skills) {
                const skillArray = skills.split(',');
                filter['skills.name'] = { $in: skillArray };
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const opportunities = await VolunteerOpportunity.find(filter)
                .populate('organization.id', 'name email')
                .sort(sortOptions)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const total = await VolunteerOpportunity.countDocuments(filter);

            res.json({
                opportunities,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            res.status(500).json({ message: 'Failed to fetch opportunities' });
        }
    },

    // Get opportunity by ID
    async getOpportunityById(req, res) {
        try {
            const opportunity = await VolunteerOpportunity.findById(req.params.id)
                .populate('organization.id', 'name email')
                .populate('applications.volunteer', 'name email skills')
                .populate('selectedVolunteers.volunteer', 'name email');

            if (!opportunity) {
                return res.status(404).json({ message: 'Opportunity not found' });
            }

            // Increment view count
            opportunity.stats.views += 1;
            await opportunity.save();

            res.json(opportunity);
        } catch (error) {
            console.error('Error fetching opportunity:', error);
            res.status(500).json({ message: 'Failed to fetch opportunity' });
        }
    },

    // Update opportunity
    async updateOpportunity(req, res) {
        try {
            const opportunity = await VolunteerOpportunity.findById(req.params.id);

            if (!opportunity) {
                return res.status(404).json({ message: 'Opportunity not found' });
            }

            // Check if user is the organization owner
            if (opportunity.organization.id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this opportunity' });
            }

            const updatedOpportunity = await VolunteerOpportunity.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            ).populate('organization.id', 'name email');

            res.json({
                message: 'Opportunity updated successfully',
                opportunity: updatedOpportunity
            });
        } catch (error) {
            console.error('Error updating opportunity:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            res.status(500).json({ message: 'Failed to update opportunity' });
        }
    },

    // Delete opportunity
    async deleteOpportunity(req, res) {
        try {
            const opportunity = await VolunteerOpportunity.findById(req.params.id);

            if (!opportunity) {
                return res.status(404).json({ message: 'Opportunity not found' });
            }

            // Check if user is the organization owner
            if (opportunity.organization.id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this opportunity' });
            }

            await VolunteerOpportunity.findByIdAndDelete(req.params.id);

            res.json({ message: 'Opportunity deleted successfully' });
        } catch (error) {
            console.error('Error deleting opportunity:', error);
            res.status(500).json({ message: 'Failed to delete opportunity' });
        }
    },

    // Apply to opportunity
    async applyToOpportunity(req, res) {
        try {
            const { message, availability, experience, motivation } = req.body;
            const opportunityId = req.params.id;
            const volunteerId = req.user._id;

            const opportunity = await VolunteerOpportunity.findById(opportunityId);

            if (!opportunity) {
                return res.status(404).json({ message: 'Opportunity not found' });
            }

            if (opportunity.status !== 'active') {
                return res.status(400).json({ message: 'Opportunity is not currently accepting applications' });
            }

            if (opportunity.isFull) {
                return res.status(400).json({ message: 'Opportunity is full' });
            }

            // Check if already applied
            const existingApplication = opportunity.applications.find(app =>
                app.volunteer.toString() === volunteerId.toString()
            );

            if (existingApplication) {
                return res.status(400).json({ message: 'You have already applied to this opportunity' });
            }

            await opportunity.addApplication(volunteerId, {
                message,
                availability,
                experience,
                motivation
            });

            res.json({ message: 'Application submitted successfully' });
        } catch (error) {
            console.error('Error applying to opportunity:', error);
            if (error.message === 'Application already exists') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to submit application' });
        }
    },

    // Get user's applications
    async getUserApplications(req, res) {
        try {
            const opportunities = await VolunteerOpportunity.find({
                'applications.volunteer': req.user._id
            })
            .populate('organization.id', 'name email')
            .select('title organization applications status');

            const applications = opportunities.map(opp => {
                const application = opp.applications.find(app =>
                    app.volunteer.toString() === req.user._id.toString()
                );
                return {
                    opportunity: {
                        id: opp._id,
                        title: opp.title,
                        organization: opp.organization
                    },
                    application: {
                        status: application.status,
                        appliedAt: application.appliedAt,
                        message: application.message
                    }
                };
            });

            res.json(applications);
        } catch (error) {
            console.error('Error fetching user applications:', error);
            res.status(500).json({ message: 'Failed to fetch applications' });
        }
    },

    // Update application status (for organization)
    async updateApplicationStatus(req, res) {
        try {
            const { volunteerId, status } = req.body;
            const opportunityId = req.params.id;

            const opportunity = await VolunteerOpportunity.findById(opportunityId);

            if (!opportunity) {
                return res.status(404).json({ message: 'Opportunity not found' });
            }

            // Check if user is the organization owner
            if (opportunity.organization.id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update applications' });
            }

            await opportunity.updateApplicationStatus(volunteerId, status);

            res.json({ message: 'Application status updated successfully' });
        } catch (error) {
            console.error('Error updating application status:', error);
            if (error.message === 'Application not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to update application status' });
        }
    },

    // Get AI-powered recommendations
    async getRecommendations(req, res) {
        try {
            const { limit = 10 } = req.query;
            const recommendations = await AIService.getPersonalizedRecommendations(
                req.user._id,
                parseInt(limit)
            );

            res.json({
                recommendations,
                generatedAt: new Date()
            });
        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({ message: 'Failed to get recommendations' });
        }
    },

    // Analyze skill gaps for an opportunity
    async analyzeSkillGaps(req, res) {
        try {
            const { opportunityId } = req.params;
            const analysis = await AIService.analyzeSkillGaps(req.user._id, opportunityId);

            res.json(analysis);
        } catch (error) {
            console.error('Error analyzing skill gaps:', error);
            if (error.message === 'User or opportunity not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to analyze skill gaps' });
        }
    },

    // Get trending skills
    async getTrendingSkills(req, res) {
        try {
            const { limit = 10 } = req.query;
            const skills = await AIService.getTrendingSkills(parseInt(limit));

            res.json({ skills });
        } catch (error) {
            console.error('Error getting trending skills:', error);
            res.status(500).json({ message: 'Failed to get trending skills' });
        }
    },

    // Predict impact of opportunity
    async predictImpact(req, res) {
        try {
            const { opportunityId } = req.params;
            const prediction = await AIService.predictImpact(opportunityId);

            res.json(prediction);
        } catch (error) {
            console.error('Error predicting impact:', error);
            if (error.message === 'Opportunity not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to predict impact' });
        }
    },

    // Search opportunities with AI
    async searchOpportunities(req, res) {
        try {
            const { query, skills, interests, location } = req.query;

            let filter = { status: 'active', visibility: 'public' };

            // Text search
            if (query) {
                filter.$or = [
                    { title: new RegExp(query, 'i') },
                    { description: new RegExp(query, 'i') },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ];
            }

            // Skills filter
            if (skills) {
                const skillArray = skills.split(',');
                filter['skills.name'] = { $in: skillArray };
            }

            // Location filter
            if (location) {
                filter.$or = [
                    { 'location.city': new RegExp(location, 'i') },
                    { 'location.country': new RegExp(location, 'i') }
                ];
            }

            const opportunities = await VolunteerOpportunity.find(filter)
                .populate('organization.id', 'name email')
                .limit(20);

            // If user is logged in, calculate match scores
            if (req.user) {
                const user = await User.findById(req.user._id);
                const opportunitiesWithScores = opportunities.map(opportunity => {
                    const skillAnalysis = AIService.calculateSkillMatch(
                        user.skills || [],
                        opportunity.skills
                    );
                    const interestScore = AIService.calculateInterestMatch(
                        user.interests || [],
                        opportunity
                    );

                    return {
                        ...opportunity.toObject(),
                        matchScore: Math.round(
                            skillAnalysis.matchPercentage * 0.7 + interestScore * 0.3
                        ),
                        skillAnalysis,
                        interestScore: Math.round(interestScore)
                    };
                });

                opportunitiesWithScores.sort((a, b) => b.matchScore - a.matchScore);
                return res.json({ opportunities: opportunitiesWithScores });
            }

            res.json({ opportunities });
        } catch (error) {
            console.error('Error searching opportunities:', error);
            res.status(500).json({ message: 'Failed to search opportunities' });
        }
    },

    // Get opportunities by organization
    async getOpportunitiesByOrganization(req, res) {
        try {
            const { organizationId } = req.params;
            const { status, page = 1, limit = 10 } = req.query;

            const filter = { 'organization.id': organizationId };
            if (status) filter.status = status;

            const opportunities = await VolunteerOpportunity.find(filter)
                .populate('organization.id', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await VolunteerOpportunity.countDocuments(filter);

            res.json({
                opportunities,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            console.error('Error fetching organization opportunities:', error);
            res.status(500).json({ message: 'Failed to fetch opportunities' });
        }
    },

    // Get statistics
    async getStatistics(req, res) {
        try {
            const stats = await VolunteerOpportunity.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOpportunities: { $sum: 1 },
                        activeOpportunities: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        totalApplications: { $sum: { $size: '$applications' } },
                        totalVolunteers: { $sum: '$currentVolunteers' },
                        avgRating: { $avg: '$stats.rating' }
                    }
                }
            ]);

            const categoryStats = await VolunteerOpportunity.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            res.json({
                overall: stats[0] || {
                    totalOpportunities: 0,
                    activeOpportunities: 0,
                    totalApplications: 0,
                    totalVolunteers: 0,
                    avgRating: 0
                },
                byCategory: categoryStats
            });
        } catch (error) {
            console.error('Error fetching statistics:', error);
            res.status(500).json({ message: 'Failed to fetch statistics' });
        }
    }
};

module.exports = volunteerOpportunityController;

