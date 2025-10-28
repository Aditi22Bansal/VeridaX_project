const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');

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

// Fix campaign image URLs
const fixCampaignImages = async () => {
  try {
    console.log('Checking campaigns for relative image URLs...');

    const campaigns = await Campaign.find({});
    console.log('Total campaigns:', campaigns.length);

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    let updatedCount = 0;

    for (const campaign of campaigns) {
      if (campaign.imageURL && campaign.imageURL.startsWith('/uploads/')) {
        const oldUrl = campaign.imageURL;
        const newUrl = `${baseUrl}${oldUrl}`;

        console.log(`Updating campaign "${campaign.title}"`);
        console.log(`  Old URL: ${oldUrl}`);
        console.log(`  New URL: ${newUrl}`);

        campaign.imageURL = newUrl;
        await campaign.save();
        updatedCount++;
      }
    }

    console.log(`\nUpdated ${updatedCount} campaigns with relative image URLs`);
  } catch (error) {
    console.error('Error fixing campaign images:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await fixCampaignImages();
  await mongoose.disconnect();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixCampaignImages };
