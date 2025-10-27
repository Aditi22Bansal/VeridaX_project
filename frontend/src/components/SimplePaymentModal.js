import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { campaignService } from '../services/campaignService';
import toast from 'react-hot-toast';

const SimplePaymentModal = ({ isOpen, onClose, campaign, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    amount: 25,
    isAnonymous: false,
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.amount < 0.50) {
      toast.error('Minimum donation amount is $0.50');
      return;
    }

    try {
      setIsProcessing(true);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Make donation using the existing campaign service
      await campaignService.makeDonation(campaign._id, formData.amount);

      toast.success(`Successfully donated $${formData.amount}!`);
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Donation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCardIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Make a Donation</h3>
                  <p className="text-sm text-gray-600">{campaign.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Donation Amount
                </label>

                {/* Preset Amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, amount }))}
                      className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                        formData.amount === amount
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0.50"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter amount"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum donation: $0.50</p>
              </div>

              {/* Anonymous Donation */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                  Make this donation anonymous
                </label>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Leave a message for the campaign organizer..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.message.length}/500 characters
                </p>
              </div>

              {/* Demo Notice */}
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <LockClosedIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-600">
                  <p className="font-medium">Demo Mode</p>
                  <p>This is a demo donation. No real payment will be processed.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || formData.amount < 0.50}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : `Donate $${formData.amount}`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SimplePaymentModal;
