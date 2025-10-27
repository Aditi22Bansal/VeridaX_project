import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { campaignService } from '../../services/campaignService';
import { vverseService } from '../../services/vverseService';
import {
  PlusIcon,
  XMarkIcon,
  InformationCircleIcon,
  UserGroupIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [formData, setFormData] = useState({
    campaignId: '',
    name: '',
    description: '',
    skills: [],
    requirements: {
      minVolunteers: 1,
      maxVolunteers: '',
      requiredSkills: [],
      experienceLevel: 'beginner'
    },
    settings: {
      isPublic: true,
      allowMemberInvites: true,
      requireApproval: false,
      allowFileSharing: true
    }
  });
  const [newSkill, setNewSkill] = useState('');
  const [newRequiredSkill, setNewRequiredSkill] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await campaignService.getCampaigns({ status: 'active' });

      if (response.success) {
        setCampaigns(response.data.campaigns || []);
      } else {
        console.warn('Campaigns data is not available:', response);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
      setCampaigns([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addRequiredSkill = () => {
    if (newRequiredSkill.trim() && !formData.requirements.requiredSkills.includes(newRequiredSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          requiredSkills: [...prev.requirements.requiredSkills, newRequiredSkill.trim()]
        }
      }));
      setNewRequiredSkill('');
    }
  };

  const removeRequiredSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        requiredSkills: prev.requirements.requiredSkills.filter(skill => skill !== skillToRemove)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.campaignId || !formData.name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const response = await vverseService.createRoom(formData);

      if (response.success) {
        toast.success('Room created successfully!');
        navigate(`/vverse/room/${response.data._id}`);
      } else {
        toast.error(response.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Project Room</h1>
                <p className="mt-1 text-gray-600">
                  Set up a virtual collaboration space for your campaign
                </p>
              </div>
              <button
                onClick={() => navigate('/vverse')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Campaign Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign *
              </label>
              <select
                name="campaignId"
                value={formData.campaignId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a campaign</option>
                {Array.isArray(campaigns) && campaigns.map((campaign) => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter room name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the purpose of this room"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Volunteers
                  </label>
                  <input
                    type="number"
                    name="requirements.minVolunteers"
                    value={formData.requirements.minVolunteers}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Volunteers
                  </label>
                  <input
                    type="number"
                    name="requirements.maxVolunteers"
                    value={formData.requirements.maxVolunteers}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newRequiredSkill}
                    onChange={(e) => setNewRequiredSkill(e.target.value)}
                    placeholder="Add required skill"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequiredSkill())}
                  />
                  <button
                    type="button"
                    onClick={addRequiredSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeRequiredSkill(skill)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="requirements.experienceLevel"
                  value={formData.requirements.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Room Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Public Room</label>
                      <p className="text-xs text-gray-500">Anyone can discover and join this room</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="settings.isPublic"
                    checked={formData.settings.isPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Allow Member Invites</label>
                      <p className="text-xs text-gray-500">Members can invite others to join</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="settings.allowMemberInvites"
                    checked={formData.settings.allowMemberInvites}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-504 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LockClosedIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Require Approval</label>
                      <p className="text-xs text-gray-500">New members need approval to join</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="settings.requireApproval"
                    checked={formData.settings.requireApproval}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/vverse')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Room'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateRoom;
