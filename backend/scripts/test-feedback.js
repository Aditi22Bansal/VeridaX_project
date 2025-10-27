const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
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

// Test feedback creation
const testFeedback = async () => {
  try {
    console.log('Testing feedback system...');

    // Find the seller (Aparna Nair)
    const seller = await User.findOne({ name: 'Aparna Nair', role: 'seller' });
    if (!seller) {
      console.log('Seller not found. Looking for any seller...');
      const anySeller = await User.findOne({ role: 'seller' });
      if (!anySeller) {
        console.log('No sellers found in database');
        return;
      }
      console.log('Found seller:', anySeller.name);
    } else {
      console.log('Found seller:', seller.name);
    }

    // Find the volunteer (Abhirami Nair)
    const volunteer = await User.findOne({ name: 'Abhirami Nair', role: 'volunteer' });
    if (!volunteer) {
      console.log('Volunteer not found. Looking for any volunteer...');
      const anyVolunteer = await User.findOne({ role: 'volunteer' });
      if (!anyVolunteer) {
        console.log('No volunteers found in database');
        return;
      }
      console.log('Found volunteer:', anyVolunteer.name);
    } else {
      console.log('Found volunteer:', volunteer.name);
    }

    // Find a delivery record
    const delivery = await Delivery.findOne({});
    if (!delivery) {
      console.log('No delivery records found');
      return;
    }
    console.log('Found delivery:', delivery._id);

    // Create a test feedback
    const testFeedback = new Feedback({
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      fromUserId: volunteer._id,
      toUserId: seller._id,
      feedbackType: 'volunteer-to-seller',
      rating: 5,
      review: 'Great seller! Fast delivery and good communication.',
      categories: {
        deliverySpeed: 5,
        communication: 5,
        productQuality: 4,
        packaging: 5,
        overallExperience: 5
      },
      status: 'approved'
    });

    await testFeedback.save();
    console.log('Created test feedback with rating 5');

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

  } catch (error) {
    console.error('Error testing feedback:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testFeedback();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { testFeedback };
