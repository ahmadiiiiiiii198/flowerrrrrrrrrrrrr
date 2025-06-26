// Direct payment test - run this in browser console
// Copy and paste this entire script into the browser console

console.log('🌸 Francesco Fiori Direct Payment Test');

window.testDirectPayment = async function() {
  console.log('🚀 Starting direct payment test...');
  
  try {
    // Exact same data as React component
    const requestData = {
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
      success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=console_test_123`,
      cancel_url: `${window.location.origin}/payment/cancel?order_id=console_test_123`,
      metadata: {
        order_id: 'console_test_123',
        customer_name: 'Console Test Customer',
        customer_phone: '+393498851455',
        source: 'francesco_fiori_website',
        order_type: 'product_order',
      }
    };

    console.log('📤 Sending request to Stripe server...');
    console.log('📋 Request data:', requestData);
    
    const response = await fetch('http://localhost:3003/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('📊 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error response:', errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const session = await response.json();
    
    console.log('✅ Stripe session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);
    console.log('📋 Full response:', session);
    
    // Test redirect
    console.log('🔄 Will redirect in 3 seconds...');
    console.log('⚠️ This will redirect the page!');
    
    setTimeout(() => {
      console.log('🚀 Redirecting to Stripe checkout...');
      window.location.href = session.url;
    }, 3000);
    
    return session;
    
  } catch (error) {
    console.error('❌ Direct payment test failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Test server health
window.testServerHealth = async function() {
  console.log('🏥 Testing server health...');
  
  try {
    const response = await fetch('http://localhost:3003/health');
    console.log('📊 Health status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Server health:', result);
    } else {
      console.error('❌ Health check failed:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
  }
};

// Instructions
console.log('📋 Available functions:');
console.log('  • testServerHealth() - Check if server is running');
console.log('  • testDirectPayment() - Test payment flow directly');
console.log('');
console.log('💡 Run: testDirectPayment()');
console.log('⚠️  This will redirect to real Stripe checkout!');
