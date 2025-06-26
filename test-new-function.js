#!/usr/bin/env node

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

console.log('🧪 TESTING NEW EDGE FUNCTION');

async function testNewFunction() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/test-function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ test: true }),
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

  } catch (error) {
    console.log('Error:', error.message);
  }
}

testNewFunction();
