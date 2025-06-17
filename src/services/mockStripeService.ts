import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Mock Stripe service for testing when Edge Functions are not deployed
export class MockStripeService {
  private stripe: Promise<Stripe | null> | null = null;

  private async getStripeConfig() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stripeConfig')
        .single();

      if (error || !data?.value) {
        throw new Error('Stripe configuration not found. Please configure Stripe in the admin panel.');
      }

      return data.value;
    } catch (error) {
      console.error('Error loading Stripe config:', error);
      throw new Error('Failed to load Stripe configuration');
    }
  }

  private async getStripeInstance(): Promise<Stripe | null> {
    if (!this.stripe) {
      const config = await this.getStripeConfig();
      if (!config?.publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }
      this.stripe = loadStripe(config.publishableKey);
    }
    return await this.stripe;
  }

  // Mock checkout session creation (for testing without Edge Functions)
  async createMockCheckoutSession(
    items: any[],
    customerInfo: any,
    orderId: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Get Stripe instance to validate configuration
      const stripe = await this.getStripeInstance();
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      // In a real implementation, this would call the Edge Function
      // For now, we'll create a mock session ID and redirect to a test page
      const mockSessionId = `cs_test_mock_${Date.now()}`;

      // Simulate a delay like a real API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Mock checkout session created:', {
        sessionId: mockSessionId,
        items,
        customerInfo,
        orderId,
      });

      return {
        sessionId: mockSessionId,
        url: `${window.location.origin}/payment/success?session_id=${mockSessionId}&order_id=${orderId}&mock=true`,
      };
    } catch (error) {
      console.error('Error creating mock checkout session:', error);
      throw new Error('Failed to create checkout session. Please try again.');
    }
  }

  // Test Stripe configuration
  async testStripeConfiguration(): Promise<{
    configLoaded: boolean;
    stripeInitialized: boolean;
    error?: string;
  }> {
    try {
      // Test 1: Load configuration
      const config = await this.getStripeConfig();
      if (!config) {
        return {
          configLoaded: false,
          stripeInitialized: false,
          error: 'Stripe configuration not found',
        };
      }

      // Test 2: Initialize Stripe
      const stripe = await this.getStripeInstance();
      if (!stripe) {
        return {
          configLoaded: true,
          stripeInitialized: false,
          error: 'Failed to initialize Stripe with provided keys',
        };
      }

      return {
        configLoaded: true,
        stripeInitialized: true,
      };
    } catch (error) {
      return {
        configLoaded: false,
        stripeInitialized: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Redirect to checkout (or mock page)
  async redirectToCheckout(sessionId: string): Promise<void> {
    try {
      if (sessionId.startsWith('cs_test_mock_')) {
        // Extract order ID from the session if available
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order_id') || 'unknown';

        // Mock redirect for testing - simulate successful payment
        const url = `${window.location.origin}/payment/success?session_id=${sessionId}&order_id=${orderId}&mock=true`;

        console.log('Mock redirect to:', url);

        // Use a small delay to simulate processing
        setTimeout(() => {
          window.location.href = url;
        }, 500);
        return;
      }

      // Real Stripe redirect
      const stripe = await this.getStripeInstance();
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw new Error('Failed to redirect to checkout. Please try again.');
    }
  }

  // Combined checkout and redirect
  async checkoutAndRedirect(
    items: any[],
    customerInfo: any,
    orderId: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    try {
      // Create mock checkout session
      const session = await this.createMockCheckoutSession(items, customerInfo, orderId);

      // Store order ID for redirect
      const mockUrl = `${window.location.origin}/payment/success?session_id=${session.sessionId}&order_id=${orderId}&mock=true`;

      console.log('Mock checkout redirect to:', mockUrl);

      // Simulate processing delay
      setTimeout(() => {
        window.location.href = mockUrl;
      }, 1000);

    } catch (error) {
      console.error('Error in mock checkout flow:', error);
      throw error;
    }
  }

  // Update order after payment
  async updateOrderAfterPayment(
    orderId: string,
    paymentData: {
      stripeSessionId: string;
      paymentIntentId: string;
      status: string;
      amountPaid: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          stripe_session_id: paymentData.stripeSessionId,
          stripe_payment_intent_id: paymentData.paymentIntentId,
          payment_status: paymentData.status,
          paid_amount: paymentData.amountPaid,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Create order status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'paid',
          notes: `Payment completed via Stripe. Payment Intent: ${paymentData.paymentIntentId}`,
          created_by: 'system',
        });

    } catch (error) {
      console.error('Error updating order after payment:', error);
      throw new Error('Failed to update order status');
    }
  }
}

// Export singleton instance
export const mockStripeService = new MockStripeService();
export default mockStripeService;
