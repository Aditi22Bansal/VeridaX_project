const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const ProjectRoom = require('../models/ProjectRoom');
const User = require('../models/User');

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

// Test campaign creation and VVerse integration
const testCampaignVVerseIntegration = async () => {
  try {
    console.log('🧪 Testing Campaign-VVerse Integration...\n');

    // 1. Check if campaigns exist
    const campaigns = await Campaign.find({}).populate('createdBy', 'name email');
    console.log(`📊 Found ${campaigns.length} campaigns in database`);

    if (campaigns.length > 0) {
      campaigns.forEach((campaign, index) => {
        console.log(`\n📋 Campaign ${index + 1}:`);
        console.log(`   Title: ${campaign.title}`);
        console.log(`   Type: ${campaign.type}`);
        console.log(`   Status: ${campaign.status}`);
        console.log(`   Image URL: ${campaign.imageURL ? '✅ Has image' : '❌ No image'}`);
        console.log(`   Created by: ${campaign.createdBy?.name || 'Unknown'}`);
        console.log(`   Volunteers: ${campaign.volunteers?.length || 0}`);
        console.log(`   Raised: $${campaign.raisedAmount || 0} / $${campaign.goalAmount || 0}`);
      });
    }

    // 2. Check if rooms exist for campaigns
    const rooms = await ProjectRoom.find({}).populate('campaignId', 'title type').populate('createdBy', 'name');
    console.log(`\n🏠 Found ${rooms.length} VVerse rooms in database`);

    if (rooms.length > 0) {
      rooms.forEach((room, index) => {
        console.log(`\n🏠 Room ${index + 1}:`);
        console.log(`   Name: ${room.name}`);
        console.log(`   Campaign: ${room.campaignId?.title || 'Unknown'}`);
        console.log(`   Status: ${room.status}`);
        console.log(`   Members: ${room.memberCount}`);
        console.log(`   Created by: ${room.createdBy?.name || 'Unknown'}`);
        console.log(`   Skills: ${room.skills?.length || 0}`);
        console.log(`   Last Activity: ${room.lastActivity}`);
      });
    }

    // 3. Check campaign-room relationships
    console.log('\n🔗 Campaign-Room Relationships:');
    for (const campaign of campaigns) {
      const campaignRooms = await ProjectRoom.find({ campaignId: campaign._id });
      console.log(`   Campaign "${campaign.title}" has ${campaignRooms.length} room(s)`);

      if (campaignRooms.length > 0) {
        campaignRooms.forEach(room => {
          console.log(`     - Room: ${room.name} (${room.status})`);
        });
      }
    }

    // 4. Check for active campaigns without rooms
    const activeCampaigns = await Campaign.find({ status: 'active' });
    const campaignsWithoutRooms = [];

    for (const campaign of activeCampaigns) {
      const room = await ProjectRoom.findOne({ campaignId: campaign._id });
      if (!room) {
        campaignsWithoutRooms.push(campaign);
      }
    }

    console.log(`\n📝 Active campaigns without VVerse rooms: ${campaignsWithoutRooms.length}`);
    if (campaignsWithoutRooms.length > 0) {
      campaignsWithoutRooms.forEach(campaign => {
        console.log(`   - ${campaign.title} (${campaign.type})`);
      });
    }

    // 5. Check image URLs
    console.log('\n🖼️  Image URL Analysis:');
    const campaignsWithImages = campaigns.filter(c => c.imageURL && !c.imageURL.includes('unsplash.com'));
    const campaignsWithDefaultImages = campaigns.filter(c => c.imageURL && c.imageURL.includes('unsplash.com'));
    const campaignsWithoutImages = campaigns.filter(c => !c.imageURL);

    console.log(`   Campaigns with uploaded images: ${campaignsWithImages.length}`);
    console.log(`   Campaigns with default images: ${campaignsWithDefaultImages.length}`);
    console.log(`   Campaigns without images: ${campaignsWithoutImages.length}`);

    // 6. Test data integrity
    console.log('\n✅ Data Integrity Checks:');

    // Check for orphaned rooms
    const orphanedRooms = [];
    for (const room of rooms) {
      const campaign = await Campaign.findById(room.campaignId);
      if (!campaign) {
        orphanedRooms.push(room);
      }
    }
    console.log(`   Orphaned rooms: ${orphanedRooms.length}`);

    // Check for rooms with invalid campaign references
    const invalidRooms = rooms.filter(room => !room.campaignId);
    console.log(`   Rooms with invalid campaign references: ${invalidRooms.length}`);

    console.log('\n🎉 Campaign-VVerse Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Total Campaigns: ${campaigns.length}`);
    console.log(`   - Total Rooms: ${rooms.length}`);
    console.log(`   - Active Campaigns: ${activeCampaigns.length}`);
    console.log(`   - Campaigns with Rooms: ${activeCampaigns.length - campaignsWithoutRooms.length}`);
    console.log(`   - Campaigns without Rooms: ${campaignsWithoutRooms.length}`);
    console.log(`   - Uploaded Images: ${campaignsWithImages.length}`);
    console.log(`   - Default Images: ${campaignsWithDefaultImages.length}`);

  } catch (error) {
    console.error('❌ Error during integration test:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testCampaignVVerseIntegration();
  await mongoose.disconnect();
  process.exit(0);
};

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testCampaignVVerseIntegration };
