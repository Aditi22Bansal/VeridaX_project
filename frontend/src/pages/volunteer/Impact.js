import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  SparklesIcon,
  StarIcon,
  BoltIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { volunteerService } from '../../services/volunteerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Impact = () => {
  const { user } = useAuth();
  const [impactRecords, setImpactRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchImpactData();
    fetchBadges();
  }, [selectedPeriod, selectedType, pagination.currentPage]);

  const fetchImpactData = async () => {
    try {
      setIsLoading(true);

      const params = {
        page: pagination.currentPage,
        limit: 10
      };

      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      const response = await volunteerService.getImpactRecords(params);
      if (response.success) {
        setImpactRecords(response.data.impactRecords || []);
        setSummary(response.data.summary || {});
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching impact data:', error);
      toast.error('Failed to load impact data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await volunteerService.getBadges();
      if (response.success) {
        setBadges(response.data.badges || []);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const formatDate = (dateString) => {
    return volunteerService.formatDate(dateString);
  };

  const formatDateTime = (dateString) => {
    return volunteerService.formatDateTime(dateString);
  };

  const getVerificationStatusColor = (status) => {
    const statusInfo = volunteerService.formatVerificationStatus(status);
    return statusInfo.color;
  };

  const getVerificationIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      case 'disputed':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBadgeRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'from-purple-400 to-pink-400 text-white';
      case 'epic':
        return 'from-indigo-400 to-purple-400 text-white';
      case 'rare':
        return 'from-blue-400 to-indigo-400 text-white';
      case 'uncommon':
        return 'from-green-400 to-blue-400 text-white';
      default:
        return 'from-gray-300 to-gray-400 text-gray-800';
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  if (isLoading && impactRecords.length === 0) {
    return <LoadingSpinner text="Loading your impact data..." />;
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Impact</h1>
              <p className="mt-2 text-gray-600">
                Track your volunteering contributions and achievements.
              </p>
            </div>
            <Link
              to="/volunteer/log-hours"
              className="btn-primary flex items-center"
            >
              <BoltIcon className="w-5 h-5 mr-2" />
              Log Hours
            </Link>
          </div>
        </motion.div>

        {/* Impact Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Hours</p>
                <p className="text-3xl font-bold text-blue-900">{summary.totalHours || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">People Helped</p>
                <p className="text-3xl font-bold text-green-900">{summary.totalBeneficiaries || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Impact Points</p>
                <p className="text-3xl font-bold text-purple-900">{Math.round(summary.totalImpactPoints || 0)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Verified Records</p>
                <p className="text-3xl font-bold text-orange-900">{summary.verifiedRecords || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Your Badges</h2>
              </div>
              <span className="text-sm text-gray-600">
                {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.slice(0, 12).map((badge, index) => (
                <motion.div
                  key={badge._id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                  className={`relative p-4 rounded-xl bg-gradient-to-br ${getBadgeRarityColor(badge.rarity)} shadow-lg hover:shadow-xl transition-shadow duration-300`}
                >
                  <div className="text-center">
                    {badge.imageUrl ? (
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className="w-10 h-10 mx-auto mb-2 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 mx-auto mb-2 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                        <StarIcon className="w-5 h-5" />
                      </div>
                    )}
                    <h4 className="font-semibold text-sm">{badge.name}</h4>
                    <p className="text-xs opacity-90 mt-1">{badge.category}</p>
                  </div>

                  {badge.rarity && badge.rarity !== 'common' && (
                    <div className="absolute top-1 right-1">
                      <span className="text-xs bg-white bg-opacity-30 px-1 py-0.5 rounded capitalize">
                        {badge.rarity}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Activities</option>
              <option value="volunteering-hours">Volunteering Hours</option>
              <option value="skill-contribution">Skill Contribution</option>
              <option value="leadership">Leadership</option>
              <option value="training">Training</option>
              <option value="event-participation">Event Participation</option>
            </select>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </motion.div>

        {/* Impact Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Impact Records</h2>
            <span className="text-sm text-gray-600">
              {pagination.totalRecords || impactRecords.length} record{impactRecords.length !== 1 ? 's' : ''}
            </span>
          </div>

          {impactRecords.length > 0 ? (
            <div className="space-y-4">
              {impactRecords.map((record, index) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="card p-6 hover:shadow-medium transition-shadow duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.impact.description}
                          </h3>
                          <div className="flex items-center mt-1 space-x-4">
                            <span className="text-sm text-gray-600">
                              {record.campaignId?.title}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-600 capitalize">
                              {record.impact.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationStatusColor(record.verification.status)}`}>
                            <span className="flex items-center">
                              {getVerificationIcon(record.verification.status)}
                              <span className="ml-1 capitalize">
                                {record.verification.status}
                              </span>
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {record.timeRecord.hoursContributed}
                          </div>
                          <div className="text-xs text-gray-600">Hours</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {record.impact.beneficiaries.directCount}
                          </div>
                          <div className="text-xs text-gray-600">People Helped</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(record.scoring.totalScore)}
                          </div>
                          <div className="text-xs text-gray-600">Impact Points</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {record.skillsUtilized?.length || 0}
                          </div>
                          <div className="text-xs text-gray-600">Skills Used</div>
                        </div>
                      </div>

                      {record.skillsUtilized && record.skillsUtilized.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Skills utilized:</p>
                          <div className="flex flex-wrap gap-2">
                            {record.skillsUtilized.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                              >
                                {skill.skill} ({skill.level})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {formatDateTime(record.timeRecord.startTime)}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {Math.round((new Date(record.timeRecord.endTime) - new Date(record.timeRecord.startTime)) / (1000 * 60 * 60 * 24))} day{Math.round((new Date(record.timeRecord.endTime) - new Date(record.timeRecord.startTime)) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''} ago
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {record.blockchain?.isRecorded && (
                            <span className="flex items-center text-green-600">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              <span className="text-xs">Blockchain Verified</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Impact Records Yet</h3>
              <p className="text-gray-600 mb-6">
                Start logging your volunteer hours to track your impact.
              </p>
              <Link
                to="/volunteer/log-hours"
                className="btn-primary inline-flex items-center"
              >
                <BoltIcon className="w-5 h-5 mr-2" />
                Log Your First Hours
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between mt-8"
          >
            <div className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Impact;
