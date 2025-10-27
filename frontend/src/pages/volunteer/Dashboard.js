import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  HeartIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { campaignService } from '../../services/campaignService';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    campaignsJoined: 0,
    hoursVolunteered: 0,
    donationsMade: 0,
    impactScore: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Get all campaigns to calculate volunteer stats
      const campaignsResponse = await campaignService.getCampaigns();

      if (campaignsResponse.success) {
        const allCampaigns = campaignsResponse.data.campaigns || [];

        // Calculate volunteer-specific stats
        const campaignsJoined = allCampaigns.filter(campaign =>
          campaign.volunteers?.some(volunteer => volunteer._id === user._id)
        ).length;

        // Calculate total donations made by this volunteer
        const donationsMade = allCampaigns.reduce((total, campaign) => {
          if (campaign.donations) {
            const volunteerDonations = campaign.donations.filter(
              donation => donation.volunteerId === user._id
            );
            return total + volunteerDonations.length;
          }
          return total;
        }, 0);

        // Calculate total amount donated
        const totalDonated = allCampaigns.reduce((total, campaign) => {
          if (campaign.donations) {
            const volunteerDonations = campaign.donations.filter(
              donation => donation.volunteerId === user._id
            );
            return total + volunteerDonations.reduce((sum, donation) => sum + donation.amount, 0);
          }
          return total;
        }, 0);

        // Calculate impact score based on activities
        const impactScore = Math.min(100, (campaignsJoined * 20) + (donationsMade * 5));

        setStats({
          campaignsJoined,
          hoursVolunteered: campaignsJoined * 8, // Estimate 8 hours per campaign
          donationsMade,
          impactScore,
          totalDonated
        });

        // Get recent campaigns the volunteer is involved in
        const volunteerCampaigns = allCampaigns.filter(campaign =>
          campaign.volunteers?.some(volunteer => volunteer._id === user._id)
        ).slice(0, 2);

        setRecentCampaigns(volunteerCampaigns);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                <p className="text-sm font-medium text-gray-600">Campaigns Joined</p>
                <p className="text-2xl font-bold text-gray-900">{stats.campaignsJoined}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hours Volunteered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hoursVolunteered}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Donations Made</p>
                <p className="text-2xl font-bold text-gray-900">{stats.donationsMade}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Impact Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.impactScore}%</p>
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
          </div>
        </motion.div>

        {/* Recent Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Recent Campaigns</h2>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
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

                  {campaign.type === 'volunteering' ? (
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
                    {campaign.status === 'active' && (
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
