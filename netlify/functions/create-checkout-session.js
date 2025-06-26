const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const requestData = JSON.parse(event.body);
    
    console.log('Creating Stripe checkout session...');
    console.log('Request data:', JSON.stringify(requestData, null, 2));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: requestData.payment_method_types || ['card'],
      line_items: requestData.line_items,
      mode: requestData.mode || 'payment',
      customer_email: requestData.customer_email,
      billing_address_collection: requestData.billing_address_collection || 'required',
      shipping_address_collection: requestData.shipping_address_collection,
      success_url: requestData.success_url,
      cancel_url: requestData.cancel_url,
      metadata: requestData.metadata || {},
    });

    console.log('Stripe session created:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: session.id,
        url: session.url,
      }),
    };

  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        message: error.message,
      }),
    };
  }
};
