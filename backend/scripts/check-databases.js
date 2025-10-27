const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Seller = require('../models/Seller');

// Try different database names
const databases = ['veridax', 'veridaP', 'test'];

async function checkDatabase(dbName) {
  try {
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
    console.log(`Connected to ${dbName}`);

    const feedbacks = await Feedback.find({});
    const users = await User.find({});
    const sellers = await Seller.find({});

    console.log(`${dbName} - Feedbacks: ${feedbacks.length}, Users: ${users.length}, Sellers: ${sellers.length}`);

    if (feedbacks.length > 0) {
      console.log('Feedbacks found:');
      feedbacks.forEach(fb => {
        console.log('Rating:', fb.rating, 'Type:', fb.feedbackType, 'Status:', fb.status);
      });
    }

    if (users.length > 0) {
      console.log('Users found:');
      users.forEach(user => {
        console.log('Name:', user.name, 'Role:', user.role);
      });
    }

    if (sellers.length > 0) {
      console.log('Sellers found:');
      sellers.forEach(seller => {
        console.log('Shop:', seller.shopName, 'Rating:', seller.averageRating);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.log(`Error connecting to ${dbName}:`, error.message);
  }
}

async function main() {
  for (const db of databases) {
    await checkDatabase(db);
    console.log('---');
  }
  process.exit(0);
}

main();
