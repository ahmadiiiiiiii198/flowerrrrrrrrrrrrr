import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Stripe configuration
let stripePromise: Promise<Stripe | null> | null = null;
let cachedStripeConfig: any = null;

// Add to window for cache clearing
declare global {
  interface Window {
    stripeConfigCache?: any;
  }
}

const getStripeConfig = async () => {
  // Check if cache was cleared
  if (!window.stripeConfigCache && cachedStripeConfig) {
    cachedStripeConfig = null;
    stripePromise = null;
  }

  if (cachedStripeConfig) {
    return cachedStripeConfig;
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripeConfig')
      .single();

    if (error || !data?.value) {
      throw new Error('Stripe configuration not found. Please configure Stripe in the admin panel.');
    }

    cachedStripeConfig = data.value;
    window.stripeConfigCache = cachedStripeConfig;
    return cachedStripeConfig;
  } catch (error) {
    console.error('Error loading Stripe config:', error);
    throw new Error('Failed to load Stripe configuration');
  }
};

const getStripe = async () => {
  if (!stripePromise) {
    const config = await getStripeConfig();
    if (!config?.publishableKey) {
      throw new Error('Stripe publishable key not configured');
    }
    stripePromise = loadStripe(config.publishableKey);
  }
  return stripePromise;
};

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
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

class StripeService {
  private stripe: Promise<Stripe | null> | null = null;

  constructor() {
    // Stripe will be initialized when needed
  }

  private async getStripeInstance(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = getStripe();
    }
    return await this.stripe;
  }

  /**
   * Create a Stripe checkout session for product purchase
   */
  async createCheckoutSession(
    items: CheckoutItem[],
    customerInfo: CustomerInfo,
    orderId: string,
    metadata?: Record<string, string>
  ): Promise<CheckoutSession> {
    try {
      // First try Edge Function, then fallback to direct Stripe
      return await this.createCheckoutSessionWithEdgeFunction(items, customerInfo, orderId, metadata);
    } catch (error) {
      console.warn('Edge Function failed, trying direct Stripe checkout:', error);
      return await this.createDirectStripeCheckout(items, customerInfo, orderId, metadata);
    }
  }

  /**
   * Create checkout session using Supabase Edge Function
   */
  private async createCheckoutSessionWithEdgeFunction(
    items: CheckoutItem[],
    customerInfo: CustomerInfo,
    orderId: string,
    metadata?: Record<string, string>
  ): Promise<CheckoutSession> {
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create line items for Stripe
      const lineItems = items.map(item => {
        const productData: any = {
          name: item.name,
          images: item.image ? [item.image] : [],
        };

        // Only add description if it's not empty
        if (item.description && item.description.trim() !== '') {
          productData.description = item.description.trim();
        }

        return {
          price_data: {
            currency: 'eur',
            product_data: productData,
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        };
      });

      // Prepare checkout session data
      const checkoutData = {
        line_items: lineItems,
        mode: 'payment' as const,
        customer_email: customerInfo.email,
        billing_address_collection: 'required' as const,
        shipping_address_collection: {
          allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'] as const,
        },
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${window.location.origin}/payment/cancel?order_id=${orderId}`,
        metadata: {
          order_id: orderId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone || '',
          ...metadata,
        },
        payment_intent_data: {
          metadata: {
            order_id: orderId,
            customer_name: customerInfo.name,
          },
        },
      };

      // Call Supabase Edge Function for checkout session creation
      const stripeServerUrl = 'https://despodpgvkszyexvcbft.supabase.co/functions/v1/create-checkout-session';

      const response = await fetch(stripeServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3BvZHBndmtzenlleHZjYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTcyMTAsImV4cCI6MjA2MzkzMzIxMH0.zyjFQA-Kr317M5l_6qjV_a-6ED2iU4wraRuYaa0iGEg'}`,
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stripe checkout session creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        // If Edge Function is not available, provide helpful error message
        if (response.status === 404) {
          throw new Error('Stripe payment service is not available. Please contact support or try again later.');
        }

        throw new Error(`Payment service error (${response.status}): ${errorText || response.statusText}`);
      }

      const session = await response.json();

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('Error creating checkout session with Edge Function:', error);
      throw error;
    }
  }

  /**
   * Create checkout session using direct Stripe (fallback method)
   */
  private async createDirectStripeCheckout(
    items: CheckoutItem[],
    customerInfo: CustomerInfo,
    orderId: string,
    metadata?: Record<string, string>
  ): Promise<CheckoutSession> {
    try {
      const stripe = await this.getStripeInstance();
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      console.log('Creating direct Stripe checkout session for order:', orderId);

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

      // Create checkout session directly with Stripe
      const { error } = await stripe.redirectToCheckout({
        mode: 'payment',
        lineItems,
        customerEmail: customerInfo.email,
        billingAddressCollection: 'required',
        shippingAddressCollection: {
          allowedCountries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
        },
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancelUrl: `${window.location.origin}/payment/cancel?order_id=${orderId}`,
        metadata: {
          order_id: orderId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone || '',
          ...metadata,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to redirect to Stripe checkout');
      }

      // This won't be reached as redirectToCheckout redirects the page
      return {
        sessionId: 'direct_redirect',
        url: 'redirecting...',
      };
    } catch (error) {
      console.error('Error creating direct Stripe checkout:', error);
      throw new Error('Failed to create checkout session. Please try again.');
    }
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    try {
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

  /**
   * Create checkout session and redirect in one step
   */
  async checkoutAndRedirect(
    items: CheckoutItem[],
    customerInfo: CustomerInfo,
    orderId: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    try {
      const session = await this.createCheckoutSession(items, customerInfo, orderId, metadata);

      // If using direct checkout, the redirect already happened
      if (session.sessionId === 'direct_redirect') {
        return;
      }

      // Otherwise, redirect to the session URL
      await this.redirectToCheckout(session.sessionId);
    } catch (error) {
      console.error('Error in checkout flow:', error);
      throw error;
    }
  }

  /**
   * Verify payment status from Stripe
   */
  async verifyPayment(sessionId: string): Promise<{
    status: 'paid' | 'unpaid' | 'no_payment_required';
    paymentIntentId?: string;
    customerEmail?: string;
    amountTotal?: number;
  }> {
    try {
      // Call Stripe server to verify payment (Netlify function in production)
      const stripeServerUrl = import.meta.env.PROD
        ? '/.netlify/functions/verify-payment'
        : 'http://localhost:3001/verify-payment';

      const response = await fetch(`${stripeServerUrl}?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error('Failed to verify payment status');
    }
  }

  /**
   * Update order status after successful payment
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

      // Create order status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'payment_failed',
          notes: `Payment failed. Reason: ${reason || 'Unknown'}`,
          created_by: 'system',
        });

    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw new Error('Failed to update order status for failed payment');
    }
  }

  /**
   * Get Stripe instance for custom implementations
   */
  async getPublicStripeInstance(): Promise<Stripe | null> {
    return await this.getStripeInstance();
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;