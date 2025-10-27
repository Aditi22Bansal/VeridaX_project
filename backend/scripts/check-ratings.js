const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Seller = require('../models/Seller');
const User = require('../models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/veridax');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Check and update ratings
const checkAndUpdateRatings = async () => {
  try {
    console.log('Checking existing feedback...');

    // Check existing feedback
    const feedbacks = await Feedback.find({});
    console.log('Total feedbacks:', feedbacks.length);

    feedbacks.forEach(fb => {
      console.log('Feedback ID:', fb._id);
      console.log('Type:', fb.feedbackType);
      console.log('Rating:', fb.rating);
      console.log('From:', fb.fromUserId);
      console.log('To:', fb.toUserId);
      console.log('Status:', fb.status);
      console.log('---');
    });

    // Update seller ratings
    const seller = await User.findOne({ name: 'Aparna Nair' });
    if (seller) {
      console.log('Found seller:', seller.name);

      const sellerFeedbacks = await Feedback.find({
        toUserId: seller._id,
        feedbackType: { $in: ['buyer-to-seller', 'volunteer-to-seller'] },
        status: 'approved'
      });

      console.log('Feedbacks for seller:', sellerFeedbacks.length);

      if (sellerFeedbacks.length > 0) {
        const totalRating = sellerFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
        const averageRating = Math.round((totalRating / sellerFeedbacks.length) * 10) / 10;

        console.log('Calculated average rating:', averageRating);

        // Update seller profile
        const sellerProfile = await Seller.findOne({ userId: seller._id });
        if (sellerProfile) {
          sellerProfile.averageRating = averageRating;
          sellerProfile.totalRatings = sellerFeedbacks.length;
          await sellerProfile.save();
          console.log('Updated seller profile with rating:', averageRating);
        } else {
          console.log('Seller profile not found');
        }

        // Update user profile
        seller.averageRating = averageRating;
        seller.totalRatings = sellerFeedbacks.length;
        await seller.save();
        console.log('Updated user profile with rating:', averageRating);
      }
    } else {
      console.log('Seller not found');
    }

  } catch (error) {
    console.error('Error checking ratings:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkAndUpdateRatings();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { checkAndUpdateRatings };
