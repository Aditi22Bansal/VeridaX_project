import React from 'react';
import { motion } from 'framer-motion';
import {
  HeartIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const ImpactMeter = ({ product, className = '' }) => {
  const getImpactData = (category, sustainabilityRating = 3) => {
    const impactData = {
      'eco-friendly': {
        icon: GlobeAltIcon,
        title: 'Environmental Impact',
        description: 'Reduces carbon footprint and waste',
        score: Math.min(sustainabilityRating * 20, 100),
        color: 'green',
        benefits: [
          'Reduces plastic waste',
          'Lower carbon emissions',
          'Sustainable materials'
        ]
      },
      'handmade': {
        icon: UserGroupIcon,
        title: 'Community Impact',
        description: 'Supports local artisans and families',
        score: Math.min(sustainabilityRating * 25, 100),
        color: 'blue',
        benefits: [
          'Supports local economy',
          'Preserves traditional skills',
          'Fair wages for artisans'
        ]
      },
      'upcycled': {
        icon: LightBulbIcon,
        title: 'Innovation Impact',
        description: 'Creative reuse of existing materials',
        score: Math.min(sustainabilityRating * 30, 100),
        color: 'purple',
        benefits: [
          'Reduces landfill waste',
          'Creative problem solving',
          'Unique, one-of-a-kind items'
        ]
      },
      'organic': {
        icon: ShieldCheckIcon,
        title: 'Health Impact',
        description: 'Chemical-free, natural production',
        score: Math.min(sustainabilityRating * 22, 100),
        color: 'emerald',
        benefits: [
          'No harmful chemicals',
          'Safe for environment',
          'Natural materials only'
        ]
      },
      'sustainable': {
        icon: GlobeAltIcon,
        title: 'Sustainability Impact',
        description: 'Long-term environmental benefits',
        score: Math.min(sustainabilityRating * 20, 100),
        color: 'green',
        benefits: [
          'Long-lasting quality',
          'Minimal environmental impact',
          'Future-focused production'
        ]
      },
      'community-crafted': {
        icon: UserGroupIcon,
        title: 'Social Impact',
        description: 'Strengthens community bonds',
        score: Math.min(sustainabilityRating * 28, 100),
        color: 'indigo',
        benefits: [
          'Community collaboration',
          'Shared knowledge',
          'Local skill development'
        ]
      }
    };

    return impactData[category] || {
      icon: HeartIcon,
      title: 'Positive Impact',
      description: 'Makes a meaningful difference',
      score: Math.min(sustainabilityRating * 15, 100),
      color: 'pink',
      benefits: [
        'Supports good causes',
        'Ethical production',
        'Quality craftsmanship'
      ]
    };
  };

  const impactData = getImpactData(product.category, product.sustainabilityRating);
  const IconComponent = impactData.icon;

  const getColorClasses = (color) => {
    const colorMap = {
      green: 'text-green-600 bg-green-100',
      blue: 'text-blue-600 bg-blue-100',
      purple: 'text-purple-600 bg-purple-100',
      emerald: 'text-emerald-600 bg-emerald-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      pink: 'text-pink-600 bg-pink-100'
    };
    return colorMap[color] || colorMap.pink;
  };

  const getProgressColor = (color) => {
    const colorMap = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      emerald: 'bg-emerald-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500'
    };
    return colorMap[color] || colorMap.pink;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg ${getColorClasses(impactData.color)}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{impactData.title}</h3>
          <p className="text-sm text-gray-600">{impactData.description}</p>
        </div>
      </div>

      {/* Impact Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Impact Score</span>
          <span className="text-sm font-bold text-gray-900">{impactData.score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${impactData.score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${getProgressColor(impactData.color)}`}
          />
        </div>
      </div>

      {/* Benefits List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">How this purchase helps:</h4>
        <ul className="space-y-1">
          {impactData.benefits.map((benefit, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2 text-sm text-gray-600"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${getProgressColor(impactData.color)}`} />
              <span>{benefit}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-gray-50 rounded-lg"
      >
        <p className="text-sm text-gray-700">
          <span className="font-medium">Your impact:</span> By purchasing this item, you're directly supporting
          {product.category === 'handmade' ? ' local artisans' :
           product.category === 'eco-friendly' ? ' environmental sustainability' :
           product.category === 'community-crafted' ? ' community development' :
           ' positive social impact'}.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ImpactMeter;
