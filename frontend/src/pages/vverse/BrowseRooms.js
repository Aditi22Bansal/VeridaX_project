import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { vverseService } from '../../services/vverseService';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const BrowseRooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    experienceLevel: 'all',
    hasSpace: false
  });
  const [sortBy, setSortBy] = useState('lastActivity');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);

      // Fetch recommended rooms using VVerse service
      const response = await vverseService.getRecommendedRooms({ limit: 50 });

      if (response.success && Array.isArray(response.data)) {
        setRooms(response.data);
      } else {
        console.warn('Rooms data is not an array:', response);
        setRooms([]);
        if (response.message) {
          toast.error(response.message);
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const response = await vverseService.joinRoom(roomId);

      if (response.success) {
        toast.success('Successfully joined the room!');
        fetchRooms(); // Refresh rooms
      } else {
        toast.error(response.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Error joining room. Please try again.');
    }
  };

  const filteredRooms = Array.isArray(rooms) ? rooms.filter(room => {
    // Search filter
    if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !room.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && room.status !== filters.status) {
      return false;
    }

    // Experience level filter
    if (filters.experienceLevel !== 'all' && room.requirements.experienceLevel !== filters.experienceLevel) {
      return false;
    }

    // Has space filter
    if (filters.hasSpace && room.requirements.maxVolunteers &&
        room.memberCount >= room.requirements.maxVolunteers) {
      return false;
    }

    return true;
  }) : [];

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'members':
        return b.memberCount - a.memberCount;
      case 'activity':
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      default:
        return new Date(b.lastActivity) - new Date(a.lastActivity);
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner text="Loading rooms..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Project Rooms</h1>
              <p className="mt-2 text-gray-600">
                Discover and join virtual collaboration spaces
              </p>
            </div>
            <Link
              to="/vverse/rooms/create"
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Room
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center space-x-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={filters.experienceLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasSpace}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasSpace: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Has Space</span>
                </label>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="activity">Sort by Activity</option>
                <option value="name">Sort by Name</option>
                <option value="members">Sort by Members</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {Array.isArray(sortedRooms) ? sortedRooms.length : 0} of {Array.isArray(rooms) ? rooms.length : 0} rooms
          </p>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.isArray(sortedRooms) && sortedRooms.length > 0 ? (
            sortedRooms.map((room) => (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Room Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {room.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {room.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {room.settings.isPublic ? (
                        <GlobeAltIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <LockClosedIcon className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        room.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                  </div>

                  {/* Room Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-1" />
                      <span>{room.memberCount} members</span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>{formatDate(room.lastActivity)}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  {room.skills && room.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {room.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {room.skills.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{room.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  <div className="mb-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Experience: {room.requirements.experienceLevel}</span>
                      {room.requirements.maxVolunteers && (
                        <span>Max: {room.requirements.maxVolunteers}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/vverse/room/${room._id}`}
                      className="flex-1 btn-outline py-2 text-sm text-center"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleJoinRoom(room._id)}
                      className="flex-1 btn-primary py-2 text-sm"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filters.status !== 'all' || filters.experienceLevel !== 'all' || filters.hasSpace
                  ? 'Try adjusting your search criteria'
                  : 'No public rooms are available at the moment'}
              </p>
              <Link
                to="/vverse/rooms/create"
                className="btn-primary"
              >
                Create First Room
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseRooms;
