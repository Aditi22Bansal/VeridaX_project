const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.log('📝 Please set MONGODB_URI in your .env file');
      console.log('💡 Example: MONGODB_URI=mongodb://localhost:27017/veridaP');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running locally');
    console.log('2. Or use MongoDB Atlas (cloud database)');
    console.log('3. Check your MONGODB_URI in .env file');
    console.log('\n💡 For MongoDB Atlas:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/veridaP');
    process.exit(1);
  }
};

module.exports = connectDB;
