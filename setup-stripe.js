#!/usr/bin/env node

/**
 * Stripe Configuration Setup Script
 * This script configures Stripe keys in the database for production deployment
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

// Stripe Configuration from Environment Variables
const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '', // Will be set when webhook is configured
  isTestMode: false // Set to true for test mode
};

async function setupStripeConfiguration() {
  console.log('🔧 Setting up Stripe configuration...');
  
  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Test connection
    console.log('📡 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    
    console.log('✅ Supabase connection successful');
    
    // Update or insert Stripe configuration
    console.log('💳 Configuring Stripe settings...');
    
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key: 'stripeConfig',
        value: STRIPE_CONFIG,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      throw new Error(`Failed to save Stripe config: ${error.message}`);
    }
    
    console.log('✅ Stripe configuration saved successfully');
    console.log('📋 Configuration details:');
    console.log(`   • Publishable Key: ${STRIPE_CONFIG.publishableKey.substring(0, 20)}...`);
    console.log(`   • Secret Key: ${STRIPE_CONFIG.secretKey.substring(0, 20)}...`);
    console.log(`   • Test Mode: ${STRIPE_CONFIG.isTestMode ? 'Enabled' : 'Disabled (LIVE MODE)'}`);
    
    // Verify the configuration
    console.log('🔍 Verifying configuration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripeConfig')
      .single();
    
    if (verifyError || !verifyData) {
      throw new Error('Failed to verify Stripe configuration');
    }
    
    const savedConfig = verifyData.value;
    const isValid = savedConfig.publishableKey === STRIPE_CONFIG.publishableKey &&
                   savedConfig.secretKey === STRIPE_CONFIG.secretKey;
    
    if (isValid) {
      console.log('✅ Configuration verified successfully');
      console.log('🎉 Stripe setup complete! Your website is ready for live payments.');
    } else {
      throw new Error('Configuration verification failed - saved data does not match');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupStripeConfiguration();
