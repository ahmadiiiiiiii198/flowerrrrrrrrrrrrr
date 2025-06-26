// Direct test of the Stripe service logic
// This simulates exactly what happens in the React component

console.log('🔧 Debug: Testing Stripe Service Logic');

// Simulate the exact data structure
const testItems = [{
  id: 'centrotavola-matrimonio',
  name: 'Centrotavola Matrimonio',
  price: 45.00,
  quantity: 1,
  description: 'Elegant wedding centerpiece'
}];

const testCustomer = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+393498851455',
  address: {
    street: 'Via Test 123',
    city: 'Milano',
    postalCode: '20100',
    country: 'IT'
  }
};

const testOrderId = `debug_test_${Date.now()}`;
const testMetadata = {
  source: 'francesco_fiori_website',
  order_type: 'product_order',
};

console.log('📦 Test Items:', testItems);
console.log('👤 Test Customer:', testCustomer);
console.log('🆔 Test Order ID:', testOrderId);
console.log('📋 Test Metadata:', testMetadata);

// Simulate createWorkingStripeSession function
function simulateCreateWorkingStripeSession(items, customerInfo, orderId, metadata) {
  console.log('💳 Simulating createWorkingStripeSession...');
  
  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  console.log('📦 Items:', items);
  console.log('💰 Total amount:', totalAmount);
  console.log('👤 Customer:', customerInfo);
  
  // Create mock session
  const mockSessionId = `cs_live_mock_${Date.now()}`;
  const successUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002'}/payment/success?session_id=${mockSessionId}&order_id=${orderId}&amount=${totalAmount}&customer_email=${encodeURIComponent(customerInfo.email)}`;
  
  console.log('✅ Mock session created for testing:', mockSessionId);
  console.log('🔗 Success URL:', successUrl);
  
  // Store order info in localStorage (if available)
  const orderInfo = {
    orderId,
    items,
    customerInfo,
    totalAmount,
    sessionId: mockSessionId,
    timestamp: new Date().toISOString()
  };
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`order_${orderId}`, JSON.stringify(orderInfo));
    console.log('💾 Order info stored in localStorage');
  } else {
    console.log('💾 localStorage not available (Node.js environment)');
  }
  
  return {
    sessionId: mockSessionId,
    url: successUrl
  };
}

// Simulate checkoutAndRedirect function
async function simulateCheckoutAndRedirect(items, customerInfo, orderId, metadata) {
  console.log('🎯 Simulating checkoutAndRedirect...');
  
  try {
    // Create session
    const session = await simulateCreateWorkingStripeSession(items, customerInfo, orderId, metadata);
    
    console.log('✅ Session created:', session.sessionId);
    console.log('🔗 Redirect URL:', session.url);
    
    // Check if it's a mock session
    if (session.sessionId.startsWith('cs_live_mock_') || session.sessionId.startsWith('cs_mock_')) {
      console.log('🎭 Mock session detected - would redirect immediately');
      console.log('🔗 Redirect URL:', session.url);
      
      // In browser, this would redirect
      if (typeof window !== 'undefined') {
        console.log('🚀 Redirecting now...');
        window.location.href = session.url;
      } else {
        console.log('🚀 Would redirect to:', session.url);
      }
      
      return;
    }
    
    // This shouldn't happen with current implementation
    throw new Error('Non-mock session not supported in current implementation');
    
  } catch (error) {
    console.error('❌ Checkout flow error:', error);
    throw error;
  }
}

// Run the test
async function runDebugTest() {
  console.log('\n🚀 Starting Debug Test...');
  
  try {
    await simulateCheckoutAndRedirect(testItems, testCustomer, testOrderId, testMetadata);
    console.log('✅ Debug test completed successfully');
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
  }
}

// Run the test
runDebugTest();

// Export for browser use
if (typeof window !== 'undefined') {
  window.debugStripeService = {
    simulateCreateWorkingStripeSession,
    simulateCheckoutAndRedirect,
    runDebugTest,
    testData: {
      items: testItems,
      customer: testCustomer,
      orderId: testOrderId,
      metadata: testMetadata
    }
  };
  console.log('💡 Available in browser: window.debugStripeService');
}
