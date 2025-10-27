const mongoose = require('mongoose');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
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

// Create delivery records for existing orders
const createDeliveryRecords = async () => {
  try {
    console.log('Creating delivery records for existing orders...');

    // Find all delivered orders that don't have delivery records
    const deliveredOrders = await Order.find({ status: 'delivered' });

    console.log(`Found ${deliveredOrders.length} delivered orders`);

    // Find a volunteer to assign deliveries to
    const volunteer = await User.findOne({ role: 'volunteer' });

    if (!volunteer) {
      console.log('No volunteers found. Please create a volunteer user first.');
      return;
    }

    console.log(`Assigning deliveries to volunteer: ${volunteer.name}`);

    let createdCount = 0;

    for (const order of deliveredOrders) {
      // Check if delivery record already exists
      const existingDelivery = await Delivery.findOne({ orderId: order._id });

      if (!existingDelivery) {
        const delivery = new Delivery({
          orderId: order._id,
          volunteerId: volunteer._id,
          sellerId: order.sellerId,
          buyerId: order.buyerId,
          status: 'delivered',
          deliveryAddress: order.shippingAddress,
          pickupAddress: {
            name: 'Seller Location',
            street: '123 Seller Street',
            city: 'Seller City',
            state: 'Seller State',
            zipCode: '12345',
            country: 'Seller Country',
            phone: '123-456-7890'
          },
          estimatedDeliveryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          deliveredAt: new Date(),
          assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          pickedUpAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        });

        await delivery.save();
        createdCount++;
        console.log(`Created delivery record for order ${order._id}`);
      }
    }

    console.log(`Created ${createdCount} delivery records`);

  } catch (error) {
    console.error('Error creating delivery records:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createDeliveryRecords();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createDeliveryRecords };
