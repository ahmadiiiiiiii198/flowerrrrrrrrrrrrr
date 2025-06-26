// Console test for Francesco Fiori payment system
// Run this in browser console: copy and paste this entire script

console.log('🌸 Francesco Fiori Payment System Console Test');

// Test function to run in browser console
window.testFrancescoFioriPayment = async function() {
  console.log('🚀 Starting Francesco Fiori Payment Test...');
  
  try {
    // Test data
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
    
    const testOrderId = `console_test_${Date.now()}`;
    
    console.log('📦 Test Items:', testItems);
    console.log('👤 Test Customer:', testCustomer);
    console.log('🆔 Test Order ID:', testOrderId);
    
    // Calculate total
    const totalAmount = testItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log('💰 Total Amount:', totalAmount);
    
    // Create mock session data
    const mockSessionId = `cs_live_mock_${Date.now()}`;
    const successUrl = `${window.location.origin}/payment/success?session_id=${mockSessionId}&order_id=${testOrderId}&amount=${totalAmount}&customer_email=${encodeURIComponent(testCustomer.email)}`;
    
    console.log('🎭 Mock Session ID:', mockSessionId);
    console.log('🔗 Success URL:', successUrl);
    
    // Store order info in localStorage
    const orderInfo = {
      orderId: testOrderId,
      items: testItems,
      customerInfo: testCustomer,
      totalAmount: totalAmount,
      sessionId: mockSessionId,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`order_${testOrderId}`, JSON.stringify(orderInfo));
    console.log('💾 Order info stored in localStorage');
    
    // Test redirect
    console.log('🔄 Testing redirect...');
    console.log('⚠️ This will redirect the page in 3 seconds!');
    
    setTimeout(() => {
      console.log('🚀 Redirecting now...');
      window.location.href = successUrl;
    }, 3000);
    
    return {
      success: true,
      sessionId: mockSessionId,
      orderId: testOrderId,
      redirectUrl: successUrl
    };
    
  } catch (error) {
    console.error('❌ Console test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test function to check localStorage
window.checkOrderStorage = function() {
  console.log('🗄️ Checking localStorage for orders...');
  
  const orders = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('order_')) {
      try {
        const orderData = JSON.parse(localStorage.getItem(key));
        orders.push({ key, data: orderData });
      } catch (e) {
        console.warn('⚠️ Invalid order data for key:', key);
      }
    }
  }
  
  console.log(`📊 Found ${orders.length} orders in localStorage:`, orders);
  return orders;
};

// Test function to clear order storage
window.clearOrderStorage = function() {
  console.log('🗑️ Clearing order storage...');
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('order_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`✅ Removed ${keysToRemove.length} order entries`);
};

// Instructions
console.log('📋 Available test functions:');
console.log('  • testFrancescoFioriPayment() - Test the payment flow');
console.log('  • checkOrderStorage() - Check stored orders');
console.log('  • clearOrderStorage() - Clear stored orders');
console.log('');
console.log('💡 Run: testFrancescoFioriPayment()');
