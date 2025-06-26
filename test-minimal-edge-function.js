#!/usr/bin/env node

/**
 * Test Minimal Edge Function
 */

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

console.log('🧪 TESTING MINIMAL EDGE FUNCTION');
console.log('=================================');

async function testMinimalFunction() {
  try {
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/create-checkout-session`;
    
    console.log('📍 Testing URL:', edgeFunctionUrl);

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ test: true }),
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);

    if (response.ok) {
      console.log('✅ Edge Function is working!');
      return true;
    } else {
      console.log('❌ Edge Function failed');
      return false;
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

testMinimalFunction();
