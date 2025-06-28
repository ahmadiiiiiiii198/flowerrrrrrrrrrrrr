import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import stripeService from '@/services/stripeService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const handleCancelledPayment = async () => {
      if (orderId) {
        try {
          // Update order status to indicate payment was cancelled
          await stripeService.handleFailedPayment(orderId, 'Payment cancelled by user');
        } catch (error) {
          console.error('Error handling cancelled payment:', error);
        }
      }

      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. Your order is still saved and you can complete payment later.',
        variant: 'destructive',
      });
    };

    handleCancelledPayment();
  }, [orderId, toast]);

  const handleRetryPayment = () => {
    // Navigate back to the order page or menu page
    if (orderId) {
      navigate(`/order?retry=${orderId}`);
    } else {
      navigate('/menu');
    }
  };

  return (
    <div className="min-h-screen font-inter bg-gradient-to-br from-peach-50/30 via-white to-amber-50/30">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
                <CardTitle className="text-2xl font-playfair text-red-600">
                  Payment Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">
                      Payment was not completed
                    </h3>
                    <p className="text-red-700">
                      You cancelled the payment process. Don't worry - your order information 
                      has been saved and you can complete the payment at any time.
                    </p>
                  </div>

                  <div className="text-left space-y-2">
                    <h4 className="font-semibold text-gray-800">What you can do:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Try the payment process again</li>
                      <li>• Contact us directly to complete your order</li>
                      <li>• Browse more products and add them to a new order</li>
                      <li>• Your order details are saved for future reference</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">Need Help?</h4>
                    <p className="text-amber-700 text-sm">
                      If you're experiencing issues with payment, please contact us at{' '}
                      <a href="mailto:Dbrfnc56m31@gmail.com" className="underline">
                        Dbrfnc56m31@gmail.com
                      </a>{' '}
                      or call us directly. We're here to help!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      onClick={handleRetryPayment}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Try Payment Again
                    </Button>
                    <Button
                      onClick={() => navigate('/menu')}
                      variant="outline"
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </div>

                  <Button 
                    onClick={() => navigate('/')}
                    variant="ghost"
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentCancel;
