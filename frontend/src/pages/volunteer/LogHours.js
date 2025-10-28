import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  SparklesIcon,
  CameraIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { campaignService } from '../../services/campaignService';
import { volunteerService } from '../../services/volunteerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const LogHours = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [skills, setSkills] = useState([]);
  const [formData, setFormData] = useState({
    campaignId: '',
    opportunityId: '',
    applicationId: '',
    startTime: '',
    endTime: '',
    breakDuration: 0,
    activity: '',
    description: '',
    skillsUtilized: [],
    beneficiariesImpacted: 1,
    evidence: []
  });
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    calculateHours();
  }, [formData.startTime, formData.endTime, formData.breakDuration]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // Get campaigns where user is a volunteer
      const campaignsResponse = await campaignService.getCampaigns();
      if (campaignsResponse.success) {
        const userCampaigns = campaignsResponse.data.campaigns.filter(campaign =>
          campaign.volunteers?.some(volunteer => volunteer._id === user._id)
        );
        setCampaigns(userCampaigns);
      }

      // Get user applications
      const applicationsResponse = await volunteerService.getApplications({
        status: 'accepted'
      });
      if (applicationsResponse.success) {
        setApplications(applicationsResponse.data.applications || []);
      }

      // Get user profile for skills
      const profileResponse = await volunteerService.getProfile();
      if (profileResponse.success) {
        setSkills(profileResponse.data.profile.skills || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHours = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (end > start) {
        const totalMinutes = (end - start) / (1000 * 60);
        const effectiveMinutes = totalMinutes - (formData.breakDuration || 0);
        const hours = Math.max(0, effectiveMinutes / 60);
        setCalculatedHours(Math.round(hours * 100) / 100);
      } else {
        setCalculatedHours(0);
      }
    } else {
      setCalculatedHours(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSkillToggle = (skillName) => {
    setFormData(prev => ({
      ...prev,
      skillsUtilized: prev.skillsUtilized.includes(skillName)
        ? prev.skillsUtilized.filter(s => s !== skillName)
        : [...prev.skillsUtilized, skillName]
    }));
  };

  const handleEvidenceAdd = (evidence) => {
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, evidence]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.campaignId) {
      newErrors.campaignId = 'Please select a campaign';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }

      const diffInHours = (end - start) / (1000 * 60 * 60);
      if (diffInHours > 24) {
        newErrors.endTime = 'Cannot log more than 24 hours in a single entry';
      }
    }

    if (!formData.activity.trim()) {
      newErrors.activity = 'Activity description is required';
    }

    if (formData.breakDuration < 0 || formData.breakDuration > 480) {
      newErrors.breakDuration = 'Break duration must be between 0 and 480 minutes';
    }

    if (formData.beneficiariesImpacted < 0) {
      newErrors.beneficiariesImpacted = 'Number of beneficiaries cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setIsLoading(true);

      const hourData = {
        ...formData,
        skillsUtilized: formData.skillsUtilized.map(skillName => ({
          skill: skillName,
          level: skills.find(s => s.name === skillName)?.level || 'beginner',
          hoursApplied: calculatedHours
        }))
      };

      const response = await volunteerService.logHours(hourData);

      if (response.success) {
        toast.success('Hours logged successfully!');
        navigate('/volunteer/impact');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error logging hours:', error);
      toast.error(error.message || 'Failed to log hours');
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getMaxDateTime = () => {
    return getTodayDateTime();
  };

  if (isLoading && campaigns.length === 0) {
    return <LoadingSpinner text="Loading campaigns..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Log Volunteer Hours</h1>
          <p className="mt-2 text-gray-600">
            Record your volunteering activities and track your impact.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Campaign Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign *
                </label>
                <select
                  id="campaignId"
                  name="campaignId"
                  value={formData.campaignId}
                  onChange={handleInputChange}
                  className={`input-field ${errors.campaignId ? 'border-red-300' : ''}`}
                  required
                >
                  <option value="">Select a campaign</option>
                  {campaigns.map(campaign => (
                    <option key={campaign._id} value={campaign._id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
                {errors.campaignId && (
                  <p className="mt-1 text-sm text-red-600">{errors.campaignId}</p>
                )}
              </div>

              <div>
                <label htmlFor="applicationId" className="block text-sm font-medium text-gray-700 mb-2">
                  Related Application (Optional)
                </label>
                <select
                  id="applicationId"
                  name="applicationId"
                  value={formData.applicationId}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">No specific application</option>
                  {applications
                    .filter(app => app.campaignId._id === formData.campaignId)
                    .map(app => (
                      <option key={app._id} value={app._id}>
                        {app.opportunityId?.title || 'General Application'}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Time Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  max={getMaxDateTime()}
                  className={`input-field ${errors.startTime ? 'border-red-300' : ''}`}
                  required
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  max={getMaxDateTime()}
                  className={`input-field ${errors.endTime ? 'border-red-300' : ''}`}
                  required
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>

              <div>
                <label htmlFor="breakDuration" className="block text-sm font-medium text-gray-700 mb-2">
                  Break Duration (minutes)
                </label>
                <input
                  type="number"
                  id="breakDuration"
                  name="breakDuration"
                  value={formData.breakDuration}
                  onChange={handleInputChange}
                  min="0"
                  max="480"
                  className={`input-field ${errors.breakDuration ? 'border-red-300' : ''}`}
                />
                {errors.breakDuration && (
                  <p className="mt-1 text-sm text-red-600">{errors.breakDuration}</p>
                )}
              </div>
            </div>

            {/* Calculated Hours Display */}
            {calculatedHours > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">
                    Total Hours: {calculatedHours} hours
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Activity Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Information</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Description *
                </label>
                <input
                  type="text"
                  id="activity"
                  name="activity"
                  value={formData.activity}
                  onChange={handleInputChange}
                  placeholder="e.g., Teaching mathematics to children"
                  className={`input-field ${errors.activity ? 'border-red-300' : ''}`}
                  required
                />
                {errors.activity && (
                  <p className="mt-1 text-sm text-red-600">{errors.activity}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide more details about what you accomplished during this volunteering session..."
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="beneficiariesImpacted" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of People Directly Helped
                </label>
                <input
                  type="number"
                  id="beneficiariesImpacted"
                  name="beneficiariesImpacted"
                  value={formData.beneficiariesImpacted}
                  onChange={handleInputChange}
                  min="0"
                  className={`input-field ${errors.beneficiariesImpacted ? 'border-red-300' : ''}`}
                />
                {errors.beneficiariesImpacted && (
                  <p className="mt-1 text-sm text-red-600">{errors.beneficiariesImpacted}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Skills Utilized */}
          {skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Utilized</h2>
              <p className="text-gray-600 mb-4">
                Select the skills you used during this volunteering session.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {skills.map(skill => (
                  <label
                    key={skill.name}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={formData.skillsUtilized.includes(skill.name)}
                      onChange={() => handleSkillToggle(skill.name)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {skill.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 capitalize">
                        ({skill.level})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* Evidence (Future Enhancement) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Evidence (Optional)</h2>
            <p className="text-gray-600 mb-4">
              Add photos or documents to verify your volunteering activity.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Photo and document upload coming soon!
              </p>
              <p className="text-xs text-gray-400 mt-2">
                For now, your hours will be recorded as self-reported.
              </p>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end space-x-4"
          >
            <button
              type="button"
              onClick={() => navigate('/volunteer/dashboard')}
              className="btn-outline px-8 py-3"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-8 py-3 flex items-center"
              disabled={isLoading || calculatedHours === 0}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging Hours...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Log {calculatedHours} Hours
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Information Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <SparklesIcon className="w-6 h-6 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900">Impact Tracking</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Your logged hours will be automatically converted to impact points and may earn you badges based on your contributions.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <CheckCircleIcon className="w-6 h-6 text-green-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-semibold text-green-900">Verification</h3>
                <p className="text-green-700 text-sm mt-1">
                  Campaign organizers may verify your hours. Verified hours carry more weight in your impact score.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LogHours;
