import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { items, removeItem, updateQuantity, getCartTotals, clearCart } = useCart();

  const totals = getCartTotals();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId) => {
    removeItem(productId);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-gray-400 mb-6">
              <ShoppingBagIcon className="w-24 h-24 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/bazaar" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image || '/api/placeholder/100/100'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          by {item.sellerName}
                        </p>
                        <p className="text-lg font-semibold text-primary-600 mt-1">
                          ${item.price}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
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

              <div className="mt-6 space-y-3">
                <Link
                  to="/bazaar/checkout"
                  className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>

                <Link
                  to="/bazaar"
                  className="w-full btn-outline flex items-center justify-center py-3"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
