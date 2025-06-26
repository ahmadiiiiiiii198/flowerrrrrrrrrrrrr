import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import StripeCheckout, { CheckoutItem, CustomerInfo } from '../StripeCheckout';
import { supabase } from '@/integrations/supabase/client';

const StripeCheckoutTest = () => {
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<{
    configLoaded: boolean;
    edgeFunctionReachable: boolean;
    stripeInitialized: boolean;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  // Test data
  const testItems: CheckoutItem[] = [
    {
      id: 'test-bouquet-1',
      name: 'Test Bouquet - Francesco Fiori',
      price: 25.00,
      quantity: 1,
      description: 'Beautiful test bouquet for checkout verification',
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    },
  ];

  const testCustomer: CustomerInfo = {
    name: 'Test Customer',
    email: 'test@gmail.com',
    phone: '+39 123 456 7890',
  };

  const createTestOrder = async (): Promise<string> => {
    try {
      const orderNumber = `TEST-${Date.now()}`;
      const totalAmount = testItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: testCustomer.name,
          customer_email: testCustomer.email,
          customer_phone: testCustomer.phone,
          total_amount: totalAmount,
          status: 'payment_pending',
          payment_status: 'pending',
          notes: 'Test order for Stripe checkout verification',
        })
        .select()
        .single();

      if (error) throw error;

      // Create order item
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_name: testItems[0].name,
          quantity: testItems[0].quantity,
          price: testItems[0].price,
        });

      return order.id;
    } catch (error) {
      console.error('Error creating test order:', error);
      throw new Error('Failed to create test order');
    }
  };

  const testStripeAPI = async () => {
    setIsTestingAPI(true);
    setApiTestResults(null);

    try {
      const results = {
        configLoaded: false,
        edgeFunctionReachable: false,
        stripeInitialized: false,
        error: undefined as string | undefined,
      };

      // Test 1: Check if Stripe config is loaded
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'stripeConfig')
          .single();

        if (!error && data?.value) {
          results.configLoaded = true;
        } else {
          throw new Error('Stripe configuration not found');
        }
      } catch (error) {
        results.error = 'Stripe configuration not found in database';
        setApiTestResults(results);
        return;
      }

      // Test 2: Check if Edge Function is reachable
      try {
        const supabaseUrl = supabase.supabaseUrl;
        const supabaseKey = supabase.supabaseKey;
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;

        console.log('Testing Edge Function at:', edgeFunctionUrl);

        const testResponse = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            line_items: [{
              price_data: {
                currency: 'eur',
                product_data: { name: 'Test' },
                unit_amount: 100,
              },
              quantity: 1,
            }],
            mode: 'payment',
            customer_email: 'test@example.com',
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
            metadata: { test: 'true' },
          }),
        });

        console.log('Edge Function response:', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok
        });

        if (testResponse.ok || testResponse.status === 400) {
          // 400 is OK for this test - means function is reachable but may have validation errors
          results.edgeFunctionReachable = true;
          console.log('Edge Function is reachable');
        } else if (testResponse.status === 404) {
          throw new Error('Edge Function not deployed (404 Not Found)');
        } else {
          const errorText = await testResponse.text().catch(() => 'Unknown error');
          throw new Error(`Edge function returned ${testResponse.status}: ${errorText}`);
        }
      } catch (error) {
        console.error('Edge Function test failed:', error);
        results.error = `Edge function not reachable: ${error.message}`;
        // Don't return here - continue with Stripe client test
      }

      // Test 3: Check if Stripe can be initialized
      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'stripeConfig')
          .single();

        const config = data?.value as any;
        console.log('Stripe config for initialization test:', {
          hasPublishableKey: !!config?.publishableKey,
          keyPrefix: config?.publishableKey?.substring(0, 10),
          isTestMode: config?.isTestMode
        });

        if (config?.publishableKey) {
          const stripe = await loadStripe(config.publishableKey);
          if (stripe) {
            results.stripeInitialized = true;
            console.log('Stripe client initialized successfully');
          } else {
            console.error('Stripe client returned null');
            results.error = 'Stripe client returned null - check publishable key format';
          }
        } else {
          results.error = 'No publishable key found in configuration';
        }
      } catch (error) {
        console.error('Stripe initialization error:', error);
        results.error = `Stripe initialization failed: ${error.message}`;
      }

      setApiTestResults(results);

      if (results.configLoaded && results.edgeFunctionReachable && results.stripeInitialized) {
        toast({
          title: 'API Test Successful! ✅',
          description: 'All Stripe integrations are working properly.',
        });
      } else {
        toast({
          title: 'API Test Issues Found',
          description: 'Some components need attention. Check the results below.',
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('API test error:', error);
      setApiTestResults({
        configLoaded: false,
        edgeFunctionReachable: false,
        stripeInitialized: false,
        error: error.message,
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <div className="flex items-center gap-2">
        {status ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm">{label}</span>
        <Badge variant={status ? "default" : "destructive"}>
          {status ? "OK" : "FAIL"}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* API Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Stripe API Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={testStripeAPI}
              disabled={isTestingAPI}
              variant="outline"
            >
              {isTestingAPI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing API...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Stripe API
                </>
              )}
            </Button>
          </div>

          {apiTestResults && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold">Test Results:</h4>
              {getStatusBadge(apiTestResults.configLoaded, "Stripe Configuration Loaded")}
              {getStatusBadge(apiTestResults.edgeFunctionReachable, "Edge Function Reachable")}
              {getStatusBadge(apiTestResults.stripeInitialized, "Stripe Client Initialized")}
              
              {apiTestResults.error && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-red-800 text-sm font-medium">Error:</p>
                  <p className="text-red-700 text-sm">{apiTestResults.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Live Checkout Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Test Checkout Flow</h4>
              <p className="text-blue-700 text-sm">
                This will create a real test order and redirect to Stripe checkout.
                Use test card: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code>
              </p>
            </div>

            <StripeCheckout
              items={testItems}
              customerInfo={testCustomer}
              onCreateOrder={createTestOrder}
              onSuccess={() => {
                toast({
                  title: 'Checkout Test Successful! 🎉',
                  description: 'The complete checkout flow is working properly.',
                });
              }}
              onError={(error) => {
                toast({
                  title: 'Checkout Test Failed',
                  description: error,
                  variant: 'destructive',
                });
              }}
            >
              Test Stripe Checkout Flow
            </StripeCheckout>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeCheckoutTest;
