// Test the Stripe server with correct data format
const https = require('https');

const testData = {
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: {
        name: 'Centrotavola Matrimonio',
        description: 'Elegant wedding centerpiece',
      },
      unit_amount: 4500, // €45.00 in cents
    },
    quantity: 1,
  }],
  mode: 'payment',
  customer_email: 'test@francescofiori.it',
  billing_address_collection: 'required',
  shipping_address_collection: {
    allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
  },
  success_url: 'http://localhost:3002/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=test_123',
  cancel_url: 'http://localhost:3002/payment/cancel?order_id=test_123',
  metadata: {
    order_id: 'test_123',
    customer_name: 'Test Customer',
    source: 'francesco_fiori_website'
  }
};

console.log('🧪 Testing Stripe server with correct data format...');
console.log('📦 Test data:', JSON.stringify(testData, null, 2));

// Test using fetch (Node.js 18+)
async function testStripeServer() {
  try {
    console.log('📡 Making request to http://localhost:3003/create-checkout-session');
    
    const response = await fetch('http://localhost:3003/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📊 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error response:', errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Success! Server response:', result);
    
    if (result.id && result.url) {
      console.log('🎉 Checkout session created successfully!');
      console.log('🆔 Session ID:', result.id);
      console.log('🔗 Checkout URL:', result.url);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📋 Full error:', error);
    throw error;
  }
}

// Run the test
testStripeServer()
  .then(() => {
    console.log('✅ Stripe server test completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Stripe server test failed:', error.message);
    process.exit(1);
  });
