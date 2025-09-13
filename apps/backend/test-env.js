// Test script to check environment variables
console.log('=== Environment Variables Test ===');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET'); 
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

if (!process.env.STRIPE_SECRET_KEY) {
  console.log('\n❌ STRIPE_SECRET_KEY is missing!');
  console.log('📝 Set it with: export STRIPE_SECRET_KEY="sk_test_your_key_here"');
} else {
  console.log('\n✅ STRIPE_SECRET_KEY is configured');
}

// Test Stripe initialization
try {
  const Stripe = require('stripe');
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_key_here')) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
  } else {
    console.log('⚠️  Stripe not initialized - invalid or missing key');
  }
} catch (error) {
  console.log('❌ Stripe initialization failed:', error.message);
} 