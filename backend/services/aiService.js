const VolunteerOpportunity = require('../models/VolunteerOpportunity');
const User = require('../models/User');

class AIService {
    /**
     * Calculate skill match score between user and opportunity
     * @param {Array} userSkills - User's skills
     * @param {Array} opportunitySkills - Opportunity's required skills
     * @returns {Object} Match analysis
     */
    static calculateSkillMatch(userSkills, opportunitySkills) {
        const analysis = {
            totalScore: 0,
            maxScore: 0,
            matches: [],
            missing: [],
            recommendations: []
        };

        opportunitySkills.forEach(oppSkill => {
            const userSkill = userSkills.find(skill =>
                skill.name.toLowerCase() === oppSkill.name.toLowerCase()
            );

            const weight = oppSkill.required ? 2 : 1;
            analysis.maxScore += weight;

            if (userSkill) {
                const levelScore = this.getLevelMatchScore(userSkill.level, oppSkill.level);
                const skillScore = levelScore * weight;

                analysis.totalScore += skillScore;
                analysis.matches.push({
                    skill: oppSkill.name,
                    userLevel: userSkill.level,
                    requiredLevel: oppSkill.level,
                    score: levelScore,
                    weight: weight,
                    isRequired: oppSkill.required
                });

                if (levelScore < 0.8 && oppSkill.required) {
                    analysis.recommendations.push({
                        type: 'skill_improvement',
                        skill: oppSkill.name,
                        currentLevel: userSkill.level,
                        targetLevel: oppSkill.level,
                        message: `Improve your ${oppSkill.name} skills from ${userSkill.level} to ${oppSkill.level}`
                    });
                }
            } else {
                analysis.missing.push({
                    skill: oppSkill.name,
                    level: oppSkill.level,
                    isRequired: oppSkill.required
                });

                if (oppSkill.required) {
                    analysis.recommendations.push({
                        type: 'skill_learning',
                        skill: oppSkill.name,
                        level: oppSkill.level,
                        message: `Learn ${oppSkill.name} at ${oppSkill.level} level`
                    });
                }
            }
        });

        analysis.matchPercentage = analysis.maxScore > 0 ? (analysis.totalScore / analysis.maxScore) * 100 : 0;
        return analysis;
    }

    /**
     * Get level match score between user and required level
     * @param {String} userLevel - User's skill level
     * @param {String} requiredLevel - Required skill level
     * @returns {Number} Score between 0 and 1
     */
    static getLevelMatchScore(userLevel, requiredLevel) {
        const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const userIndex = levels.indexOf(userLevel);
        const requiredIndex = levels.indexOf(requiredLevel);

        if (userIndex >= requiredIndex) {
            return 1; // Perfect match or overqualified
        } else if (userIndex === requiredIndex - 1) {
            return 0.7; // Close match
        } else if (userIndex === requiredIndex - 2) {
            return 0.4; // Partial match
        } else {
            return 0.1; // Poor match
        }
    }

    /**
     * Generate personalized recommendations for a user
     * @param {String} userId - User ID
     * @param {Number} limit - Number of recommendations
     * @returns {Array} Recommended opportunities
     */
    static async getPersonalizedRecommendations(userId, limit = 10) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const opportunities = await VolunteerOpportunity.find({
                status: 'active',
                visibility: 'public'
            }).populate('organization.id', 'name email');

            const recommendations = [];

            for (const opportunity of opportunities) {
                const skillAnalysis = this.calculateSkillMatch(user.skills || [], opportunity.skills);
                const interestScore = this.calculateInterestMatch(user.interests || [], opportunity);
                const locationScore = this.calculateLocationMatch(user.location, opportunity.location);
                const scheduleScore = this.calculateScheduleMatch(user, opportunity);

                const overallScore = (
                    skillAnalysis.matchPercentage * 0.4 +
                    interestScore * 0.3 +
                    locationScore * 0.2 +
                    scheduleScore * 0.1
                );

                recommendations.push({
                    opportunity: opportunity.toObject(),
                    matchScore: Math.round(overallScore),
                    skillAnalysis,
                    interestScore: Math.round(interestScore),
                    locationScore: Math.round(locationScore),
                    scheduleScore: Math.round(scheduleScore),
                    reasons: this.generateMatchReasons(skillAnalysis, interestScore, locationScore, scheduleScore)
                });
            }

            return recommendations
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, limit);
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    /**
     * Calculate interest match score
     * @param {Array} userInterests - User's interests
     * @param {Object} opportunity - Opportunity object
     * @returns {Number} Score between 0 and 100
     */
    static calculateInterestMatch(userInterests, opportunity) {
        if (!userInterests || userInterests.length === 0) {
            return 50; // Neutral score if no interests
        }

        let score = 0;
        let totalChecks = 0;

        // Check category match
        const categoryMatch = userInterests.some(interest =>
            interest.toLowerCase() === opportunity.category.toLowerCase()
        );
        if (categoryMatch) {
            score += 40;
        }
        totalChecks += 1;

        // Check tag matches
        if (opportunity.tags && opportunity.tags.length > 0) {
            const tagMatches = opportunity.tags.filter(tag =>
                userInterests.some(interest =>
                    tag.toLowerCase().includes(interest.toLowerCase()) ||
                    interest.toLowerCase().includes(tag.toLowerCase())
                )
            ).length;
            score += (tagMatches / opportunity.tags.length) * 30;
            totalChecks += 1;
        }

        // Check subcategory match
        if (opportunity.subcategory) {
            const subcategoryMatch = userInterests.some(interest =>
                interest.toLowerCase() === opportunity.subcategory.toLowerCase()
            );
            if (subcategoryMatch) {
                score += 30;
            }
            totalChecks += 1;
        }

        return totalChecks > 0 ? (score / totalChecks) : 50;
    }

    /**
     * Calculate location match score
     * @param {Object} userLocation - User's location
     * @param {Object} opportunityLocation - Opportunity's location
     * @returns {Number} Score between 0 and 100
     */
    static calculateLocationMatch(userLocation, opportunityLocation) {
        if (opportunityLocation.type === 'remote') {
            return 100; // Perfect match for remote opportunities
        }

        if (!userLocation || !opportunityLocation) {
            return 50; // Neutral score if no location data
        }

        // Same city
        if (userLocation.city && opportunityLocation.city &&
            userLocation.city.toLowerCase() === opportunityLocation.city.toLowerCase()) {
            return 100;
        }

        // Same state/region
        if (userLocation.state && opportunityLocation.state &&
            userLocation.state.toLowerCase() === opportunityLocation.state.toLowerCase()) {
            return 80;
        }

        // Same country
        if (userLocation.country && opportunityLocation.country &&
            userLocation.country.toLowerCase() === opportunityLocation.country.toLowerCase()) {
            return 60;
        }

        // Different country
        return 20;
    }

    /**
     * Calculate schedule match score
     * @param {Object} user - User object
     * @param {Object} opportunity - Opportunity object
     * @returns {Number} Score between 0 and 100
     */
    static calculateScheduleMatch(user, opportunity) {
        // This is a simplified version - in a real app, you'd consider user's availability
        if (opportunity.schedule.flexible) {
            return 90; // High score for flexible opportunities
        }

        if (opportunity.schedule.duration === 'one-time') {
            return 80; // Good for one-time opportunities
        }

        if (opportunity.schedule.duration === 'short-term') {
            return 70; // Moderate for short-term
        }

        return 50; // Neutral for long-term/ongoing
    }

    /**
     * Generate human-readable match reasons
     * @param {Object} skillAnalysis - Skill analysis result
     * @param {Number} interestScore - Interest match score
     * @param {Number} locationScore - Location match score
     * @param {Number} scheduleScore - Schedule match score
     * @returns {Array} Array of reason strings
     */
    static generateMatchReasons(skillAnalysis, interestScore, locationScore, scheduleScore) {
        const reasons = [];

        if (skillAnalysis.matchPercentage > 80) {
            reasons.push('Your skills are a great match for this opportunity');
        } else if (skillAnalysis.matchPercentage > 60) {
            reasons.push('Your skills partially match the requirements');
        }

        if (interestScore > 80) {
            reasons.push('This aligns with your interests');
        }

        if (locationScore > 80) {
            reasons.push('This opportunity is in your area');
        } else if (locationScore === 100) {
            reasons.push('This is a remote opportunity');
        }

        if (scheduleScore > 80) {
            reasons.push('The schedule works well for you');
        }

        if (skillAnalysis.matches.length > 0) {
            const topSkills = skillAnalysis.matches
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(match => match.skill);
            reasons.push(`You have experience in: ${topSkills.join(', ')}`);
        }

        return reasons;
    }

    /**
     * Analyze skill gaps and provide learning recommendations
     * @param {String} userId - User ID
     * @param {String} opportunityId - Opportunity ID
     * @returns {Object} Skill gap analysis
     */
    static async analyzeSkillGaps(userId, opportunityId) {
        try {
            const user = await User.findById(userId);
            const opportunity = await VolunteerOpportunity.findById(opportunityId);

            if (!user || !opportunity) {
                throw new Error('User or opportunity not found');
            }

            const skillAnalysis = this.calculateSkillMatch(user.skills || [], opportunity.skills);

            const learningPath = skillAnalysis.recommendations.map(rec => ({
                skill: rec.skill,
                currentLevel: rec.currentLevel || 'none',
                targetLevel: rec.level || rec.targetLevel,
                priority: rec.type === 'skill_learning' ? 'high' : 'medium',
                resources: this.getLearningResources(rec.skill, rec.level || rec.targetLevel),
                estimatedTime: this.estimateLearningTime(rec.level || rec.targetLevel)
            }));

            return {
                opportunity: {
                    title: opportunity.title,
                    organization: opportunity.organization.name
                },
                currentMatch: skillAnalysis.matchPercentage,
                targetMatch: 80, // Target match percentage
                skillGaps: skillAnalysis.missing,
                learningPath,
                timeline: this.calculateLearningTimeline(learningPath)
            };
        } catch (error) {
            console.error('Error analyzing skill gaps:', error);
            throw error;
        }
    }

    /**
     * Get learning resources for a skill
     * @param {String} skill - Skill name
     * @param {String} level - Target level
     * @returns {Array} Learning resources
     */
    static getLearningResources(skill, level) {
        // This would typically come from a learning resources database
        const resources = {
            'javascript': {
                beginner: [
                    'JavaScript Basics - MDN Web Docs',
                    'JavaScript for Beginners - freeCodeCamp',
                    'Learn JavaScript - Codecademy'
                ],
                intermediate: [
                    'JavaScript ES6+ Features - MDN',
                    'JavaScript Algorithms and Data Structures - freeCodeCamp',
                    'Modern JavaScript Tutorial - javascript.info'
                ],
                advanced: [
                    'JavaScript: The Good Parts - Douglas Crockford',
                    'You Don\'t Know JS - Kyle Simpson',
                    'Advanced JavaScript Patterns - Pluralsight'
                ]
            },
            'python': {
                beginner: [
                    'Python for Beginners - Python.org',
                    'Learn Python - Codecademy',
                    'Python Tutorial - W3Schools'
                ],
                intermediate: [
                    'Python Data Science Handbook - Jake VanderPlas',
                    'Automate the Boring Stuff with Python - Al Sweigart',
                    'Python Cookbook - David Beazley'
                ],
                advanced: [
                    'Fluent Python - Luciano Ramalho',
                    'Python Tricks - Dan Bader',
                    'Effective Python - Brett Slatkin'
                ]
            }
        };

        return resources[skill.toLowerCase()]?.[level] || [
            `Learn ${skill} at ${level} level`,
            'Check online courses and tutorials',
            'Practice with real projects'
        ];
    }

    /**
     * Estimate learning time for a skill level
     * @param {String} level - Skill level
     * @returns {String} Estimated time
     */
    static estimateLearningTime(level) {
        const timeEstimates = {
            'beginner': '2-4 weeks',
            'intermediate': '1-2 months',
            'advanced': '3-6 months',
            'expert': '6+ months'
        };
        return timeEstimates[level] || 'Varies';
    }

    /**
     * Calculate learning timeline
     * @param {Array} learningPath - Learning path array
     * @returns {Object} Timeline information
     */
    static calculateLearningTimeline(learningPath) {
        const totalWeeks = learningPath.reduce((total, item) => {
            const weeks = this.parseTimeToWeeks(item.estimatedTime);
            return total + weeks;
        }, 0);

        return {
            totalWeeks,
            totalMonths: Math.ceil(totalWeeks / 4),
            startDate: new Date(),
            estimatedCompletion: new Date(Date.now() + totalWeeks * 7 * 24 * 60 * 60 * 1000),
            milestones: learningPath.map((item, index) => ({
                skill: item.skill,
                targetLevel: item.targetLevel,
                estimatedCompletion: new Date(Date.now() + (index + 1) * 4 * 7 * 24 * 60 * 60 * 1000)
            }))
        };
    }

    /**
     * Parse time string to weeks
     * @param {String} timeString - Time string like "2-4 weeks"
     * @returns {Number} Number of weeks
     */
    static parseTimeToWeeks(timeString) {
        const match = timeString.match(/(\d+)-?(\d+)?\s*(weeks?|months?)/i);
        if (match) {
            const unit = match[3].toLowerCase();
            const min = parseInt(match[1]);
            const max = parseInt(match[2]) || min;
            const avg = (min + max) / 2;
            return unit.startsWith('month') ? avg * 4 : avg;
        }
        return 4; // Default to 4 weeks
    }

    /**
     * Get trending skills in volunteering
     * @param {Number} limit - Number of skills to return
     * @returns {Array} Trending skills
     */
    static async getTrendingSkills(limit = 10) {
        try {
            const pipeline = [
                { $match: { status: 'active', visibility: 'public' } },
                { $unwind: '$skills' },
                { $group: {
                    _id: '$skills.name',
                    count: { $sum: 1 },
                    avgLevel: { $avg: { $indexOfArray: [['beginner', 'intermediate', 'advanced', 'expert'], '$skills.level'] } }
                }},
                { $sort: { count: -1 } },
                { $limit: limit }
            ];

            const result = await VolunteerOpportunity.aggregate(pipeline);
            return result.map(skill => ({
                name: skill._id,
                demand: skill.count,
                averageLevel: ['beginner', 'intermediate', 'advanced', 'expert'][Math.round(skill.avgLevel)]
            }));
        } catch (error) {
            console.error('Error getting trending skills:', error);
            throw error;
        }
    }

    /**
     * Predict impact of volunteering opportunity
     * @param {String} opportunityId - Opportunity ID
     * @returns {Object} Impact prediction
     */
    static async predictImpact(opportunityId) {
        try {
            const opportunity = await VolunteerOpportunity.findById(opportunityId);
            if (!opportunity) {
                throw new Error('Opportunity not found');
            }

            // Simple impact prediction based on various factors
            const baseImpact = 50;
            let impactScore = baseImpact;

            // Factor in number of volunteers
            impactScore += opportunity.maxVolunteers * 5;

            // Factor in duration
            const durationMultiplier = {
                'one-time': 1,
                'short-term': 1.5,
                'long-term': 2,
                'ongoing': 2.5
            };
            impactScore *= durationMultiplier[opportunity.schedule.duration] || 1;

            // Factor in category
            const categoryMultiplier = {
                'Education': 1.2,
                'Healthcare': 1.3,
                'Environment': 1.1,
                'Community Development': 1.0,
                'Disaster Relief': 1.5
            };
            impactScore *= categoryMultiplier[opportunity.category] || 1;

            // Factor in skills required
            const skillComplexity = opportunity.skills.filter(s => s.required).length;
            impactScore += skillComplexity * 2;

            return {
                opportunity: opportunity.title,
                predictedImpact: Math.round(impactScore),
                factors: {
                    volunteerCapacity: opportunity.maxVolunteers,
                    duration: opportunity.schedule.duration,
                    category: opportunity.category,
                    skillComplexity: skillComplexity
                },
                confidence: 0.75 // This would be calculated based on historical data
            };
        } catch (error) {
            console.error('Error predicting impact:', error);
            throw error;
        }
    }
}

module.exports = AIService;

