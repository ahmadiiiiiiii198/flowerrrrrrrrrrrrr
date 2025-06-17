import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import stripeService, { CheckoutItem, CustomerInfo } from '@/services/stripeService';
import mockStripeService from '@/services/mockStripeService';

interface StripeCheckoutProps {
  items: CheckoutItem[];
  customerInfo: CustomerInfo;
  orderId?: string;
  onCreateOrder?: () => Promise<string>; // Function to create order and return order ID
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



  const handleCheckout = async () => {
    if (!items.length || !customerInfo.name || !customerInfo.email) {
      const error = 'Missing required information for checkout';
      toast({
        title: 'Checkout Error',
        description: error,
        variant: 'destructive',
      });
      onError?.(error);
      return;
    }

    try {
      setIsProcessing(true);

      // Create order first if onCreateOrder is provided
      let finalOrderId = orderId;
      if (onCreateOrder && !orderId) {
        finalOrderId = await onCreateOrder();
      }

      if (!finalOrderId) {
        throw new Error('Order ID is required for payment processing');
      }

      // Calculate total for display
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      toast({
        title: 'Redirecting to Payment',
        description: `Processing payment of €${total.toFixed(2)}...`,
      });

      // Use real Stripe service with local server
      try {
        console.log('Creating real Stripe checkout session...');

        await stripeService.checkoutAndRedirect(
          items,
          customerInfo,
          finalOrderId,
          {
            source: 'francesco_fiori_website',
            order_type: 'product_order',
          }
        );

      } catch (error) {
        console.error('Real Stripe checkout failed:', error);
        throw error;
      }

      // If we reach here, the redirect didn't happen (shouldn't normally occur)
      onSuccess?.();

    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';

      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });

      onError?.(errorMessage);
    } finally {
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
