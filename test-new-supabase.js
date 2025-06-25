#!/usr/bin/env node

/**
 * Test script for new Supabase project
 * This script will test the database connection and verify all tables exist
 */

import { createClient } from '@supabase/supabase-js';

// New Supabase project configuration
const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Update this with your actual anon key

console.log('🧪 Testing new Supabase project...');
console.log('📍 Project URL:', SUPABASE_URL);

async function testDatabase() {
  if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
    console.log('❌ Please update the SUPABASE_ANON_KEY in this script first!');
    console.log('📝 Get your anon key from: https://supabase.com/dashboard/project/ijhuoolcnxbdvpqmqofo/settings/api');
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    console.log('🔍 Testing database connection...');

    // Test each table
    const tables = ['settings', 'categories', 'products', 'orders', 'order_items'];
    const results = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          results[table] = { status: 'error', message: error.message };
        } else {
          results[table] = { status: 'success', count: data?.length || 0 };
        }
      } catch (err) {
        results[table] = { status: 'error', message: err.message };
      }
    }

    // Display results
    console.log('\n📊 Database Test Results:');
    console.log('========================');
    
    let allGood = true;
    for (const [table, result] of Object.entries(results)) {
      if (result.status === 'success') {
        console.log(`✅ ${table}: Connected successfully`);
      } else {
        console.log(`❌ ${table}: ${result.message}`);
        allGood = false;
      }
    }

    if (allGood) {
      console.log('\n🎉 All database tables are working!');
      
      // Test Stripe configuration
      console.log('\n🔍 Testing Stripe configuration...');
      const { data: stripeConfig, error: stripeError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stripeConfig')
        .single();

      if (stripeError) {
        console.log('❌ Stripe configuration not found');
      } else if (stripeConfig?.value?.publishableKey) {
        console.log('✅ Stripe configuration found');
        console.log(`📝 Publishable key: ${stripeConfig.value.publishableKey.substring(0, 20)}...`);
      } else {
        console.log('⚠️  Stripe configuration exists but keys are empty');
      }

      // Test categories
      console.log('\n🔍 Testing categories...');
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('name')
        .limit(5);

      if (catError) {
        console.log('❌ Categories test failed:', catError.message);
      } else {
        console.log(`✅ Found ${categories?.length || 0} categories`);
        if (categories && categories.length > 0) {
          console.log('📝 Categories:', categories.map(c => c.name).join(', '));
        }
      }

      console.log('\n🚀 Next steps:');
      console.log('1. Update your project configuration with the new Supabase URL and anon key');
      console.log('2. Deploy Edge Functions for Stripe integration');
      console.log('3. Test the full application');
      
      return true;
    } else {
      console.log('\n❌ Some database tables are missing or have issues.');
      console.log('📝 Please run the SQL scripts from NEW_SUPABASE_SETUP_GUIDE.md');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testDatabase().then(success => {
  if (success) {
    console.log('\n✅ Database test completed successfully!');
  } else {
    console.log('\n❌ Database test failed. Please check the setup guide.');
  }
});
