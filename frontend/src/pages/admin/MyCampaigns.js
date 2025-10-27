import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { campaignService } from '../../services/campaignService';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MyCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await campaignService.getMyCampaigns();

      if (response.success) {
        setCampaigns(response.data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      // Don't show error toast for authentication issues
      if (error.message && !error.message.includes('Access denied')) {
        toast.error('Failed to load campaigns');
      }
      setCampaigns([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await campaignService.deleteCampaign(campaignId);
        toast.success('Campaign deleted successfully');
        fetchCampaigns(); // Refresh the list
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Failed to delete campaign');
      }
    }
  };

  const handleEditCampaign = (campaignId) => {
    navigate(`/admin/edit-campaign/${campaignId}`);
  };

  const handleViewCampaign = (campaignId) => {
    navigate(`/campaign/${campaignId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading your campaigns..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
            <p className="mt-2 text-gray-600">
              Manage and track all your campaigns
            </p>
          </div>
          <Link
            to="/admin/create-campaign"
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Campaign
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="card overflow-hidden">
              <div className="relative">
                <img
                  src={campaign.imageURL}
                  alt={campaign.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {campaign.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {campaign.description}
                </p>

                {campaign.type === 'crowdfunding' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>{formatCurrency(campaign.raisedAmount)} raised</span>
                      <span>Goal: {formatCurrency(campaign.goalAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">
                    {campaign.volunteers} volunteers
                  </span>
                  <span className="text-sm text-gray-500 capitalize">
                    {campaign.category}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewCampaign(campaign._id)}
                    className="flex-1 btn-outline py-2 text-sm"
                  >
                    <EyeIcon className="w-4 h-4 mr-1 inline" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditCampaign(campaign._id)}
                    className="flex-1 btn-secondary py-2 text-sm"
                  >
                    <PencilIcon className="w-4 h-4 mr-1 inline" />
                    Edit
                  </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign._id)}
                      className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default MyCampaigns;
