import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const SellerOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to VeridaBazaar!',
      description: 'You\'re now a seller on our sustainable marketplace. Let\'s get your shop set up.',
      icon: ShoppingBagIcon,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Complete Your Profile',
      description: 'Set up your shop name, bio, and policies to attract customers.',
      icon: UserGroupIcon,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Add Your First Product',
      description: 'List your handmade, eco-friendly, or sustainable products.',
      icon: ChartBarIcon,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/bazaar/seller/register');
    }
  };

  const handleSkip = () => {
    navigate('/bazaar/seller');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-primary-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Current Step Content */}
          <div className="text-center mb-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${steps[currentStep].color} mb-4`}>
                {React.createElement(steps[currentStep].icon, { className: "w-8 h-8" })}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {steps[currentStep].title}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </div>

          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What you can do as a seller:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">List unlimited products</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Track sales and analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Manage orders and shipping</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Connect with buyers</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Build your brand</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Join our community</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handleSkip}
              className="btn-secondary"
            >
              Skip for now
            </button>

            <button
              onClick={handleNext}
              className="btn-primary flex items-center space-x-2"
            >
              <span>
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </span>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
