import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  HeartIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  SparklesIcon,
  TrophyIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { campaignService } from "../../services/campaignService";
import { volunteerService } from "../../services/volunteerService";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    campaignsJoined: 0,
    hoursVolunteered: 0,
    donationsMade: 0,
    impactScore: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);
  const [impactSummary, setImpactSummary] = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchAIRecommendations();
    fetchVolunteerData();
    fetchVolunteerApplications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Get all campaigns to calculate volunteer stats
      const campaignsResponse = await campaignService.getCampaigns();

      if (campaignsResponse.success) {
        const allCampaigns = campaignsResponse.data.campaigns || [];

        // Calculate volunteer-specific stats
        const campaignsJoined = allCampaigns.filter((campaign) =>
          campaign.volunteers?.some((volunteer) => volunteer._id === user._id),
        ).length;

        // Calculate total donations made by this volunteer
        const donationsMade = allCampaigns.reduce((total, campaign) => {
          if (campaign.donations) {
            const volunteerDonations = campaign.donations.filter(
              (donation) => donation.volunteerId === user._id,
            );
            return total + volunteerDonations.length;
          }
          return total;
        }, 0);

        // Calculate total amount donated
        const totalDonated = allCampaigns.reduce((total, campaign) => {
          if (campaign.donations) {
            const volunteerDonations = campaign.donations.filter(
              (donation) => donation.volunteerId === user._id,
            );
            return (
              total +
              volunteerDonations.reduce(
                (sum, donation) => sum + donation.amount,
                0,
              )
            );
          }
          return total;
        }, 0);

        // Calculate impact score based on activities
        const impactScore = Math.min(
          100,
          campaignsJoined * 20 + donationsMade * 5,
        );

        setStats({
          campaignsJoined,
          hoursVolunteered: campaignsJoined * 8, // Estimate 8 hours per campaign
          donationsMade,
          impactScore,
          totalDonated,
        });

        // Get recent campaigns the volunteer is involved in
        const volunteerCampaigns = allCampaigns
          .filter((campaign) =>
            campaign.volunteers?.some(
              (volunteer) => volunteer._id === user._id,
            ),
          )
          .slice(0, 2);

        setRecentCampaigns(volunteerCampaigns);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const fetchAIRecommendations = async () => {
    try {
      const response = await volunteerService.getRecommendations({ limit: 6 });
      if (response.success) {
        setRecommendations(response.data.recommendations || []);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      // Don't show error toast for recommendations as it's not critical
    }
  };

  const fetchVolunteerData = async () => {
    try {
      // Get volunteer profile
      const profileResponse = await volunteerService.getProfile();
      if (profileResponse.success) {
        setVolunteerProfile(profileResponse.data.profile);
      }

      // Get impact records summary
      const impactResponse = await volunteerService.getImpactRecords({
        limit: 1,
      });
      if (impactResponse.success) {
        setImpactSummary(impactResponse.data.summary);

        // Update stats with real impact data
        setStats((prevStats) => ({
          ...prevStats,
          hoursVolunteered:
            impactResponse.data.summary.totalHours ||
            prevStats.hoursVolunteered,
          impactScore:
            Math.round(impactResponse.data.summary.totalImpactPoints / 10) ||
            prevStats.impactScore,
        }));
      }

      // Get recent badges
      const badgesResponse = await volunteerService.getBadges();
      if (badgesResponse.success) {
        setRecentBadges(badgesResponse.data.recentBadges || []);
      }
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVolunteerApplications = async () => {
    try {
      const response = await volunteerService.getApplications();
      if (response.success) {
        setApplications(response.data.applications || []);

        // Update stats with application data
        setStats((prevStats) => ({
          ...prevStats,
          campaignsJoined:
            response.data.applications?.filter(
              (app) => app.status === "approved",
            ).length || prevStats.campaignsJoined,
        }));
      }
    } catch (error) {
      console.error("Error fetching volunteer applications:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMatchScoreColor = (score) => {
    if (score >= 85) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-blue-600 bg-blue-50";
    if (score >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            Welcome back, {user?.name}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-600"
          >
            Here's your volunteering impact and opportunities.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Campaigns Joined
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.campaignsJoined}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Hours Volunteered
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.hoursVolunteered}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Donations Made
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.donationsMade}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Impact Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.impactScore}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/volunteer/browse"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Browse Campaigns
            </Link>
            <Link
              to="/volunteer/browse?type=volunteering"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <HeartIcon className="w-5 h-5 mr-2" />
              Find Volunteering
            </Link>
            <Link
              to="/volunteer/deliveries"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <TruckIcon className="w-5 h-5 mr-2" />
              Track Deliveries
            </Link>
            <Link
              to="/volunteer/log-hours"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <BoltIcon className="w-5 h-5 mr-2" />
              Log Hours
            </Link>
          </div>
        </motion.div>

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">
                  AI Recommendations
                </h2>
              </div>
              <button
                onClick={() =>
                  setShowAllRecommendations(!showAllRecommendations)
                }
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {showAllRecommendations ? "Show Less" : "View All"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(showAllRecommendations
                ? recommendations
                : recommendations.slice(0, 2)
              ).map((rec, index) => (
                <motion.div
                  key={rec.campaign._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="card overflow-hidden border-2 border-purple-100"
                >
                  <div className="relative">
                    <img
                      src={rec.campaign.imageURL}
                      alt={rec.campaign.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getMatchScoreColor(rec.matchScore)}`}
                      >
                        {rec.matchScore}% Match
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority} Priority
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {rec.campaign.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {rec.recommendationReason}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>{rec.estimatedHours}h estimated</span>
                      </div>
                      <div className="flex items-center">
                        <span className="capitalize">
                          {rec.campaign.category}
                        </span>
                      </div>
                    </div>

                    {rec.skillGains && rec.skillGains.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">
                          Skills you'll gain:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {rec.skillGains.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link
                      to={`/campaign/${rec.campaign._id}`}
                      className="w-full btn-primary py-2 text-sm text-center inline-block"
                    >
                      View Opportunity
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Recent Achievements
                </h2>
              </div>
              <Link
                to="/volunteer/badges"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View All Badges
              </Link>
            </div>

            <div className="flex overflow-x-auto space-x-4 pb-4">
              {recentBadges.map((badge, index) => (
                <motion.div
                  key={badge._id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex-shrink-0 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200 min-w-[200px]"
                >
                  <div className="text-center">
                    {badge.imageUrl ? (
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className="w-12 h-12 mx-auto mb-2"
                      />
                    ) : (
                      <div className="w-12 h-12 mx-auto mb-2 bg-yellow-400 rounded-full flex items-center justify-center">
                        <StarIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {badge.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {volunteerService.formatTimeAgo(badge.earnedAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Impact Summary */}
        {impactSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center mb-6">
              <ChartBarIcon className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Your Impact</h2>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {impactSummary.totalHours}
                  </div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {impactSummary.totalBeneficiaries}
                  </div>
                  <div className="text-sm text-gray-600">People Helped</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {impactSummary.verifiedRecords}
                  </div>
                  <div className="text-sm text-gray-600">Verified Records</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.round(impactSummary.totalImpactPoints)}
                  </div>
                  <div className="text-sm text-gray-600">Impact Points</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Volunteer Applications */}
        {applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                My Applications
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {applications.slice(0, 4).map((application) => (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {application.campaignId?.title || "Campaign"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Applied on {formatDate(application.registeredAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        application.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : application.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : application.status === "under-review"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {application.status === "registered"
                        ? "Pending Review"
                        : application.status === "under-review"
                          ? "Under Review"
                          : application.status.charAt(0).toUpperCase() +
                            application.status.slice(1)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <p className="mb-2">
                      <strong>Category:</strong>{" "}
                      {application.campaignId?.category || "N/A"}
                    </p>
                    {application.availability?.hoursPerWeek && (
                      <p className="mb-2">
                        <strong>Commitment:</strong>{" "}
                        {application.availability.hoursPerWeek} hours/week
                      </p>
                    )}
                    {application.volunteeringRecord?.totalHours > 0 && (
                      <p className="mb-2">
                        <strong>Hours Logged:</strong>{" "}
                        {application.volunteeringRecord.totalHours} hours
                      </p>
                    )}
                  </div>

                  {application.status === "approved" && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link
                        to={`/campaign/${application.campaignId?._id}`}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        View Campaign
                      </Link>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {applications.length > 4 && (
              <div className="text-center mt-6">
                <Link
                  to="/volunteer/applications"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All Applications ({applications.length})
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Recent Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Recent Campaigns
            </h2>
            <Link
              to="/volunteer/browse"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentCampaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={campaign.imageURL}
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <span className="capitalize">{campaign.type}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>Joined {formatDate(campaign.joinedDate)}</span>
                    </div>
                  </div>

                  {campaign.type === "volunteering" ? (
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>{campaign.hoursSpent} hours volunteered</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      <span>${campaign.donationAmount} donated</span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Link
                      to={`/campaign/${campaign.id}`}
                      className="flex-1 btn-outline py-2 text-sm text-center"
                    >
                      View Campaign
                    </Link>
                    {campaign.status === "active" && (
                      <button className="flex-1 btn-primary py-2 text-sm">
                        Continue Helping
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
