// Simple test to check if routes can be imported
console.log('Testing route imports...');

try {
  console.log('Testing products route...');
  const productRoutes = require('./routes/bazaar/products');
  console.log('✅ Products route imported successfully');
} catch (error) {
  console.error('❌ Products route error:', error.message);
}

try {
  console.log('Testing orders route...');
  const orderRoutes = require('./routes/bazaar/orders');
  console.log('✅ Orders route imported successfully');
} catch (error) {
  console.error('❌ Orders route error:', error.message);
}

try {
  console.log('Testing sellers route...');
  const sellerRoutes = require('./routes/bazaar/sellers');
  console.log('✅ Sellers route imported successfully');
} catch (error) {
  console.error('❌ Sellers route error:', error.message);
}

console.log('Route import test completed.');
