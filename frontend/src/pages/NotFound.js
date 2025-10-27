import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-9xl font-bold text-primary-600 mb-4">404</div>
            <div className="text-6xl mb-4">🤔</div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for.
            It might have been moved, deleted, or you entered the wrong URL.
          </p>

          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Go Home
            </Link>

            <div>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Go Back
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
