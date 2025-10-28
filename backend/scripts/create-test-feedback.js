const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Delivery = require('../models/Delivery');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/veridaP');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create test feedback manually
const createTestFeedback = async () => {
  try {
    console.log('Creating test feedback...');

    // Find the seller (Aparna Nair)
    const seller = await User.findOne({ name: 'Aparna Nair' });
    if (!seller) {
      console.log('Seller not found');
      return;
    }
    console.log('Found seller:', seller.name, 'ID:', seller._id);

    // Find the volunteer (Abhirami Nair)
    const volunteer = await User.findOne({ name: 'Abhirami Nair' });
    if (!volunteer) {
      console.log('Volunteer not found');
      return;
    }
    console.log('Found volunteer:', volunteer.name, 'ID:', volunteer._id);

    // Find a delivery record
    const delivery = await Delivery.findOne({});
    if (!delivery) {
      console.log('No delivery records found');
      return;
    }
    console.log('Found delivery:', delivery._id);

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      deliveryId: delivery._id,
      fromUserId: volunteer._id,
      feedbackType: 'volunteer-to-seller'
    });

    if (existingFeedback) {
      console.log('Feedback already exists, updating rating...');
      existingFeedback.rating = 5;
      existingFeedback.review = 'Excellent service! Great seller with fast delivery.';
      existingFeedback.categories = {
        deliverySpeed: 5,
        communication: 5,
        productQuality: 5,
        packaging: 5,
        overallExperience: 5
      };
      await existingFeedback.save();
      console.log('Updated existing feedback with rating 5');
    } else {
      // Create new feedback
      const newFeedback = new Feedback({
        deliveryId: delivery._id,
        orderId: delivery.orderId,
        fromUserId: volunteer._id,
        toUserId: seller._id,
        feedbackType: 'volunteer-to-seller',
        rating: 5,
        review: 'Excellent service! Great seller with fast delivery.',
        categories: {
          deliverySpeed: 5,
          communication: 5,
          productQuality: 5,
          packaging: 5,
          overallExperience: 5
        },
        status: 'approved'
      });

      await newFeedback.save();
      console.log('Created new feedback with rating 5');
    }

    // Update seller ratings
    const sellerFeedbacks = await Feedback.find({
      toUserId: seller._id,
      feedbackType: { $in: ['buyer-to-seller', 'volunteer-to-seller'] },
      status: 'approved'
    });

    console.log('Total feedbacks for seller:', sellerFeedbacks.length);

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
      }

      // Update user profile
      seller.averageRating = averageRating;
      seller.totalRatings = sellerFeedbacks.length;
      await seller.save();
      console.log('Updated user profile with rating:', averageRating);
    }

    console.log('Feedback creation completed successfully!');

  } catch (error) {
    console.error('Error creating test feedback:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createTestFeedback();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestFeedback };
