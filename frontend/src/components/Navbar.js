import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ChevronDownIcon,
  HomeIcon,
  PlusIcon,
  ChartBarIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartTotals } = useCart();
  const { notifications } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Bazaar', href: '/bazaar', icon: null },
    { name: 'VVerse', href: '/vverse', icon: null },
    { name: 'About', href: '#about', icon: null },
    { name: 'How It Works', href: '#how-it-works', icon: null },
    { name: 'Contact', href: '#contact', icon: null },
  ];

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: ChartBarIcon },
    { name: 'Create Campaign', href: '/admin/create-campaign', icon: PlusIcon },
    { name: 'My Campaigns', href: '/admin/my-campaigns', icon: UserGroupIcon },
  ];

  const volunteerNavItems = [
    { name: 'Dashboard', href: '/volunteer/dashboard', icon: ChartBarIcon },
    { name: 'Browse Campaigns', href: '/volunteer/browse', icon: MagnifyingGlassIcon },
  ];

  const sellerNavItems = [
    { name: 'Dashboard', href: '/bazaar/seller', icon: ChartBarIcon },
    { name: 'My Shop', href: '/bazaar/shop', icon: UserGroupIcon },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">VeridaX</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                {user.role === 'admin' && (
                  <>
                    {adminNavItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 flex items-center space-x-1"
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}

                {user.role === 'volunteer' && (
                  <>
                    {volunteerNavItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 flex items-center space-x-1"
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}

                {user.role === 'seller' && (
                  <>
                    {sellerNavItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 flex items-center space-x-1"
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              to="/bazaar/cart"
              className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {getCartTotals().itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartTotals().itemCount}
                </span>
              )}
            </Link>

            {/* VVerse Notifications */}
            <Link
              to="/vverse/notifications"
              className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              <BellIcon className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  <UserCircleIcon className="w-8 h-8" />
                  <span className="font-medium">{user?.name}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                          {user?.role}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    {user.role === 'admin' && (
                      <>
                        {adminNavItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </>
                    )}

                    {user.role === 'volunteer' && (
                      <>
                        {volunteerNavItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </>
                    )}

                    {user.role === 'seller' && (
                      <>
                        {sellerNavItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </>
                    )}

                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium transition-colors duration-200"
                    >
                      Sign out
                    </button>
                  </>
                )}

                <div className="border-t border-gray-200 my-2"></div>
                <Link
                  to="/bazaar/cart"
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  <span>Cart ({getCartTotals().itemCount})</span>
                </Link>

                {!isAuthenticated && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <Link
                      to="/auth/login"
                      className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth/signup"
                      className="block px-3 py-2 btn-primary text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
