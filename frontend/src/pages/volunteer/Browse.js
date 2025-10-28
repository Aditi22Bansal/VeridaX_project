import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { campaignService } from "../../services/campaignService";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "react-hot-toast";

const VolunteerBrowse = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, [searchTerm, selectedType, selectedCategory]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const params = {};

      if (searchTerm) params.search = searchTerm;
      if (selectedType !== "all") params.type = selectedType;
      if (selectedCategory !== "all") params.category = selectedCategory;

      const response = await campaignService.getCampaigns(params);

      if (response.success) {
        setCampaigns(response.data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    "all",
    "education",
    "healthcare",
    "environment",
    "community",
    "disaster-relief",
    "other",
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTypeColor = (type) => {
    return type === "volunteering"
      ? "bg-purple-100 text-purple-800"
      : "bg-orange-100 text-orange-800";
  };

  const getCategoryColor = (category) => {
    const colors = {
      education: "bg-blue-100 text-blue-800",
      healthcare: "bg-red-100 text-red-800",
      environment: "bg-green-100 text-green-800",
      community: "bg-yellow-100 text-yellow-800",
      "disaster-relief": "bg-gray-100 text-gray-800",
      other: "bg-indigo-100 text-indigo-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleLearnMore = (campaignId) => {
    navigate(`/campaign/${campaignId}`);
  };

  const handleDonate = (campaign) => {
    if (!isAuthenticated) {
      toast.error("Please log in to make a donation");
      navigate("/auth/login");
      return;
    }

    if (campaign.type !== "crowdfunding") {
      toast.error("This campaign does not accept donations");
      return;
    }

    navigate(`/campaign/${campaign._id}`);
  };

  const handleVolunteer = (campaign) => {
    if (!isAuthenticated) {
      toast.error("Please log in to volunteer");
      navigate("/auth/login");
      return;
    }

    navigate(`/campaign/${campaign._id}`);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading campaigns..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Browse Campaigns</h1>
          <p className="mt-2 text-gray-600">
            Discover meaningful opportunities to make a difference in your
            community.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-soft p-6 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search campaigns
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search by title or description..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type
              </label>
              <select
                id="type"
                className="input-field"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="volunteering">Volunteering</option>
                <option value="crowdfunding">Crowdfunding</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                className="input-field"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all"
                      ? "All Categories"
                      : category.charAt(0).toUpperCase() +
                        category.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-gray-600">
            Showing {campaigns.length} campaign
            {campaigns.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Campaigns Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card overflow-hidden hover:shadow-medium transition-shadow duration-300"
            >
              <div className="relative">
                <img
                  src={campaign.imageURL}
                  alt={campaign.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(campaign.type)}`}
                  >
                    {campaign.type}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(campaign.category)}`}
                  >
                    {campaign.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {campaign.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {campaign.description}
                </p>

                {campaign.type === "crowdfunding" && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          (campaign.raisedAmount / campaign.goalAmount) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>
                        {formatCurrency(campaign.raisedAmount)} raised
                      </span>
                      <span>Goal: {formatCurrency(campaign.goalAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <span>{campaign.volunteers?.length || 0} volunteers</span>
                  </div>
                  <div className="flex items-center">
                    <span>{campaign.location}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLearnMore(campaign._id)}
                    className="flex-1 btn-outline py-2 text-sm"
                  >
                    Learn More
                  </button>
                  {campaign.type === "volunteering" ? (
                    <button
                      onClick={() => handleVolunteer(campaign)}
                      className="flex-1 btn-primary py-2 text-sm"
                    >
                      Volunteer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDonate(campaign)}
                      className="flex-1 btn-primary py-2 text-sm"
                    >
                      Donate
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {campaigns.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or browse all campaigns.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedType("all");
                setSelectedCategory("all");
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VolunteerBrowse;
