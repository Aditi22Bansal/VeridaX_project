import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getCartTotals, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    shippingAddress: {
      name: user?.name || '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: ''
    },
    paymentMethod: 'credit-card',
    orderNotes: ''
  });

  const totals = getCartTotals();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
    if (items.length === 0) {
      navigate('/bazaar/cart');
    }
  }, [isAuthenticated, items.length, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingAddress: formData.shippingAddress,
        paymentInfo: {
          method: formData.paymentMethod
        },
        notes: {
          buyer: formData.orderNotes
        }
      };

      const response = await fetch('/api/bazaar/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        navigate(`/bazaar/order-success/${data.data._id}`);
      } else {
        alert('Error creating order: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Shipping', icon: TruckIcon },
    { id: 2, name: 'Payment', icon: CreditCardIcon },
    { id: 3, name: 'Review', icon: ShieldCheckIcon }
  ];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Step 1: Shipping Address */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.shippingAddress.name}
                          onChange={(e) => handleAddressChange('name', e.target.value)}
                          className="w-full input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.shippingAddress.phone}
                          onChange={(e) => handleAddressChange('phone', e.target.value)}
                          className="w-full input-field"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.shippingAddress.street}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        className="w-full input-field"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.shippingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className="w-full input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.shippingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className="w-full input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.shippingAddress.zipCode}
                          onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                          className="w-full input-field"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.shippingAddress.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        className="w-full input-field"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Payment Method */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>

                    <div className="space-y-4">
                      {[
                        { id: 'credit-card', name: 'Credit Card', icon: CreditCardIcon },
                        { id: 'debit-card', name: 'Debit Card', icon: CreditCardIcon },
                        { id: 'paypal', name: 'PayPal', icon: CreditCardIcon },
                        { id: 'bank-transfer', name: 'Bank Transfer', icon: CreditCardIcon },
                        { id: 'cash-on-delivery', name: 'Cash on Delivery', icon: TruckIcon }
                      ].map((method) => (
                        <label
                          key={method.id}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                            formData.paymentMethod === method.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={formData.paymentMethod === method.id}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="sr-only"
                          />
                          <method.icon className="w-6 h-6 text-gray-600 mr-3" />
                          <span className="font-medium text-gray-900">{method.name}</span>
                        </label>
                      ))}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This is a demo checkout. No actual payment will be processed.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Review Order */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Review Your Order</h2>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-900">{formData.shippingAddress.name}</p>
                          <p className="text-gray-600">{formData.shippingAddress.street}</p>
                          <p className="text-gray-600">
                            {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                          </p>
                          <p className="text-gray-600">{formData.shippingAddress.country}</p>
                          {formData.shippingAddress.phone && (
                            <p className="text-gray-600">{formData.shippingAddress.phone}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-900 capitalize">
                            {formData.paymentMethod.replace('-', ' ')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Order Items</h3>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={item.image || '/api/placeholder/50/50'}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-medium text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Order Notes (Optional)
                        </label>
                        <textarea
                          value={formData.orderNotes}
                          onChange={(e) => handleInputChange('orderNotes', e.target.value)}
                          rows={3}
                          className="w-full input-field"
                          placeholder="Any special instructions for your order..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="btn-primary"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Place Order'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {totals.shipping > 0 ? `$${totals.shipping.toFixed(2)}` : 'Free'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">$0.00</span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-primary-600">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                      <span>Secure Checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
