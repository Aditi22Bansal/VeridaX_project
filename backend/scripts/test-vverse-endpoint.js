require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const ProjectRoom = require('../models/ProjectRoom');
const RoomMessage = require('../models/RoomMessage');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veridax');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const testVVerseEndpoint = async () => {
  try {
    console.log('🧪 Testing VVerse Endpoint...\n');

    // 1. Check if models exist
    console.log('📊 Checking Models:');
    console.log('   - ProjectRoom:', !!ProjectRoom);
    console.log('   - RoomMessage:', !!RoomMessage);
    console.log('   - Campaign:', !!Campaign);
    console.log('   - User:', !!User);

    // 2. Check if RoomMessage.createSystemMessage exists
    console.log('\n🔧 Checking Methods:');
    console.log('   - RoomMessage.createSystemMessage:', typeof RoomMessage.createSystemMessage);

    // 3. Test creating a system message
    console.log('\n💬 Testing System Message Creation:');
    try {
      // First, get a campaign
      const campaign = await Campaign.findOne({});
      if (!campaign) {
        console.log('   ❌ No campaigns found. Please create a campaign first.');
        return;
      }

      console.log(`   ✅ Found campaign: ${campaign.title}`);

      // Test creating a room
      const testRoom = new ProjectRoom({
        campaignId: campaign._id,
        name: 'Test Room',
        description: 'Test room for debugging',
        createdBy: campaign.createdBy,
        members: [{
          userId: campaign.createdBy,
          role: 'admin',
          joinedAt: new Date(),
          isActive: true
        }]
      });

      await testRoom.save();
      console.log('   ✅ Test room created successfully');

      // Test creating system message
      await RoomMessage.createSystemMessage(
        testRoom._id,
        'Test system message'
      );
      console.log('   ✅ System message created successfully');

      // Clean up
      await ProjectRoom.findByIdAndDelete(testRoom._id);
      console.log('   🧹 Test room cleaned up');

    } catch (error) {
      console.error('   ❌ Error during test:', error.message);
    }

    console.log('\n🎉 VVerse Endpoint Test Complete!');

  } catch (error) {
    console.error('❌ Error during VVerse test:', error);
  }
};

const main = async () => {
  await connectDB();
  await testVVerseEndpoint();
  await mongoose.disconnect();
  process.exit(0);
};

if (require.main === module) {
  main();
}

module.exports = { testVVerseEndpoint };
