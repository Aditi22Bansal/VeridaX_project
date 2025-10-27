const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veridax');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Update seller ratings based on feedback
const updateSellerRatings = async () => {
  try {
    console.log('Updating seller ratings...');

    // Get all sellers
    const sellers = await Seller.find({});

    for (const seller of sellers) {
      // Find all feedback for this seller
      const sellerFeedbacks = await Feedback.find({
        toUserId: seller.userId,
        feedbackType: { $in: ['buyer-to-seller', 'volunteer-to-seller'] },
        status: 'approved'
      });

      if (sellerFeedbacks.length > 0) {
        // Calculate average rating
        const totalRating = sellerFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
        const averageRating = Math.round((totalRating / sellerFeedbacks.length) * 10) / 10;

        // Calculate category averages if available
        const categoryAverages = {};
        const categories = ['deliverySpeed', 'communication', 'productQuality', 'packaging', 'overallExperience'];

        categories.forEach(category => {
          const categoryFeedbacks = sellerFeedbacks.filter(fb => fb.categories && fb.categories[category]);
          if (categoryFeedbacks.length > 0) {
            const categoryTotal = categoryFeedbacks.reduce((sum, fb) => sum + fb.categories[category], 0);
            categoryAverages[category] = Math.round((categoryTotal / categoryFeedbacks.length) * 10) / 10;
          }
        });

        // Update seller profile
        seller.averageRating = averageRating;
        seller.totalRatings = sellerFeedbacks.length;
        seller.categoryRatings = categoryAverages;
        await seller.save();

        // Update user profile
        const user = await User.findById(seller.userId);
        if (user) {
          user.averageRating = averageRating;
          user.totalRatings = sellerFeedbacks.length;
          await user.save();
        }

        console.log(`Updated ratings for seller ${seller.shopName}: ${averageRating}/5 (${sellerFeedbacks.length} ratings)`);
      } else {
        console.log(`No feedback found for seller ${seller.shopName}`);
      }
    }

    console.log('Seller ratings update completed');

  } catch (error) {
    console.error('Error updating seller ratings:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await updateSellerRatings();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateSellerRatings };
