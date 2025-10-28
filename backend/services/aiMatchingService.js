const VolunteerProfile = require("../models/VolunteerProfile");
const VolunteerOpportunity = require("../models/VolunteerOpportunity");
const Campaign = require("../models/Campaign");
const User = require("../models/User");

class AIMatchingService {
  constructor() {
    this.skillWeights = {
      exact: 1.0,
      similar: 0.7,
      related: 0.4,
      transferable: 0.2,
    };

    this.locationWeights = {
      sameCity: 1.0,
      nearbyCity: 0.8,
      sameState: 0.6,
      remote: 0.9,
    };

    this.availabilityWeights = {
      perfectMatch: 1.0,
      goodMatch: 0.8,
      partialMatch: 0.5,
      poorMatch: 0.2,
    };

    this.experienceWeights = {
      expert: 1.0,
      advanced: 0.85,
      intermediate: 0.7,
      beginner: 0.5,
    };

    // Skill similarity mappings
    this.skillSimilarity = {
      "web design": [
        "graphic design",
        "ui design",
        "frontend development",
        "html",
        "css",
      ],
      marketing: [
        "social media",
        "digital marketing",
        "content creation",
        "advertising",
        "branding",
      ],
      teaching: [
        "education",
        "training",
        "mentoring",
        "tutoring",
        "curriculum development",
      ],
      photography: [
        "videography",
        "graphic design",
        "visual arts",
        "content creation",
      ],
      "social media": [
        "marketing",
        "content creation",
        "community management",
        "digital marketing",
      ],
      "project management": [
        "leadership",
        "organization",
        "coordination",
        "planning",
      ],
      "data analysis": [
        "research",
        "statistics",
        "reporting",
        "excel",
        "database management",
      ],
      writing: [
        "content creation",
        "editing",
        "journalism",
        "copywriting",
        "blogging",
      ],
      fundraising: [
        "sales",
        "marketing",
        "networking",
        "event planning",
        "donor relations",
      ],
      "event planning": [
        "project management",
        "coordination",
        "logistics",
        "hospitality",
      ],
    };

    // Category interest mappings
    this.categoryKeywords = {
      education: [
        "teaching",
        "tutoring",
        "curriculum",
        "literacy",
        "learning",
        "school",
        "children",
      ],
      healthcare: [
        "medical",
        "nursing",
        "health",
        "wellness",
        "therapy",
        "care",
        "mental health",
      ],
      environment: [
        "sustainability",
        "green",
        "climate",
        "conservation",
        "recycling",
        "clean energy",
      ],
      community: [
        "local",
        "neighborhood",
        "social",
        "outreach",
        "development",
        "support",
      ],
      "disaster-relief": [
        "emergency",
        "rescue",
        "crisis",
        "relief",
        "humanitarian",
        "aid",
      ],
      other: ["general", "miscellaneous", "various", "flexible"],
    };
  }

  /**
   * Get personalized campaign recommendations for a volunteer
   */
  async getRecommendationsForVolunteer(userId, options = {}) {
    try {
      const {
        limit = 10,
        includeProfile = true,
        onlyActive = true,
        skillWeight = 0.3,
        locationWeight = 0.2,
        availabilityWeight = 0.25,
        experienceWeight = 0.15,
        interestWeight = 0.1,
      } = options;

      // Get volunteer profile
      const volunteerProfile = await VolunteerProfile.findOne({
        userId,
      }).populate("userId");
      if (!volunteerProfile) {
        throw new Error("Volunteer profile not found");
      }

      // Get available campaigns and opportunities
      const campaignFilter = onlyActive ? { status: "active" } : {};
      const campaigns = await Campaign.find(campaignFilter)
        .populate("createdBy", "name email")
        .lean();

      const opportunities = await VolunteerOpportunity.find({
        campaignId: { $in: campaigns.map((c) => c._id) },
        status: "active",
      }).lean();

      // Calculate recommendations
      const recommendations = [];

      for (const campaign of campaigns) {
        // Find related opportunities
        const campaignOpportunities = opportunities.filter(
          (opp) => opp.campaignId.toString() === campaign._id.toString(),
        );

        // Calculate base campaign match
        const campaignMatch = await this.calculateCampaignMatch(
          volunteerProfile,
          campaign,
          campaignOpportunities,
          {
            skillWeight,
            locationWeight,
            availabilityWeight,
            experienceWeight,
            interestWeight,
          },
        );

        if (campaignMatch.totalScore > 20) {
          // Minimum threshold
          recommendations.push({
            campaign,
            opportunities: campaignOpportunities,
            matchScore: campaignMatch.totalScore,
            matchBreakdown: campaignMatch.breakdown,
            recommendationReason: campaignMatch.reason,
            priority: this.calculatePriority(
              campaignMatch.totalScore,
              campaign,
            ),
            estimatedHours: this.estimateVolunteerHours(campaignOpportunities),
            skillGains: this.identifySkillGains(
              volunteerProfile,
              campaignOpportunities,
            ),
          });
        }
      }

      // Sort by match score and priority
      recommendations.sort((a, b) => {
        if (a.priority === b.priority) {
          return b.matchScore - a.matchScore;
        }
        return (
          this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
        );
      });

      const result = {
        recommendations: recommendations.slice(0, limit),
        totalFound: recommendations.length,
        volunteerProfile: includeProfile ? volunteerProfile : null,
        matchingCriteria: {
          skillWeight,
          locationWeight,
          availabilityWeight,
          experienceWeight,
          interestWeight,
        },
      };

      return result;
    } catch (error) {
      console.error("Error getting volunteer recommendations:", error);
      throw error;
    }
  }

  /**
   * Get best volunteer matches for a campaign opportunity
   */
  async getVolunteersForOpportunity(opportunityId, options = {}) {
    try {
      const { limit = 20, minScore = 50, includeProfiles = true } = options;

      const opportunity = await VolunteerOpportunity.findById(opportunityId)
        .populate("campaignId")
        .lean();

      if (!opportunity) {
        throw new Error("Opportunity not found");
      }

      // Get all volunteer profiles
      const volunteerProfiles = await VolunteerProfile.find()
        .populate("userId", "name email avatar")
        .lean();

      const matches = [];

      for (const profile of volunteerProfiles) {
        const matchResult = await this.calculateVolunteerMatch(
          profile,
          opportunity,
        );

        if (matchResult.totalScore >= minScore) {
          matches.push({
            volunteer: profile,
            matchScore: matchResult.totalScore,
            matchBreakdown: matchResult.breakdown,
            strengths: matchResult.strengths,
            concerns: matchResult.concerns,
            recommendation: this.getRecommendationLevel(matchResult.totalScore),
          });
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return {
        matches: matches.slice(0, limit),
        totalFound: matches.length,
        opportunity: opportunity,
        averageScore:
          matches.length > 0
            ? Math.round(
                matches.reduce((sum, m) => sum + m.matchScore, 0) /
                  matches.length,
              )
            : 0,
      };
    } catch (error) {
      console.error("Error getting volunteer matches:", error);
      throw error;
    }
  }

  /**
   * Calculate match score between volunteer and campaign
   */
  async calculateCampaignMatch(
    volunteerProfile,
    campaign,
    opportunities = [],
    weights = {},
  ) {
    const {
      skillWeight = 0.3,
      locationWeight = 0.2,
      availabilityWeight = 0.25,
      experienceWeight = 0.15,
      interestWeight = 0.1,
    } = weights;

    const breakdown = {};
    let totalScore = 0;

    // 1. Skills Match
    const skillsScore = this.calculateSkillsMatch(
      volunteerProfile.skills,
      opportunities,
    );
    breakdown.skills = {
      score: skillsScore,
      weight: skillWeight,
      weightedScore: skillsScore * skillWeight,
    };
    totalScore += skillsScore * skillWeight;

    // 2. Location Match
    const locationScore = this.calculateLocationMatch(
      volunteerProfile.location,
      opportunities,
    );
    breakdown.location = {
      score: locationScore,
      weight: locationWeight,
      weightedScore: locationScore * locationWeight,
    };
    totalScore += locationScore * locationWeight;

    // 3. Availability Match
    const availabilityScore = this.calculateAvailabilityMatch(
      volunteerProfile.availability,
      opportunities,
    );
    breakdown.availability = {
      score: availabilityScore,
      weight: availabilityWeight,
      weightedScore: availabilityScore * availabilityWeight,
    };
    totalScore += availabilityScore * availabilityWeight;

    // 4. Experience Match
    const experienceScore = this.calculateExperienceMatch(
      volunteerProfile,
      campaign,
    );
    breakdown.experience = {
      score: experienceScore,
      weight: experienceWeight,
      weightedScore: experienceScore * experienceWeight,
    };
    totalScore += experienceScore * experienceWeight;

    // 5. Interest Match
    const interestScore = this.calculateInterestMatch(
      volunteerProfile.interests,
      campaign,
    );
    breakdown.interest = {
      score: interestScore,
      weight: interestWeight,
      weightedScore: interestScore * interestWeight,
    };
    totalScore += interestScore * interestWeight;

    // Generate recommendation reason
    const reason = this.generateRecommendationReason(breakdown, campaign);

    return {
      totalScore: Math.round(totalScore),
      breakdown,
      reason,
    };
  }

  /**
   * Calculate match score between volunteer and specific opportunity
   */
  async calculateVolunteerMatch(volunteerProfile, opportunity) {
    const breakdown = {};
    let totalScore = 0;

    // Skills match (40% weight)
    const skillsScore = this.calculateOpportunitySkillsMatch(
      volunteerProfile.skills,
      opportunity,
    );
    breakdown.skills = skillsScore;
    totalScore += skillsScore.score * 0.4;

    // Location match (20% weight)
    const locationScore = this.calculateSingleLocationMatch(
      volunteerProfile.location,
      opportunity.location,
    );
    breakdown.location = { score: locationScore };
    totalScore += locationScore * 0.2;

    // Availability match (25% weight)
    const availabilityScore = this.calculateSingleAvailabilityMatch(
      volunteerProfile.availability,
      opportunity.timeCommitment,
    );
    breakdown.availability = { score: availabilityScore };
    totalScore += availabilityScore * 0.25;

    // Experience match (15% weight)
    const experienceScore = this.calculateVolunteerExperienceMatch(
      volunteerProfile,
      opportunity,
    );
    breakdown.experience = { score: experienceScore };
    totalScore += experienceScore * 0.15;

    // Generate strengths and concerns
    const analysis = this.analyzeVolunteerMatch(
      breakdown,
      volunteerProfile,
      opportunity,
    );

    return {
      totalScore: Math.round(totalScore),
      breakdown,
      strengths: analysis.strengths,
      concerns: analysis.concerns,
    };
  }

  /**
   * Calculate skills matching score
   */
  calculateSkillsMatch(volunteerSkills, opportunities) {
    if (!opportunities.length) return 70; // Default for campaigns without specific opportunities

    let totalScore = 0;
    let totalWeight = 0;

    opportunities.forEach((opportunity) => {
      const requiredSkills = opportunity.skillsRequired || [];
      const preferredSkills = opportunity.skillsPreferred || [];

      if (requiredSkills.length === 0 && preferredSkills.length === 0) {
        totalScore += 80; // Good score for general opportunities
        totalWeight += 1;
        return;
      }

      let opportunityScore = 0;
      let skillChecks = 0;

      // Check required skills (higher weight)
      requiredSkills.forEach((reqSkill) => {
        const match = this.findBestSkillMatch(volunteerSkills, reqSkill.skill);
        if (match) {
          const levelScore = this.calculateLevelMatch(
            match.level,
            reqSkill.level,
          );
          opportunityScore += levelScore * (reqSkill.isRequired ? 30 : 20);
        } else {
          opportunityScore += reqSkill.isRequired ? 0 : 5; // Penalty for missing required skills
        }
        skillChecks += reqSkill.isRequired ? 30 : 20;
      });

      // Check preferred skills (lower weight)
      preferredSkills.forEach((prefSkill) => {
        const match = this.findBestSkillMatch(volunteerSkills, prefSkill.skill);
        if (match) {
          const levelScore = this.calculateLevelMatch(
            match.level,
            prefSkill.level,
          );
          opportunityScore += levelScore * 10;
        }
        skillChecks += 10;
      });

      if (skillChecks > 0) {
        totalScore += (opportunityScore / skillChecks) * 100;
        totalWeight += 1;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  /**
   * Calculate location matching score
   */
  calculateLocationMatch(volunteerLocation, opportunities) {
    if (!opportunities.length) return 60;

    let totalScore = 0;
    let totalWeight = 0;

    opportunities.forEach((opportunity) => {
      let locationScore = 50; // Default

      if (
        opportunity.location.type === "remote" ||
        volunteerLocation.isRemoteAvailable
      ) {
        locationScore = 90;
      } else if (volunteerLocation.city && opportunity.location.city) {
        if (
          volunteerLocation.city.toLowerCase() ===
          opportunity.location.city.toLowerCase()
        ) {
          locationScore = 100;
        } else if (volunteerLocation.state === opportunity.location.state) {
          locationScore = 70;
        } else {
          locationScore = 40;
        }
      }

      totalScore += locationScore;
      totalWeight += 1;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  /**
   * Calculate availability matching score
   */
  calculateAvailabilityMatch(volunteerAvailability, opportunities) {
    if (!opportunities.length) return 65;

    let totalScore = 0;
    let totalWeight = 0;

    opportunities.forEach((opportunity) => {
      let availabilityScore = 50;

      if (opportunity.timeCommitment) {
        const requiredHours = opportunity.timeCommitment.hoursPerWeek || 5;
        const volunteerHours = volunteerAvailability.hoursPerWeek || 5;

        // Hours compatibility
        if (volunteerHours >= requiredHours) {
          availabilityScore = Math.min(
            100,
            70 + (volunteerHours - requiredHours) * 2,
          );
        } else {
          availabilityScore = Math.max(
            20,
            (volunteerHours / requiredHours) * 70,
          );
        }

        // Day overlap bonus
        const requiredDays =
          opportunity.timeCommitment.schedule?.preferredDays || [];
        const volunteerDays = volunteerAvailability.preferredDays || [];

        if (requiredDays.length > 0 && volunteerDays.length > 0) {
          const overlap = requiredDays.filter((day) =>
            volunteerDays.includes(day),
          );
          const overlapBonus = (overlap.length / requiredDays.length) * 20;
          availabilityScore += overlapBonus;
        }

        // Flexibility bonus
        if (opportunity.timeCommitment.isFlexible && availabilityScore < 80) {
          availabilityScore += 15;
        }
      }

      totalScore += Math.min(100, availabilityScore);
      totalWeight += 1;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  /**
   * Calculate experience matching score
   */
  calculateExperienceMatch(volunteerProfile, campaign) {
    let experienceScore = 50;

    // Check category familiarity
    const volunteerInterests = volunteerProfile.interests.map(
      (i) => i.category,
    );
    if (volunteerInterests.includes(campaign.category)) {
      experienceScore += 30;
    }

    // Check overall volunteer experience
    const totalHours = volunteerProfile.statistics?.totalHours || 0;
    const completedCampaigns =
      volunteerProfile.statistics?.campaignsCompleted || 0;

    if (totalHours > 100) experienceScore += 15;
    else if (totalHours > 50) experienceScore += 10;
    else if (totalHours > 10) experienceScore += 5;

    if (completedCampaigns > 5) experienceScore += 10;
    else if (completedCampaigns > 2) experienceScore += 5;

    // Check reviews and ratings
    const averageRating = volunteerProfile.averageRating || 0;
    if (averageRating >= 4.5) experienceScore += 10;
    else if (averageRating >= 4.0) experienceScore += 5;

    return Math.min(100, experienceScore);
  }

  /**
   * Calculate interest matching score
   */
  calculateInterestMatch(volunteerInterests, campaign) {
    let interestScore = 40; // Base score

    // Direct category match
    const categoryMatch = volunteerInterests.find(
      (interest) => interest.category === campaign.category,
    );

    if (categoryMatch) {
      const priorityBonus = {
        high: 40,
        medium: 25,
        low: 15,
      };
      interestScore += priorityBonus[categoryMatch.priority] || 25;
    }

    // Related category matches
    const relatedCategories = this.getRelatedCategories(campaign.category);
    const relatedMatches = volunteerInterests.filter((interest) =>
      relatedCategories.includes(interest.category),
    );

    relatedMatches.forEach((match) => {
      const priorityBonus = {
        high: 15,
        medium: 10,
        low: 5,
      };
      interestScore += priorityBonus[match.priority] || 10;
    });

    // Keyword matching in campaign description
    const keywords = this.categoryKeywords[campaign.category] || [];
    const descriptionWords = campaign.description.toLowerCase().split(/\s+/);
    const keywordMatches = keywords.filter((keyword) =>
      descriptionWords.some((word) => word.includes(keyword)),
    );

    interestScore += keywordMatches.length * 3;

    return Math.min(100, interestScore);
  }

  /**
   * Find best matching skill from volunteer's skills
   */
  findBestSkillMatch(volunteerSkills, targetSkill) {
    const targetSkillLower = targetSkill.toLowerCase();

    // Exact match
    let exactMatch = volunteerSkills.find(
      (skill) => skill.name.toLowerCase() === targetSkillLower,
    );
    if (exactMatch) return { ...exactMatch, matchType: "exact" };

    // Similar skills match
    const similarSkills = this.skillSimilarity[targetSkillLower] || [];
    let similarMatch = volunteerSkills.find((skill) =>
      similarSkills.includes(skill.name.toLowerCase()),
    );
    if (similarMatch) return { ...similarMatch, matchType: "similar" };

    // Partial match (contains target skill or vice versa)
    let partialMatch = volunteerSkills.find(
      (skill) =>
        skill.name.toLowerCase().includes(targetSkillLower) ||
        targetSkillLower.includes(skill.name.toLowerCase()),
    );
    if (partialMatch) return { ...partialMatch, matchType: "partial" };

    return null;
  }

  /**
   * Calculate level compatibility score
   */
  calculateLevelMatch(volunteerLevel, requiredLevel) {
    const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const volunteerLevelNum = levels[volunteerLevel] || 1;
    const requiredLevelNum = levels[requiredLevel] || 1;

    if (volunteerLevelNum >= requiredLevelNum) {
      return 100; // Perfect or overqualified
    } else {
      // Calculate partial score based on gap
      const gap = requiredLevelNum - volunteerLevelNum;
      return Math.max(20, 100 - gap * 30);
    }
  }

  /**
   * Calculate opportunity-specific skills match
   */
  calculateOpportunitySkillsMatch(volunteerSkills, opportunity) {
    const requiredSkills = opportunity.skillsRequired || [];
    const preferredSkills = opportunity.skillsPreferred || [];

    if (requiredSkills.length === 0 && preferredSkills.length === 0) {
      return { score: 75, matches: [], missing: [] };
    }

    let totalScore = 0;
    let totalChecks = 0;
    const matches = [];
    const missing = [];

    // Check required skills
    requiredSkills.forEach((reqSkill) => {
      const match = this.findBestSkillMatch(volunteerSkills, reqSkill.skill);
      const weight = reqSkill.isRequired ? 40 : 25;

      if (match) {
        const levelScore = this.calculateLevelMatch(
          match.level,
          reqSkill.level,
        );
        totalScore += (levelScore / 100) * weight;
        matches.push({
          skill: reqSkill.skill,
          volunteerLevel: match.level,
          requiredLevel: reqSkill.level,
          match:
            levelScore >= 80
              ? "excellent"
              : levelScore >= 60
                ? "good"
                : "partial",
          isRequired: reqSkill.isRequired,
        });
      } else {
        missing.push({
          skill: reqSkill.skill,
          requiredLevel: reqSkill.level,
          isRequired: reqSkill.isRequired,
        });
      }
      totalChecks += weight;
    });

    // Check preferred skills
    preferredSkills.forEach((prefSkill) => {
      const match = this.findBestSkillMatch(volunteerSkills, prefSkill.skill);
      const weight = 15;

      if (match) {
        const levelScore = this.calculateLevelMatch(
          match.level,
          prefSkill.level,
        );
        totalScore += (levelScore / 100) * weight;
        matches.push({
          skill: prefSkill.skill,
          volunteerLevel: match.level,
          requiredLevel: prefSkill.level,
          match:
            levelScore >= 80
              ? "excellent"
              : levelScore >= 60
                ? "good"
                : "partial",
          isRequired: false,
        });
      }
      totalChecks += weight;
    });

    const finalScore =
      totalChecks > 0 ? Math.round((totalScore / totalChecks) * 100) : 50;

    return {
      score: finalScore,
      matches,
      missing,
    };
  }

  /**
   * Calculate single location match
   */
  calculateSingleLocationMatch(volunteerLocation, opportunityLocation) {
    if (opportunityLocation.type === "remote") {
      return volunteerLocation.isRemoteAvailable ? 95 : 70;
    }

    if (opportunityLocation.type === "hybrid") {
      return volunteerLocation.isRemoteAvailable ? 85 : 60;
    }

    // On-site location matching
    if (!volunteerLocation.city || !opportunityLocation.city) {
      return 50;
    }

    if (
      volunteerLocation.city.toLowerCase() ===
      opportunityLocation.city.toLowerCase()
    ) {
      return 100;
    }

    if (volunteerLocation.state === opportunityLocation.state) {
      return 75;
    }

    if (volunteerLocation.country === opportunityLocation.country) {
      return 45;
    }

    return 30;
  }

  /**
   * Calculate single availability match
   */
  calculateSingleAvailabilityMatch(volunteerAvailability, timeCommitment) {
    if (!timeCommitment) return 60;

    let availabilityScore = 50;

    // Hours compatibility
    const requiredHours = timeCommitment.hoursPerWeek || 5;
    const volunteerHours = volunteerAvailability.hoursPerWeek || 5;

    if (volunteerHours >= requiredHours) {
      availabilityScore =
        80 + Math.min(20, (volunteerHours - requiredHours) * 2);
    } else {
      availabilityScore = Math.max(25, (volunteerHours / requiredHours) * 80);
    }

    // Day overlap
    const requiredDays = timeCommitment.schedule?.preferredDays || [];
    const volunteerDays = volunteerAvailability.preferredDays || [];

    if (requiredDays.length > 0 && volunteerDays.length > 0) {
      const overlap = requiredDays.filter((day) => volunteerDays.includes(day));
      const overlapRatio = overlap.length / requiredDays.length;
      availabilityScore = availabilityScore * (0.7 + 0.3 * overlapRatio);
    }

    return Math.round(Math.min(100, availabilityScore));
  }

  /**
   * Calculate volunteer experience match for opportunity
   */
  calculateVolunteerExperienceMatch(volunteerProfile, opportunity) {
    let experienceScore = 50;

    // Total volunteering experience
    const totalHours = volunteerProfile.statistics?.totalHours || 0;
    if (totalHours > 200) experienceScore += 25;
    else if (totalHours > 100) experienceScore += 20;
    else if (totalHours > 50) experienceScore += 15;
    else if (totalHours > 20) experienceScore += 10;

    // Campaign completion rate
    const completionRate = volunteerProfile.completionRate || 0;
    if (completionRate >= 90) experienceScore += 15;
    else if (completionRate >= 75) experienceScore += 10;
    else if (completionRate >= 60) experienceScore += 5;

    // Average rating
    const avgRating = volunteerProfile.averageRating || 0;
    if (avgRating >= 4.5) experienceScore += 15;
    else if (avgRating >= 4.0) experienceScore += 10;
    else if (avgRating >= 3.5) experienceScore += 5;

    // Relevant experience in similar opportunities
    const relevantSkills = volunteerProfile.skills.filter(
      (skill) =>
        opportunity.skillsRequired?.some((req) => req.skill === skill.name) ||
        opportunity.skillsPreferred?.some((pref) => pref.skill === skill.name),
    );

    experienceScore += Math.min(15, relevantSkills.length * 3);

    return Math.min(100, experienceScore);
  }

  /**
   * Analyze volunteer match and provide insights
   */
  analyzeVolunteerMatch(breakdown, volunteerProfile, opportunity) {
    const strengths = [];
    const concerns = [];

    // Skills analysis
    if (breakdown.skills.score >= 80) {
      strengths.push("Excellent skill match for this opportunity");
    } else if (breakdown.skills.score >= 60) {
      strengths.push("Good skill alignment with opportunity requirements");
    } else if (breakdown.skills.score < 40) {
      concerns.push("Limited skills match - may need additional training");
    }

    // Location analysis
    if (breakdown.location.score >= 90) {
      strengths.push("Perfect location compatibility");
    } else if (breakdown.location.score < 50) {
      concerns.push("Location may be challenging - consider remote options");
    }

    // Availability analysis
    if (breakdown.availability.score >= 80) {
      strengths.push("Schedule aligns well with opportunity requirements");
    } else if (breakdown.availability.score < 50) {
      concerns.push("Limited availability for this opportunity");
    }

    // Experience analysis
    if (breakdown.experience.score >= 75) {
      strengths.push("Strong volunteer background and experience");
    } else if (breakdown.experience.score < 40) {
      concerns.push("Limited volunteering experience - may need guidance");
    }

    // Overall analysis
    const totalScore =
      Object.values(breakdown).reduce(
        (sum, item) => sum + (item.score || 0),
        0,
      ) / 4;

    if (totalScore >= 85) {
      strengths.push("Outstanding overall match - highly recommended");
    } else if (totalScore >= 70) {
      strengths.push("Strong overall candidate for this opportunity");
    } else if (totalScore < 50) {
      concerns.push(
        "Overall match is below average - consider other opportunities",
      );
    }

    return { strengths, concerns };
  }

  /**
   * Generate recommendation reason text
   */
  generateRecommendationReason(breakdown, campaign) {
    const reasons = [];

    // Find strongest match factors
    const factors = [
      {
        name: "skills",
        score: breakdown.skills.score,
        text: "your skills align perfectly",
      },
      {
        name: "location",
        score: breakdown.location.score,
        text: "the location is convenient for you",
      },
      {
        name: "availability",
        score: breakdown.availability.score,
        text: "the schedule matches your availability",
      },
      {
        name: "experience",
        score: breakdown.experience.score,
        text: "your experience is highly relevant",
      },
      {
        name: "interest",
        score: breakdown.interest.score,
        text: "this matches your interests",
      },
    ];

    const strongFactors = factors
      .filter((f) => f.score >= 70)
      .sort((a, b) => b.score - a.score);

    if (strongFactors.length > 0) {
      reasons.push(
        `We recommend this campaign because ${strongFactors[0].text}`,
      );

      if (strongFactors.length > 1) {
        reasons.push(`Additionally, ${strongFactors[1].text}`);
      }
    }

    // Add campaign-specific benefits
    if (campaign.type === "volunteering") {
      reasons.push(
        "This is a great opportunity to gain hands-on volunteering experience",
      );
    }

    if (campaign.category === "education") {
      reasons.push("You can make a direct impact on education and learning");
    }

    return reasons.join(". ") + ".";
  }

  /**
   * Calculate priority level for recommendation
   */
  calculatePriority(matchScore, campaign) {
    // High priority for urgent campaigns or high match scores
    if (campaign.priority === "urgent" || matchScore >= 85) {
      return "high";
    }

    // Medium priority for good matches
    if (matchScore >= 70 || campaign.priority === "high") {
      return "medium";
    }

    return "low";
  }

  /**
   * Get priority numeric value for sorting
   */
  getPriorityValue(priority) {
    const values = { high: 3, medium: 2, low: 1 };
    return values[priority] || 1;
  }

  /**
   * Estimate volunteer hours needed
   */
  estimateVolunteerHours(opportunities) {
    if (!opportunities.length) return 10; // Default estimate

    const totalHours = opportunities.reduce((sum, opp) => {
      const duration = opp.timeCommitment?.duration?.value || 4;
      const unit = opp.timeCommitment?.duration?.unit || "weeks";
      const hoursPerWeek = opp.timeCommitment?.hoursPerWeek || 5;

      let weekMultiplier = 1;
      if (unit === "months") weekMultiplier = 4.33;
      else if (unit === "days") weekMultiplier = 1 / 7;

      return sum + duration * weekMultiplier * hoursPerWeek;
    }, 0);

    return Math.round(totalHours / opportunities.length) || 10;
  }

  /**
   * Identify skill development opportunities
   */
  identifySkillGains(volunteerProfile, opportunities) {
    const potentialSkills = new Set();
    const existingSkills = new Set(
      volunteerProfile.skills.map((s) => s.name.toLowerCase()),
    );

    opportunities.forEach((opp) => {
      // Add required skills they don't have
      opp.skillsRequired?.forEach((skill) => {
        if (!existingSkills.has(skill.skill.toLowerCase())) {
          potentialSkills.add(skill.skill);
        }
      });

      // Add preferred skills they don't have
      opp.skillsPreferred?.forEach((skill) => {
        if (!existingSkills.has(skill.skill.toLowerCase())) {
          potentialSkills.add(skill.skill);
        }
      });
    });

    return Array.from(potentialSkills).slice(0, 5); // Top 5 skills they could learn
  }

  /**
   * Get recommendation level based on score
   */
  getRecommendationLevel(score) {
    if (score >= 85) return "strongly-recommend";
    if (score >= 70) return "recommend";
    if (score >= 50) return "neutral";
    if (score >= 30) return "not-recommend";
    return "strongly-not-recommend";
  }

  /**
   * Get related categories for interest matching
   */
  getRelatedCategories(category) {
    const relations = {
      education: ["community", "other"],
      healthcare: ["community", "disaster-relief"],
      environment: ["community", "other"],
      community: ["education", "healthcare", "environment"],
      "disaster-relief": ["healthcare", "community"],
      other: ["education", "community", "environment"],
    };

    return relations[category] || [];
  }

  /**
   * Batch calculate matching scores for multiple volunteers and opportunities
   */
  async batchCalculateMatches(volunteerIds, opportunityIds, options = {}) {
    try {
      const volunteers = await VolunteerProfile.find({
        userId: { $in: volunteerIds },
      })
        .populate("userId")
        .lean();

      const opportunities = await VolunteerOpportunity.find({
        _id: { $in: opportunityIds },
      })
        .populate("campaignId")
        .lean();

      const results = [];

      for (const volunteer of volunteers) {
        for (const opportunity of opportunities) {
          const matchResult = await this.calculateVolunteerMatch(
            volunteer,
            opportunity,
          );

          results.push({
            volunteerId: volunteer.userId._id,
            opportunityId: opportunity._id,
            campaignId: opportunity.campaignId._id,
            matchScore: matchResult.totalScore,
            breakdown: matchResult.breakdown,
            calculatedAt: new Date(),
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error in batch calculation:", error);
      throw error;
    }
  }

  /**
   * Update volunteer profile matching preferences
   */
  async updateMatchingPreferences(userId, preferences) {
    try {
      const profile = await VolunteerProfile.findOne({ userId });
      if (!profile) {
        throw new Error("Volunteer profile not found");
      }

      // Update preferences
      if (preferences.skills) {
        profile.skills = preferences.skills;
      }

      if (preferences.interests) {
        profile.interests = preferences.interests;
      }

      if (preferences.availability) {
        Object.assign(profile.availability, preferences.availability);
      }

      if (preferences.location) {
        Object.assign(profile.location, preferences.location);
      }

      if (preferences.preferences) {
        Object.assign(profile.preferences, preferences.preferences);
      }

      await profile.save();
      return profile;
    } catch (error) {
      console.error("Error updating matching preferences:", error);
      throw error;
    }
  }

  /**
   * Get trending skills and categories
   */
  async getTrendingSkillsAndCategories() {
    try {
      const opportunities = await VolunteerOpportunity.find({
        status: "active",
        "timeCommitment.schedule.startDate": { $gte: new Date() },
      }).lean();

      const skillCounts = {};
      const categoryCounts = {};

      opportunities.forEach((opp) => {
        // Count required skills
        opp.skillsRequired?.forEach((skill) => {
          skillCounts[skill.skill] = (skillCounts[skill.skill] || 0) + 2;
        });

        // Count preferred skills
        opp.skillsPreferred?.forEach((skill) => {
          skillCounts[skill.skill] = (skillCounts[skill.skill] || 0) + 1;
        });
      });

      // Get trending categories from campaigns
      const campaigns = await Campaign.find({ status: "active" }).lean();
      campaigns.forEach((campaign) => {
        categoryCounts[campaign.category] =
          (categoryCounts[campaign.category] || 0) + 1;
      });

      // Sort and return top trending items
      const trendingSkills = Object.entries(skillCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, demand: count }));

      const trendingCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([category, count]) => ({ category, campaigns: count }));

      return {
        skills: trendingSkills,
        categories: trendingCategories,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error getting trending data:", error);
      throw error;
    }
  }
}

module.exports = new AIMatchingService();
