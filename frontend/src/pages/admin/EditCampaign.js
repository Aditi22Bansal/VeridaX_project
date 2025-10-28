import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { campaignService } from '../../services/campaignService';
import { uploadService } from '../../services/uploadService';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EditCampaign = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm();

  const campaignType = watch('type');

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setIsLoadingCampaign(true);
      const response = await campaignService.getCampaign(id);

      if (response.success) {
        const campaignData = response.data.campaign;
        setCampaign(campaignData);

        // Check if user owns this campaign
        const currentUserId = (user && (user._id || user.id)) || '';
        if ((campaignData.createdBy && (campaignData.createdBy._id || campaignData.createdBy.id)) !== currentUserId) {
          toast.error('You can only edit your own campaigns');
          navigate('/admin/my-campaigns');
          return;
        }

        // Set form values
        reset({
          title: campaignData.title,
          description: campaignData.description,
          type: campaignData.type,
          goalAmount: campaignData.goalAmount,
          startDate: campaignData.startDate ? new Date(campaignData.startDate).toISOString().split('T')[0] : '',
          endDate: campaignData.endDate ? new Date(campaignData.endDate).toISOString().split('T')[0] : '',
          category: campaignData.category,
          location: campaignData.location || ''
        });

        // Set image preview
        if (campaignData.imageURL) {
          setImagePreview(campaignData.imageURL);
        }
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Failed to load campaign');
      navigate('/admin/my-campaigns');
    } finally {
      setIsLoadingCampaign(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      const response = await uploadService.uploadImage(file);
      return response.imageURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let imageURL = campaign.imageURL; // Keep existing image by default

      // Upload new image if one was selected
      if (imageFile) {
        try {
          imageURL = await uploadImage(imageFile);
        } catch (uploadError) {
          console.error('Image upload failed, keeping existing image:', uploadError);
          toast.error('Image upload failed; keeping existing image');
          imageURL = campaign.imageURL;
        }
      }

      const campaignData = {
        ...data,
        imageURL,
        goalAmount: campaignType === 'crowdfunding' ? parseFloat(data.goalAmount) : 0
      };

      // Validate required fields
      if (!campaignData.title || !campaignData.description) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      if (campaignType === 'crowdfunding' && (!campaignData.goalAmount || campaignData.goalAmount <= 0)) {
        toast.error('Please enter a valid goal amount for crowdfunding campaigns');
        setIsLoading(false);
        return;
      }

      const response = await campaignService.updateCampaign(id, campaignData);

      if (response.success) {
        toast.success('Campaign updated successfully!');
        navigate('/admin/my-campaigns');
      } else {
        toast.error(response.message || 'Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error(error.message || 'Failed to update campaign');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCampaign) {
    return <LoadingSpinner text="Loading campaign..." />;
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h1>
          <button
            onClick={() => navigate('/admin/my-campaigns')}
            className="btn-primary"
          >
            Back to My Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner text="Updating your campaign..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
          <p className="mt-2 text-gray-600">
            Update your campaign details and make changes as needed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Campaign Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Campaign preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload a new image or keep the current one
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Campaign Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary-300">
                  <input
                    type="radio"
                    value="volunteering"
                    {...register('type', { required: 'Please select a campaign type' })}
                    className="sr-only"
                  />
                  <div className={`${watch('type') === 'volunteering' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">👥</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Volunteering</h3>
                        <p className="text-sm text-gray-600">Recruit volunteers for your cause</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary-300">
                  <input
                    type="radio"
                    value="crowdfunding"
                    {...register('type', { required: 'Please select a campaign type' })}
                    className="sr-only"
                  />
                  <div className={`${watch('type') === 'crowdfunding' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">💰</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Crowdfunding</h3>
                        <p className="text-sm text-gray-600">Raise funds for your project</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Campaign Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title
              </label>
              <input
                id="title"
                type="text"
                className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter a compelling campaign title"
                {...register('title', {
                  required: 'Campaign title is required',
                  minLength: {
                    value: 5,
                    message: 'Title must be at least 5 characters'
                  },
                  maxLength: {
                    value: 100,
                    message: 'Title cannot exceed 100 characters'
                  }
                })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Campaign Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Description
              </label>
              <textarea
                id="description"
                rows={6}
                className={`input-field ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Describe your campaign in detail..."
                {...register('description', {
                  required: 'Campaign description is required',
                  minLength: {
                    value: 20,
                    message: 'Description must be at least 20 characters'
                  },
                  maxLength: {
                    value: 2000,
                    message: 'Description cannot exceed 2000 characters'
                  }
                })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Goal Amount (for crowdfunding) */}
            {campaignType === 'crowdfunding' && (
              <div>
                <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Amount (INR)
                </label>
                <input
                  id="goalAmount"
                  type="number"
                  min="1"
                  className={`input-field ${errors.goalAmount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your fundraising goal"
                  {...register('goalAmount', {
                    required: campaignType === 'crowdfunding' ? 'Goal amount is required' : false,
                    min: {
                      value: 1,
                      message: 'Goal amount must be at least $1'
                    }
                  })}
                />
                {errors.goalAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.goalAmount.message}</p>
                )}
              </div>
            )}

            {/* Campaign Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  className={`input-field ${errors.startDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  {...register('startDate', {
                    required: 'Start date is required'
                  })}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  className={`input-field ${errors.endDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  {...register('endDate', {
                    required: 'End date is required'
                  })}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                className={`input-field ${errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                {...register('category', {
                  required: 'Category is required'
                })}
              >
                <option value="">Select a category</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="environment">Environment</option>
                <option value="community">Community</option>
                <option value="disaster-relief">Disaster Relief</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                id="location"
                type="text"
                className="input-field"
                placeholder="City, State, Country"
                {...register('location', {
                  maxLength: {
                    value: 100,
                    message: 'Location cannot exceed 100 characters'
                  }
                })}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/my-campaigns')}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2"
              >
                Update Campaign
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditCampaign;
