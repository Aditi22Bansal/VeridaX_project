const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

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

// Force update rating
const forceUpdateRating = async () => {
  try {
    console.log('Force updating seller rating...');

    // Find the seller feedback
    const feedback = await Feedback.findOne({ feedbackType: 'volunteer-to-seller' });
    if (!feedback) {
      console.log('No seller feedback found');
      return;
    }

    console.log('Found feedback with rating:', feedback.rating);
    console.log('Seller ID:', feedback.toUserId);

    // Update seller profile
    const seller = await Seller.findOne({ userId: feedback.toUserId });
    if (seller) {
      seller.averageRating = feedback.rating;
      seller.totalRatings = 1;
      await seller.save();
      console.log('Updated seller profile - Rating:', seller.averageRating, 'Total:', seller.totalRatings);
    } else {
      console.log('Seller profile not found');
    }

    // Update user profile
    const user = await User.findById(feedback.toUserId);
    if (user) {
      user.averageRating = feedback.rating;
      user.totalRatings = 1;
      await user.save();
      console.log('Updated user profile - Rating:', user.averageRating, 'Total:', user.totalRatings);
    } else {
      console.log('User profile not found');
    }

    // Verify the update
    const updatedSeller = await Seller.findOne({ userId: feedback.toUserId });
    const updatedUser = await User.findById(feedback.toUserId);

    console.log('Verification:');
    console.log('Seller rating:', updatedSeller ? updatedSeller.averageRating : 'Not found');
    console.log('User rating:', updatedUser ? updatedUser.averageRating : 'Not found');

  } catch (error) {
    console.error('Error force updating rating:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await forceUpdateRating();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { forceUpdateRating };
