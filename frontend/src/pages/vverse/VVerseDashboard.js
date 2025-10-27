import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { vverseService } from '../../services/vverseService';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BellIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
  HeartIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const VVerseDashboard = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all campaigns
      const campaignsData = await vverseService.getCampaigns({ status: 'active' });
      if (campaignsData.success && Array.isArray(campaignsData.data.campaigns)) {
        setCampaigns(campaignsData.data.campaigns);
      } else {
        setCampaigns([]);
      }

      // Fetch user's rooms
      const roomsData = await vverseService.getRooms();
      if (roomsData.success && Array.isArray(roomsData.data)) {
        setRooms(roomsData.data);
      } else {
        setRooms([]);
      }

      // Fetch notifications
      const notificationsData = await vverseService.getNotifications({ limit: 5 });
      if (notificationsData.success && Array.isArray(notificationsData.data)) {
        setNotifications(notificationsData.data);
      } else {
        setNotifications([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load VVerse data');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const response = await vverseService.joinRoom(roomId);

      if (response.success) {
        toast.success('Successfully joined the room!');
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error(error.message || 'Failed to join room. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      education: 'bg-blue-100 text-blue-800',
      healthcare: 'bg-red-100 text-red-800',
      environment: 'bg-green-100 text-green-800',
      community: 'bg-yellow-100 text-yellow-800',
      'disaster-relief': 'bg-gray-100 text-gray-800',
      other: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingSpinner text="Loading VVerse..." />;
  }

  const categories = [
    'all',
    'education',
    'healthcare',
    'environment',
    'community',
    'disaster-relief',
    'other'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VVerse Community</h1>
          <p className="text-gray-600">Connect with campaigns and join real-time discussions</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              {/* Campaign Image */}
              <div className="relative h-48">
                <img
                  src={campaign.imageURL}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(campaign.category)}`}>
                    {campaign.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.type === 'volunteering'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {campaign.type}
                  </span>
                </div>
              </div>

              {/* Campaign Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {campaign.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {campaign.description}
                </p>

                {/* Progress Bar for Crowdfunding */}
                {campaign.type === 'crowdfunding' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
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

                {/* Campaign Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    <span>{campaign.volunteers?.length || 0} volunteers</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span>{formatDate(campaign.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/campaign/${campaign._id}`}
                    className="flex-1 btn-outline py-2 text-sm text-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => {
                      // Debug: Check campaign object
                      console.log('Campaign object:', campaign);
                      console.log('Campaign ID:', campaign._id);
                      console.log('Campaign title:', campaign.title);
                      
                      if (campaign._id) {
                        // Navigate to general chat room for this campaign
                        console.log('Navigating to room:', `/vverse/room/${campaign._id}`);
                        window.location.href = `/vverse/room/${campaign._id}`;
                      } else {
                        console.error('Campaign ID is undefined! Using fallback room.');
                        // Use a fallback room ID for testing
                        const fallbackRoomId = '68fce7c32353f54aa52c27fb'; // Known room ID
                        console.log('Using fallback room:', `/vverse/room/${fallbackRoomId}`);
                        window.location.href = `/vverse/room/${fallbackRoomId}`;
                      }
                    }}
                    className="flex-1 btn-primary py-2 text-sm"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1 inline" />
                    Join Chat
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Campaigns */}
        {filteredCampaigns.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search criteria or browse all campaigns.'
                : 'No active campaigns are available at the moment.'
              }
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VVerseDashboard;