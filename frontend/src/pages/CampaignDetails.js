import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { campaignService } from '../services/campaignService';
import SimplePaymentModal from '../components/SimplePaymentModal';
import {
  HeartIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarIcon,
  MapPinIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CampaignDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setIsLoading(true);
      const response = await campaignService.getCampaign(id);

      if (response.success) {
        setCampaign(response.data.campaign);
      } else {
        toast.error('Campaign not found');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setIsLoading(false);
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleJoinCampaign = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      return;
    }

    try {
      if (isJoined) {
        // Handle leaving campaign
        toast.success('Left campaign successfully');
      } else {
        // Handle joining campaign
        await campaignService.registerVolunteer(campaign._id);
        toast.success('Successfully joined the campaign!');
      }
      setIsJoined(!isJoined);
    } catch (error) {
      console.error('Error joining campaign:', error);
      toast.error('Failed to join campaign');
    }
  };

  const handleDonate = () => {
    if (!isAuthenticated) {
      // Redirect to login
      return;
    }

    if (campaign.type !== 'crowdfunding') {
      toast.error('This campaign does not accept donations');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh campaign data
    fetchCampaign();
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading campaign details..." />;
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h1>
          <p className="text-gray-600">The campaign you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const progressPercentage = campaign.goalAmount > 0 ? Math.round((campaign.raisedAmount / campaign.goalAmount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="card overflow-hidden">
            <div className="relative">
              <img
                src={campaign.imageURL}
                alt={campaign.title}
                className="w-full h-64 md:h-96 object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-800">
                  {campaign.type}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200">
                  <ShareIcon className="w-5 h-5 text-gray-700" />
                </button>
                <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200">
                  <BookmarkIcon className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {campaign.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-1" />
                      <span>{campaign.volunteers?.length || 0} volunteers</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>Ends {formatDate(campaign.endDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span>{campaign.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="capitalize">{campaign.category}</span>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    {campaign.description}
                  </p>
                </div>

                {/* Action Panel */}
                <div className="lg:w-80">
                  <div className="card p-6">
                    {campaign.type === 'crowdfunding' && (
                      <>
                        <div className="mb-6">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                              className="bg-primary-600 h-3 rounded-full"
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(campaign.raisedAmount)} raised
                            </span>
                            <span>Goal: {formatCurrency(campaign.goalAmount)}</span>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="text-center mb-4">
                            <div className="text-3xl font-bold text-gray-900">
                              {formatCurrency(campaign.raisedAmount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              raised of {formatCurrency(campaign.goalAmount)} goal
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (campaign.raisedAmount / campaign.goalAmount) * 100,
                                    100
                                  )}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleDonate}
                          className="w-full btn-primary py-3 mb-4"
                        >
                          <CurrencyDollarIcon className="w-5 h-5 mr-2 inline" />
                          Donate Now
                        </button>
                      </>
                    )}

                    {campaign.type === 'volunteering' && (
                      <button
                        onClick={handleJoinCampaign}
                        className={`w-full py-3 font-medium rounded-lg transition-colors duration-200 ${
                          isJoined
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'btn-primary'
                        }`}
                      >
                        <HeartIcon className="w-5 h-5 mr-2 inline" />
                        {isJoined ? 'Joined!' : 'Join Campaign'}
                      </button>
                    )}

                    <div className="text-center text-sm text-gray-500">
                      Organized by {campaign.createdBy.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Details</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What we're doing</h3>
                  <p className="text-gray-700">
                    This community garden will serve as a hub for environmental education and fresh food access.
                    We'll be building raised beds for vegetables, installing a rainwater collection system,
                    and creating educational signage about sustainable gardening practices.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How you can help</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Help with construction and setup</li>
                    <li>Plant seeds and maintain the garden</li>
                    <li>Lead educational workshops</li>
                    <li>Assist with community outreach</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project Start:</span>
                      <span className="font-medium">{formatDate(campaign.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Completion:</span>
                      <span className="font-medium">{formatDate(campaign.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6 mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">{campaign.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium capitalize">{campaign.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{campaign.location}</span>
                </div>
                {campaign.type === 'crowdfunding' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Raised:</span>
                      <span className="font-medium">{formatCurrency(campaign.raisedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goal:</span>
                      <span className="font-medium">{formatCurrency(campaign.goalAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Organizer</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {campaign.createdBy.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{campaign.createdBy.name}</p>
                  <p className="text-sm text-gray-600">Campaign Organizer</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <SimplePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        campaign={campaign}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CampaignDetails;
