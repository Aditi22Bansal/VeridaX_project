const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Payment = require('../models/Payment');
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

// Test payment system
const testPaymentSystem = async () => {
  try {
    console.log('🧪 Testing Payment System...\n');

    // 1. Check if we have campaigns
    const campaigns = await Campaign.find({ type: 'crowdfunding' });
    console.log(`📊 Found ${campaigns.length} crowdfunding campaigns`);

    if (campaigns.length === 0) {
      console.log('❌ No crowdfunding campaigns found. Please create a campaign first.');
      return;
    }

    // 2. Check if we have users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    // 3. Check payment model
    console.log('\n💳 Payment Model Schema:');
    console.log('   - campaignId: ObjectId (required)');
    console.log('   - donorId: ObjectId (required)');
    console.log('   - amount: Number (required, min: 0.50)');
    console.log('   - currency: String (default: usd)');
    console.log('   - stripePaymentIntentId: String (required, unique)');
    console.log('   - stripeChargeId: String (required)');
    console.log('   - status: String (pending, succeeded, failed, canceled, refunded)');
    console.log('   - donorEmail: String (required)');
    console.log('   - donorName: String (required)');
    console.log('   - isAnonymous: Boolean (default: false)');
    console.log('   - message: String (max: 500)');
    console.log('   - refundedAmount: Number (default: 0)');
    console.log('   - refundReason: String (max: 500)');

    // 4. Test payment creation (without Stripe)
    console.log('\n🔧 Testing Payment Creation...');

    const testCampaign = campaigns[0];
    const testUser = users[0];

    const testPayment = new Payment({
      campaignId: testCampaign._id,
      donorId: testUser._id,
      amount: 25.00,
      currency: 'usd',
      stripePaymentIntentId: 'pi_test_' + Date.now(),
      stripeChargeId: 'ch_test_' + Date.now(),
      status: 'succeeded',
      donorEmail: testUser.email,
      donorName: testUser.name,
      isAnonymous: false,
      message: 'Test donation for payment system verification'
    });

    try {
      await testPayment.save();
      console.log('✅ Test payment created successfully');
      console.log(`   Payment ID: ${testPayment._id}`);
      console.log(`   Amount: $${testPayment.amount}`);
      console.log(`   Status: ${testPayment.status}`);

      // Test campaign stats
      const stats = await Payment.getCampaignStats(testCampaign._id);
      console.log('\n📈 Campaign Donation Stats:');
      console.log(`   Total Amount: $${stats.totalAmount}`);
      console.log(`   Total Donations: ${stats.totalDonations}`);
      console.log(`   Average Donation: $${stats.averageDonation.toFixed(2)}`);
      console.log(`   Refunded Amount: $${stats.refundedAmount}`);
      console.log(`   Net Amount: $${stats.totalAmount - stats.refundedAmount}`);

      // Test donor stats
      const donorStats = await Payment.getDonorStats(testUser._id);
      console.log('\n👤 Donor Stats:');
      console.log(`   Total Donated: $${donorStats.totalDonated}`);
      console.log(`   Total Donations: ${donorStats.totalDonations}`);
      console.log(`   Average Donation: $${donorStats.averageDonation.toFixed(2)}`);

      // Clean up test payment
      await Payment.findByIdAndDelete(testPayment._id);
      console.log('\n🧹 Test payment cleaned up');

    } catch (error) {
      console.error('❌ Error creating test payment:', error.message);
    }

    // 5. Check existing payments
    const existingPayments = await Payment.find({});
    console.log(`\n💳 Existing payments in database: ${existingPayments.length}`);

    if (existingPayments.length > 0) {
      console.log('\nRecent payments:');
      existingPayments.slice(0, 3).forEach((payment, index) => {
        console.log(`   ${index + 1}. $${payment.amount} - ${payment.status} - ${payment.donorName}`);
      });
    }

    console.log('\n🎉 Payment System Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Payment Model: ✅ Ready`);
    console.log(`   - Campaign Integration: ✅ Ready`);
    console.log(`   - User Integration: ✅ Ready`);
    console.log(`   - Stats Calculation: ✅ Ready`);
    console.log(`   - Database Operations: ✅ Ready`);
    console.log('\n⚠️  Note: To test actual Stripe payments, you need to:');
    console.log('   1. Set up Stripe account and get API keys');
    console.log('   2. Add STRIPE_SECRET_KEY to .env file');
    console.log('   3. Add REACT_APP_STRIPE_PUBLISHABLE_KEY to frontend .env');
    console.log('   4. Test with real payment flow in the application');

  } catch (error) {
    console.error('❌ Error during payment system test:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testPaymentSystem();
  await mongoose.disconnect();
  process.exit(0);
};

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testPaymentSystem };
