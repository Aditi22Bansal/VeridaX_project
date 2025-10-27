const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Seller = require('../models/Seller');
const User = require('../models/User');

// Connect to the correct database
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/veridaP');
    console.log('Connected to veridaP database');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Fix seller rating
const fixSellerRating = async () => {
  try {
    console.log('Fixing seller rating...');

    // Find all feedback for sellers
    const sellerFeedbacks = await Feedback.find({
      feedbackType: { $in: ['buyer-to-seller', 'volunteer-to-seller'] },
      status: 'approved'
    });

    console.log('Seller feedbacks found:', sellerFeedbacks.length);

    // Group feedbacks by seller
    const feedbackBySeller = {};
    sellerFeedbacks.forEach(fb => {
      if (!feedbackBySeller[fb.toUserId]) {
        feedbackBySeller[fb.toUserId] = [];
      }
      feedbackBySeller[fb.toUserId].push(fb);
    });

    // Update each seller's rating
    for (const [sellerUserId, feedbacks] of Object.entries(feedbackBySeller)) {
      console.log(`Updating ratings for seller: ${sellerUserId}`);

      const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
      const averageRating = Math.round((totalRating / feedbacks.length) * 10) / 10;

      console.log(`Calculated average rating: ${averageRating} from ${feedbacks.length} feedbacks`);

      // Update seller profile
      const seller = await Seller.findOne({ userId: sellerUserId });
      if (seller) {
        seller.averageRating = averageRating;
        seller.totalRatings = feedbacks.length;
        await seller.save();
        console.log(`Updated seller profile: ${seller.shopName} - Rating: ${averageRating}`);
      }

      // Update user profile
      const user = await User.findById(sellerUserId);
      if (user) {
        user.averageRating = averageRating;
        user.totalRatings = feedbacks.length;
        await user.save();
        console.log(`Updated user profile: ${user.name} - Rating: ${averageRating}`);
      }
    }

    console.log('Seller rating fix completed!');

  } catch (error) {
    console.error('Error fixing seller rating:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await fixSellerRating();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixSellerRating };
