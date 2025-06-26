import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Types
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

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

// Stripe instance
let stripeInstance: Promise<Stripe | null> | null = null;

// Live Stripe configuration
const LIVE_STRIPE_CONFIG = {
  publishableKey: 'pk_live_51RGNdrDOJ63odpAzQO3MOKACOOOEZrts38zjpFfiZYL9ynVjweBR6j9WJfcWzrdsZNoMOMinSUuJ9jxf8z8PjqWT00oqoe6KCn',
  secretKey: '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',
  isTestMode: false
};

// Get Stripe configuration
const getStripeConfig = async () => {
  try {
    console.log('🔧 Loading Stripe configuration...');

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripeConfig')
      .single();

    if (error || !data?.value) {
      console.warn('⚠️ Using live configuration');
      return LIVE_STRIPE_CONFIG;
    }

    const config = data.value;
    console.log('✅ Stripe config loaded:', {
      publishableKey: config.publishableKey?.substring(0, 20) + '...',
      isTestMode: config.isTestMode
    });

    return config;
  } catch (error) {
    console.error('❌ Config error, using live config:', error);
    return LIVE_STRIPE_CONFIG;
  }
};

// Initialize Stripe
const initializeStripe = async (): Promise<Stripe | null> => {
  if (!stripeInstance) {
    const config = await getStripeConfig();

    if (!config?.publishableKey) {
      throw new Error('Stripe publishable key not available');
    }

    console.log('🔧 Initializing Stripe with live keys...');
    stripeInstance = loadStripe(config.publishableKey);
  }

  return stripeInstance;
};

// Create real Stripe checkout session via local server
const createRealStripeSession = async (
  items: CheckoutItem[],
  customerInfo: CustomerInfo,
  orderId: string,
  metadata?: Record<string, string>
): Promise<CheckoutSession> => {
  console.log('💳 Creating real Stripe checkout session...');

  // Prepare line items for Stripe
  const lineItems = items.map(item => ({
    price_data: {
      currency: 'eur',
      product_data: {
        name: item.name,
        description: item.description || '',
        images: item.image ? [item.image] : [],
      },
      unit_amount: Math.round(item.price * 100), // Convert to cents
    },
    quantity: item.quantity,
  }));

  // Prepare request data
  const requestData = {
    line_items: lineItems,
    customer_email: customerInfo.email,
    success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${window.location.origin}/payment/cancel?order_id=${orderId}`,
    metadata: {
      order_id: orderId,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone || '',
      ...metadata
    }
  };

  console.log('📡 Sending request to Stripe server...');

  // Call local Stripe server
  const response = await fetch('http://localhost:3003/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Stripe server error: ${errorData.message || response.statusText}`);
  }

  const session = await response.json();

  console.log('✅ Stripe session created:', session.id);

  return {
    sessionId: session.id,
    url: session.url
  };
};

class StripeService {
  /**
   * Test Stripe configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string; config?: any }> {
    try {
      console.log('🧪 Testing Stripe configuration...');
      
      const config = await getStripeConfig();
      const stripe = await initializeStripe();
      
      if (!stripe) {
        return {
          success: false,
          message: 'Failed to initialize Stripe'
        };
      }

      return {
        success: true,
        message: 'Stripe configuration working',
        config: {
          publishableKey: config.publishableKey?.substring(0, 20) + '...',
          isTestMode: config.isTestMode
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Configuration error'
      };
    }
  }

  /**
   * Create checkout session - REAL STRIPE VERSION
   */
  async createCheckoutSession(
    items: CheckoutItem[],
    customerInfo: CustomerInfo,
    orderId: string,
    metadata?: Record<string, string>
  ): Promise<CheckoutSession> {
    console.log('🚀 Creating real Stripe checkout session...');
    console.log('📦 Items:', items);
    console.log('👤 Customer:', customerInfo.name, customerInfo.email);
    console.log('🆔 Order ID:', orderId);

    try {
      // Use real Stripe API via local server
      return await createRealStripeSession(items, customerInfo, orderId, metadata);
    } catch (error) {
      console.error('❌ Failed to create Stripe session:', error);
      throw new Error(`Payment system error: ${error.message}`);
    }
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    console.log('🔄 Redirecting to Stripe checkout:', sessionId);

    const stripe = await initializeStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw error;
    }
  }

  /**
   * Complete checkout flow - REAL STRIPE VERSION
   */
  async checkoutAndRedirect(
    items: CheckoutItem[],
    customerInfo: CustomerInfo,
    orderId: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    console.log('🎯 Starting real Stripe checkout flow...');

    try {
      // Create real Stripe session
      const session = await this.createCheckoutSession(items, customerInfo, orderId, metadata);

      console.log('✅ Session created:', session.sessionId);
      console.log('🔗 Redirect URL:', session.url);

      // Redirect to Stripe checkout
      await this.redirectToCheckout(session.sessionId);

    } catch (error) {
      console.error('❌ Checkout flow error:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(sessionId: string): Promise<{
    status: 'paid' | 'unpaid' | 'no_payment_required';
    paymentIntentId?: string;
    customerEmail?: string;
    amountTotal?: number;
  }> {
    try {
      console.log('🔍 Verifying payment:', sessionId);

      const response = await fetch(`http://localhost:3003/verify-payment?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Payment verification result:', data);

      return {
        status: data.status,
        paymentIntentId: data.paymentIntentId,
        customerEmail: data.customerEmail,
        amountTotal: data.amountTotal
      };

    } catch (error) {
      console.error('❌ Payment verification error:', error);
      throw new Error('Failed to verify payment status');
    }
  }

  /**
   * Update order after payment
   */
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
          payment_status: 'paid',
          stripe_session_id: paymentData.stripeSessionId,
          stripe_payment_intent_id: paymentData.paymentIntentId,
          paid_amount: paymentData.amountPaid,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      console.log('✅ Order updated after payment:', orderId);
    } catch (error) {
      console.error('❌ Error updating order:', error);
      throw new Error('Failed to update order after payment');
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(orderId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'payment_failed',
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      console.log('✅ Failed payment handled:', orderId);
    } catch (error) {
      console.error('❌ Error handling failed payment:', error);
      throw new Error('Failed to update order status for failed payment');
    }
  }
}

// Export singleton instance
const stripeService = new StripeService();
export default stripeService;
