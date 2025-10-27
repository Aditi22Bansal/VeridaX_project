import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { campaignService } from '../../services/campaignService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalVolunteers: 0,
    totalRaised: 0,
    activeCampaigns: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch stats and recent campaigns in parallel
      const [statsData, campaignsData] = await Promise.all([
        campaignService.getDashboardStats().catch(() => ({ success: true, data: { totalCampaigns: 0, totalVolunteers: 0, totalRaised: 0, activeCampaigns: 0 } })),
        campaignService.getMyCampaigns().catch(() => ({ success: true, data: { campaigns: [] } }))
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (campaignsData.success) {
        // Get only recent campaigns (last 6)
        const recentCampaigns = campaignsData.data.campaigns.slice(0, 6);
        setCampaigns(recentCampaigns);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error toast for authentication issues
      if (error.message && !error.message.includes('Access denied')) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCampaign = (campaignId) => {
    navigate(`/campaign/${campaignId}`);
  };

  const handleEditCampaign = (campaignId) => {
    navigate(`/admin/edit-campaign/${campaignId}`);
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await campaignService.deleteCampaign(campaignId);
        toast.success('Campaign deleted successfully');
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Failed to delete campaign');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getTypeColor = (type) => {
    return type === 'volunteering'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-orange-100 text-orange-800';
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
            Here's an overview of your campaigns and impact.
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
                <ChartBarIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Volunteers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVolunteers}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Raised</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRaised)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
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
              to="/admin/create-campaign"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Campaign
            </Link>
            <Link
              to="/admin/my-campaigns"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              View All Campaigns
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
            <h2 className="text-2xl font-bold text-gray-900">Recent Campaigns</h2>
            <Link
              to="/admin/my-campaigns"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={`${campaign._id || campaign.id || index}`}
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(campaign.type)}`}>
                      {campaign.type}
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

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{(() => {
                        const goal = Number(campaign.goalAmount) || 0;
                        const raised = Number(campaign.raisedAmount) || 0;
                        const percent = goal > 0 ? Math.round((raised / goal) * 100) : 0;
                        return `${percent}%`;
                      })()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: (() => {
                            const goal = Number(campaign.goalAmount) || 0;
                            const raised = Number(campaign.raisedAmount) || 0;
                            const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
                            return `${percent}%`;
                          })()
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>{formatCurrency(campaign.raisedAmount || 0)} raised</span>
                      <span>Goal: {formatCurrency(campaign.goalAmount || 0)}</span>
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-1" />
                      <span>{campaign.volunteers} volunteers</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>Ends {formatDate(campaign.endDate)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button onClick={() => handleViewCampaign(campaign._id)} className="flex-1 btn-outline py-2 text-sm">
                      <EyeIcon className="w-4 h-4 mr-1 inline" />
                      View
                    </button>
                    <button onClick={() => handleEditCampaign(campaign._id)} className="flex-1 btn-secondary py-2 text-sm">
                      <PencilIcon className="w-4 h-4 mr-1 inline" />
                      Edit
                    </button>
                    <button onClick={() => handleDeleteCampaign(campaign._id)} className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200">
                      <TrashIcon className="w-4 h-4" />
                    </button>
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

export default AdminDashboard;
