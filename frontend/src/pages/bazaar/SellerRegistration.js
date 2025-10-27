import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const SellerRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    bio: '',
    location: '',
    businessInfo: {
      businessType: 'individual'
    },
    contactInfo: {
      phone: '',
      email: user?.email || '',
      website: ''
    },
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: ''
    },
    policies: {
      returnPolicy: '',
      shippingPolicy: '',
      processingTime: 3
    },
    specialties: []
  });

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSpecialtyAdd = (specialty) => {
    if (specialty.trim() && !formData.specialties.includes(specialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty.trim()]
      }));
    }
  };

  const handleSpecialtyRemove = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/bazaar/sellers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // If user already has seller role, they can go directly to dashboard
        // Otherwise, they need to wait for approval
        if (user?.role === 'seller') {
          navigate('/bazaar/seller');
        } else {
          alert('Seller registration submitted! Your account is pending approval.');
          navigate('/bazaar');
        }
      } else {
        alert('Error registering as seller: ' + data.message);
      }
    } catch (error) {
      console.error('Error registering seller:', error);
      alert('Error registering as seller. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    { value: 'individual', label: 'Individual Seller' },
    { value: 'small-business', label: 'Small Business' },
    { value: 'cooperative', label: 'Cooperative' },
    { value: 'non-profit', label: 'Non-Profit Organization' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Become a Seller</h1>
            <p className="text-gray-600 mt-2">
              Join our community of sustainable sellers and start selling your handmade products.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.shopName}
                      onChange={(e) => handleInputChange('shopName', e.target.value)}
                      className="w-full pl-10 input-field"
                      placeholder="Enter your shop name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <div className="relative">
                    <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.businessInfo.businessType}
                      onChange={(e) => handleInputChange('businessInfo.businessType', e.target.value)}
                      className="w-full pl-10 input-field"
                    >
                      {businessTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Bio *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full input-field"
                  placeholder="Tell us about your shop, products, and what makes you unique..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full pl-10 input-field"
                    placeholder="City, State, Country"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.contactInfo.phone}
                      onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                      className="w-full pl-10 input-field"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.contactInfo.email}
                      onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                      className="w-full pl-10 input-field"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative">
                  <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.contactInfo.website}
                    onChange={(e) => handleInputChange('contactInfo.website', e.target.value)}
                    className="w-full pl-10 input-field"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                    className="w-full input-field"
                    placeholder="@yourusername"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                    className="w-full input-field"
                    placeholder="Your Facebook Page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => handleInputChange('socialMedia.twitter', e.target.value)}
                    className="w-full input-field"
                    placeholder="@yourusername"
                  />
                </div>
              </div>
            </div>

            {/* Shop Policies */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shop Policies</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Policy
                  </label>
                  <textarea
                    rows={3}
                    value={formData.policies.returnPolicy}
                    onChange={(e) => handleInputChange('policies.returnPolicy', e.target.value)}
                    className="w-full input-field"
                    placeholder="Describe your return and refund policy..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Policy
                  </label>
                  <textarea
                    rows={3}
                    value={formData.policies.shippingPolicy}
                    onChange={(e) => handleInputChange('policies.shippingPolicy', e.target.value)}
                    className="w-full input-field"
                    placeholder="Describe your shipping methods and timelines..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.policies.processingTime}
                    onChange={(e) => handleInputChange('policies.processingTime', parseInt(e.target.value))}
                    className="w-full input-field"
                  />
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h2>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Add a specialty (e.g., handmade jewelry, eco-friendly products)"
                    className="w-full input-field"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSpecialtyAdd(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                {formData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => handleSpecialtyRemove(specialty)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/bazaar')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register as Seller'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerRegistration;
