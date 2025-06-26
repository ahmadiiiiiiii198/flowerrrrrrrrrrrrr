import React from 'react';
import StripeCheckout, { CheckoutItem, CustomerInfo } from './StripeCheckout';

const SimpleStripeTest: React.FC = () => {
  // Test data
  const testItems: CheckoutItem[] = [{
    id: 'test-item',
    name: 'Test Product',
    price: 45.00,
    quantity: 1,
    description: 'Simple test product'
  }];

  const testCustomer: CustomerInfo = {
    name: 'Test Customer',
    email: 'test@francescofiori.it',
    phone: '+393498851455'
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Simple Stripe Test</h2>
      <p className="text-gray-600 mb-6">
        This bypasses order creation and tests Stripe directly.
      </p>
      
      <StripeCheckout
        items={testItems}
        customerInfo={testCustomer}
        orderId={`test_${Date.now()}`}
        onSuccess={() => {
          console.log('✅ Payment successful!');
        }}
        onError={(error) => {
          console.error('❌ Payment error:', error);
        }}
      />
    </div>
  );
};

export default SimpleStripeTest;
