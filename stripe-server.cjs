const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = 3003;

// Use environment variable for Stripe secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Francesco Fiori Stripe Server is running' });
});

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('🚀 Creating Stripe checkout session...');
    console.log('📦 Request body:', req.body);

    const {
      payment_method_types,
      line_items,
      mode,
      customer_email,
      billing_address_collection,
      shipping_address_collection,
      success_url,
      cancel_url,
      metadata
    } = req.body;

    // Validate required fields
    if (!line_items || !customer_email || !success_url || !cancel_url) {
      return res.status(400).json({
        error: 'Missing required fields: line_items, customer_email, success_url, cancel_url'
      });
    }

    // Create Stripe checkout session using all provided fields
    const sessionConfig = {
      payment_method_types: payment_method_types || ['card'],
      line_items: line_items,
      mode: mode || 'payment',
      customer_email: customer_email,
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: metadata || {}
    };

    // Add optional fields if provided
    if (billing_address_collection) {
      sessionConfig.billing_address_collection = billing_address_collection;
    }

    if (shipping_address_collection) {
      sessionConfig.shipping_address_collection = shipping_address_collection;
    }

    // Add payment intent metadata if metadata exists
    if (metadata && Object.keys(metadata).length > 0) {
      sessionConfig.payment_intent_data = {
        metadata: metadata
      };
    }

    console.log('📋 Session config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Checkout session created:', session.id);

    res.json({
      id: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
      type: error.type || 'unknown_error'
    });
  }
});

// Verify payment endpoint
app.get('/verify-payment', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        error: 'Missing session_id parameter'
      });
    }

    console.log('🔍 Verifying payment for session:', session_id);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log('✅ Payment verification result:', {
      id: session.id,
      payment_status: session.payment_status,
      customer_email: session.customer_email
    });

    res.json({
      status: session.payment_status,
      paymentIntentId: session.payment_intent,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Francesco Fiori Stripe Server is working!',
    timestamp: new Date().toISOString(),
    stripe_version: stripe.VERSION
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🌸 Francesco Fiori Stripe Server started');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('💳 Using live Stripe keys');
  console.log('✅ Ready to process payments');
});

module.exports = app;
