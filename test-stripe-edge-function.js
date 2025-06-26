#!/usr/bin/env node

/**
 * Test Stripe Edge Function
 * Tests the create-checkout-session Edge Function directly
 */

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

console.log('🧪 TESTING STRIPE EDGE FUNCTION');
console.log('===============================');

async function testEdgeFunction() {
  try {
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/create-checkout-session`;
    
    console.log('📍 Edge Function URL:', edgeFunctionUrl);
    console.log('🔑 Using Supabase Anon Key');

    // Test data that matches what the frontend sends
    const testData = {
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Test Bouquet - Francesco Fiori',
              description: 'Beautiful test bouquet for checkout verification',
            },
            unit_amount: 2500, // €25.00 in cents
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      customer_email: 'test@francescofiori.com',
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
      },
      success_url: 'https://francescofiori.com/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=test123',
      cancel_url: 'https://francescofiori.com/payment/cancel?order_id=test123',
      metadata: {
        order_id: 'test123',
        customer_name: 'Test Customer',
        customer_phone: '+39 123 456 7890',
        source: 'francesco_fiori_website',
        order_type: 'product_order',
      },
      payment_intent_data: {
        metadata: {
          order_id: 'test123',
          customer_name: 'Test Customer',
        },
      },
    };

    console.log('📦 Sending test data:', JSON.stringify(testData, null, 2));

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testData),
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);

    if (!response.ok) {
      console.log('❌ Edge Function call failed');
      console.log('   Status:', response.status);
      console.log('   Error:', responseText);
      return;
    }

    try {
      const responseData = JSON.parse(responseText);
      console.log('✅ Edge Function call successful!');
      console.log('   Session ID:', responseData.id);
      console.log('   Checkout URL:', responseData.url);
      
      if (responseData.url) {
        console.log('🎉 Stripe checkout session created successfully!');
        console.log('   You can test this URL in a browser:', responseData.url);
      }
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON:', parseError.message);
    }

  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
    console.log('   Full error:', error);
  }
}

// Test the Edge Function
testEdgeFunction();
