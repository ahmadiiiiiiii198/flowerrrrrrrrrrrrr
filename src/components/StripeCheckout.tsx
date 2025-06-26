import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();



  // Simple, clean checkout function
  const handleCheckout = async () => {
    // Basic validation
    if (!items.length || !customerInfo.name || !customerInfo.email) {
      toast({
        title: 'Informazioni Mancanti',
        description: 'Compila tutti i campi obbligatori per procedere.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order if needed
      let finalOrderId = orderId;
      if (onCreateOrder && !orderId) {
        console.log('📝 Creating order...');
        finalOrderId = await onCreateOrder();
      }

      if (!finalOrderId) {
        throw new Error('Order ID is required');
      }

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log('💰 Total amount:', total);

      // Show processing message
      toast({
        title: 'Elaborazione Pagamento',
        description: `Reindirizzamento a Stripe per €${total.toFixed(2)}...`,
      });

      // Prepare request data
      const requestData = {
        payment_method_types: ['card'],
        line_items: items.map(item => ({
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.name,
              description: item.description || '',
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        customer_email: customerInfo.email,
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
        },
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${finalOrderId}`,
        cancel_url: `${window.location.origin}/payment/cancel?order_id=${finalOrderId}`,
        metadata: {
          order_id: finalOrderId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone || '',
          source: 'francesco_fiori_website',
          order_type: 'product_order',
        }
      };

      console.log('📤 Calling Stripe server...');
      console.log('🔗 Server URL: http://localhost:3003/create-checkout-session');
      console.log('📋 Request data:', JSON.stringify(requestData, null, 2));

      // Call Stripe server directly
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
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const session = await response.json();
      console.log('✅ Session created:', session.id);
      console.log('🔗 Session URL:', session.url);

      // Redirect immediately
      console.log('🚀 Redirecting to Stripe...');

      // Add a small delay to ensure logs are visible
      setTimeout(() => {
        window.location.href = session.url;
      }, 100);

      // This code should not execute due to redirect

    } catch (error) {
      console.error('❌ Checkout failed:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error name:', error?.name);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast({
          title: 'Errore di Connessione',
          description: 'Impossibile connettersi al server di pagamento. Verifica che il server sia attivo.',
          variant: 'destructive',
        });
        onError?.('Connection error: Unable to reach payment server');
      } else {
        toast({
          title: 'Errore nel Pagamento',
          description: error instanceof Error ? error.message : 'Errore durante il pagamento',
          variant: 'destructive',
        });
        onError?.(error instanceof Error ? error.message : 'Payment failed');
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
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            {children || `Pay €${totalAmount.toFixed(2)} with Stripe`}
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
