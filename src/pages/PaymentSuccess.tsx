import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Package, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import stripeService from '@/services/stripeService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const isMock = searchParams.get('mock') === 'true';
  const amount = searchParams.get('amount');
  const customerEmail = searchParams.get('customer_email');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !orderId) {
        toast({
          title: 'Invalid Payment Link',
          description: 'Missing payment session information.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      try {
        setIsVerifying(true);

        // Handle mock sessions (including new cs_live_mock_ format)
        if (isMock || sessionId.startsWith('cs_live_mock_') || sessionId.startsWith('cs_mock_')) {
          console.log('Mock payment detected - processing Francesco Fiori order');

          // Try to get order info from localStorage
          const orderInfo = localStorage.getItem(`order_${orderId}`);
          let orderAmount = 45.00; // Default amount

          if (orderInfo) {
            const parsedOrder = JSON.parse(orderInfo);
            console.log('Retrieved order info:', parsedOrder);
            orderAmount = parsedOrder.totalAmount || 45.00;
          } else if (amount) {
            orderAmount = parseFloat(amount);
          }

          const { supabase } = await import('@/integrations/supabase/client');

          // Update order status for mock payment (only if currently payment_pending)
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              stripe_session_id: sessionId,
              stripe_payment_intent_id: `pi_mock_${Date.now()}`,
              payment_status: 'paid',
              paid_amount: orderAmount,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .eq('status', 'payment_pending'); // Only update if currently waiting for payment

          // Get order details
          const { data: order } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', orderId)
            .single();

          if (order) {
            setOrderNumber(order.order_number);
          }

          toast({
            title: 'Payment Successful! 🌸',
            description: `Your Francesco Fiori order has been processed successfully. Amount: €${orderAmount.toFixed(2)}`,
          });
        } else {
          // Real Stripe payment verification
          const paymentData = await stripeService.verifyPayment(sessionId);

          if (paymentData.status === 'paid') {
            // Update order status in database
            await stripeService.updateOrderAfterPayment(orderId, {
              stripeSessionId: sessionId,
              paymentIntentId: paymentData.paymentIntentId || '',
              status: paymentData.status,
              amountPaid: (paymentData.amountTotal || 0) / 100, // Convert from cents
            });

            // Get order details to show order number
            const { supabase } = await import('@/integrations/supabase/client');
            const { data: order } = await supabase
              .from('orders')
              .select('order_number')
              .eq('id', orderId)
              .single();

            if (order) {
              setOrderNumber(order.order_number);
            }

            toast({
              title: 'Payment Successful! 🎉',
              description: 'Your order has been confirmed and payment processed.',
            });
          } else {
            throw new Error('Payment not completed');
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: 'Payment Verification Failed',
          description: 'There was an issue verifying your payment. Please contact support.',
          variant: 'destructive',
        });
      } finally {
        setIsVerifying(false);
        setVerificationComplete(true);
      }
    };

    verifyPayment();
  }, [sessionId, orderId, toast, navigate]);

  return (
    <div className="min-h-screen font-inter bg-gradient-to-br from-peach-50/30 via-white to-amber-50/30">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {isVerifying ? (
                    <Loader2 className="h-16 w-16 text-emerald-600 animate-spin" />
                  ) : (
                    <CheckCircle className="h-16 w-16 text-emerald-600" />
                  )}
                </div>
                <CardTitle className="text-2xl font-playfair">
                  {isVerifying ? 'Verifying Payment...' : 'Payment Successful!'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isVerifying ? (
                  <div>
                    <p className="text-gray-600">
                      Please wait while we verify your payment and update your order.
                    </p>
                  </div>
                ) : verificationComplete ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h3 className="font-semibold text-emerald-800 mb-2">
                        Thank you for your purchase!
                      </h3>
                      <p className="text-emerald-700">
                        Your payment has been processed successfully.
                        {orderNumber && (
                          <span className="block mt-1">
                            Order Number: <strong>#{orderNumber}</strong>
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-left space-y-2">
                      <h4 className="font-semibold text-gray-800">What happens next?</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• You'll receive an email confirmation shortly</li>
                        <li>• Our team will contact you to confirm delivery details</li>
                        <li>• We'll prepare your beautiful floral arrangement</li>
                        <li>• Your order will be delivered on the specified date</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        onClick={() => navigate('/menu')}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Continue Shopping
                      </Button>
                      <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="flex-1"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Back to Home
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <p>There was an issue processing your payment verification.</p>
                    <p>Please contact our support team for assistance.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
