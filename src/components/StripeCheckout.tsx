import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { businessHoursService } from '@/services/businessHoursService';

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

interface StripeCheckoutProps {
  items: CheckoutItem[];
  customerInfo: CustomerInfo;
  orderId?: string;
  onCreateOrder?: () => Promise<string>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Direct payment function - no complex abstractions
async function processStripePayment(
  items: CheckoutItem[],
  customerInfo: CustomerInfo,
  orderId: string
): Promise<void> {
  console.log('💳 Starting direct Stripe payment...');

  // Build request data with enhanced validation
  const requestData = {
    payment_method_types: ['card'],
    line_items: items.map(item => {
      // Ensure all required fields are present and valid
      const itemName = (item.name || '').trim();
      const itemDescription = (item.description || '').trim();
      const itemPrice = Math.max(0.01, item.price || 0); // Minimum 1 cent
      const itemQuantity = Math.max(1, Math.floor(item.quantity || 1));

      if (!itemName) {
        throw new Error(`Item name is required for item: ${JSON.stringify(item)}`);
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: itemName,
            description: itemDescription || `${itemName} - Francesco Fiori`,
          },
          unit_amount: Math.round(itemPrice * 100), // Convert to cents
        },
        quantity: itemQuantity,
      };
    }),
    mode: 'payment',
    customer_email: customerInfo.email,
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
    },
    success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${window.location.origin}/payment/cancel?order_id=${orderId}`,
    metadata: {
      order_id: orderId,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone || '',
      source: 'francesco_fiori_website',
      order_type: 'product_order',
    }
  };

  console.log('📤 Sending to Stripe server...');
  console.log('📋 Request data:', JSON.stringify(requestData, null, 2));

  // Use Netlify function for production, localhost for development
  const apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3003/create-checkout-session'
    : '/.netlify/functions/create-checkout-session';

  console.log('🌐 Using API URL:', apiUrl);

  // Make request
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });

  console.log('📡 Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Stripe server error response:', errorText);
    throw new Error(`Stripe server error: ${response.status} - ${errorText}`);
  }

  const session = await response.json();
  console.log('✅ Stripe session created:', session.id);

  // Redirect immediately
  window.location.href = session.url;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  items,
  customerInfo,
  orderId,
  onCreateOrder,
  onSuccess,
  onError,
  disabled = false,
  className = '',
  children
}) => {
  const [isProcessing, setIsProcessing] = useState(false);



  // Ultra-simple checkout handler
  const handleCheckout = async () => {
    console.log('🚀 Checkout button clicked');

    // Enhanced validation
    if (!items.length || !customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate each item
    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        alert('All items must have a name');
        return;
      }
      if (!item.price || item.price <= 0) {
        alert('All items must have a valid price');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        alert('All items must have a valid quantity');
        return;
      }
    }

    setIsProcessing(true);
    console.log('⏳ Processing started');

    try {
      // Validate business hours before processing payment
      console.log('🕒 Checking business hours...');
      const businessHoursValidation = await businessHoursService.validateOrderTime();
      if (!businessHoursValidation.valid) {
        throw new Error(businessHoursValidation.message);
      }
      console.log('✅ Business hours validation passed');

      // Get order ID
      let finalOrderId = orderId;

      if (onCreateOrder && !orderId) {
        console.log('📝 Creating order via callback...');
        finalOrderId = await onCreateOrder();
        console.log('📋 Order created with ID:', finalOrderId);
      }

      if (!finalOrderId) {
        throw new Error('No order ID available');
      }

      // Process payment
      console.log('💳 Processing Stripe payment...');
      await processStripePayment(items, customerInfo, finalOrderId);

      // This line should not be reached due to redirect
      console.log('⚠️ Unexpected: code after redirect');

    } catch (error) {
      console.error('❌ Payment failed:', error);

      // Show error
      alert(`Payment Error: ${error.message}`);

      // Call error callback
      if (onError) {
        onError(error.message);
      }

      setIsProcessing(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                €{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>€{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Display */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Billing Information</h4>
        <div className="text-sm text-blue-700">
          <p><strong>Name:</strong> {customerInfo.name}</p>
          <p><strong>Email:</strong> {customerInfo.email}</p>
          {customerInfo.phone && (
            <p><strong>Phone:</strong> {customerInfo.phone}</p>
          )}
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        onClick={handleCheckout}
        disabled={disabled || isProcessing || !items.length}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Elaborazione Pagamento...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            {children || `Paga €${totalAmount.toFixed(2)} con Stripe`}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Secure payment powered by Stripe</p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
};

export default StripeCheckout;
