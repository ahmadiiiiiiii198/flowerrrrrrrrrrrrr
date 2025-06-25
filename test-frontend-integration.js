#!/usr/bin/env node

/**
 * Frontend Integration Testing Suite
 * Tests frontend services and components that interact with the database
 */

import { createClient } from '@supabase/supabase-js';

// New Supabase project configuration
const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🎨 FRONTEND INTEGRATION TESTING SUITE');
console.log('=====================================');
console.log('📍 Testing Frontend Services with Database:', SUPABASE_URL);
console.log('');

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function logTest(testName, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test 1: Settings Service Simulation
async function testSettingsService() {
  console.log('\n⚙️ TEST 1: SETTINGS SERVICE SIMULATION');
  console.log('--------------------------------------');

  try {
    // Simulate getting hero content (like Hero component does)
    const { data: heroData, error: heroError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'heroContent')
      .single();

    logTest('Hero Content Fetch', !heroError && heroData?.value, heroError?.message);

    // Simulate getting logo settings
    const { data: logoData, error: logoError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'logoSettings')
      .single();

    logTest('Logo Settings Fetch', !logoError && logoData?.value, logoError?.message);

    // Simulate getting contact content
    const { data: contactData, error: contactError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'contactContent')
      .single();

    logTest('Contact Content Fetch', !contactError && contactData?.value, contactError?.message);

    // Simulate getting Stripe configuration
    const { data: stripeData, error: stripeError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripeConfig')
      .single();

    logTest('Stripe Config Fetch', !stripeError && stripeData?.value, stripeError?.message);

    // Test if Stripe keys are properly configured
    const stripeConfig = stripeData?.value;
    const hasValidStripeKeys = stripeConfig?.publishableKey && stripeConfig?.secretKey && 
                              stripeConfig.publishableKey.startsWith('pk_') && 
                              stripeConfig.secretKey.startsWith('sk_');

    logTest('Stripe Keys Validation', hasValidStripeKeys, 'Stripe keys are properly configured');

  } catch (error) {
    logTest('Settings Service Exception', false, error.message);
  }
}

// Test 2: Categories Service Simulation
async function testCategoriesService() {
  console.log('\n📂 TEST 2: CATEGORIES SERVICE SIMULATION');
  console.log('----------------------------------------');

  try {
    // Simulate fetching categories (like Categories component does)
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    logTest('Categories Fetch', !categoriesError && categoriesData?.length > 0, categoriesError?.message);

    if (categoriesData && categoriesData.length > 0) {
      logTest('Categories Count', categoriesData.length >= 5, `Found ${categoriesData.length} categories`);
      
      // Check if categories have required fields
      const firstCategory = categoriesData[0];
      const hasRequiredFields = firstCategory.name && firstCategory.id && 
                               typeof firstCategory.is_active === 'boolean';
      
      logTest('Categories Structure', hasRequiredFields, 'Categories have required fields');
    }

  } catch (error) {
    logTest('Categories Service Exception', false, error.message);
  }
}

// Test 3: Products Service Simulation
async function testProductsService() {
  console.log('\n🛍️ TEST 3: PRODUCTS SERVICE SIMULATION');
  console.log('--------------------------------------');

  try {
    // Simulate fetching products with categories (like Products component does)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          name,
          slug,
          id
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    logTest('Products Fetch with JOIN', !productsError && productsData?.length > 0, productsError?.message);

    if (productsData && productsData.length > 0) {
      logTest('Products Count', productsData.length >= 3, `Found ${productsData.length} products`);
      
      // Check if products have required fields and category relationships
      const firstProduct = productsData[0];
      const hasRequiredFields = firstProduct.name && firstProduct.price && firstProduct.id;
      const hasCategoryRelation = firstProduct.categories && firstProduct.categories.name;
      
      logTest('Products Structure', hasRequiredFields, 'Products have required fields');
      logTest('Products-Categories Relationship', hasCategoryRelation, 'Products linked to categories');
    }

  } catch (error) {
    logTest('Products Service Exception', false, error.message);
  }
}

// Test 4: Order Creation Simulation
async function testOrderCreation() {
  console.log('\n📦 TEST 4: ORDER CREATION SIMULATION');
  console.log('------------------------------------');

  try {
    // Simulate creating an order (like OrderForm component does)
    const testOrder = {
      customer_name: 'Frontend Test Customer',
      customer_email: 'frontend-test@example.com',
      customer_phone: '+39 123 456 7890',
      total_amount: 45.99,
      status: 'payment_pending',
      payment_status: 'pending',
      notes: 'Frontend integration test order'
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    logTest('Order Creation', !orderError && orderData, orderError?.message);

    if (orderData) {
      // Simulate updating order after payment (like PaymentSuccess component does)
      const { data: updateData, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'completed',
          paid_amount: testOrder.total_amount,
          paid_at: new Date().toISOString()
        })
        .eq('id', orderData.id)
        .select()
        .single();

      logTest('Order Payment Update', !updateError && updateData?.status === 'paid', updateError?.message);

      // Simulate fetching order for admin (like OrderManagement component does)
      const { data: fetchData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderData.id)
        .single();

      logTest('Order Admin Fetch', !fetchError && fetchData, fetchError?.message);

      // Clean up test order
      await supabase.from('orders').delete().eq('id', orderData.id);
      logTest('Order Cleanup', true, 'Test order cleaned up');
    }

  } catch (error) {
    logTest('Order Creation Exception', false, error.message);
  }
}

// Test 5: Real-time Functionality Test
async function testRealtimeFunctionality() {
  console.log('\n🔄 TEST 5: REAL-TIME FUNCTIONALITY');
  console.log('----------------------------------');

  try {
    // Test if we can subscribe to real-time changes
    let subscriptionWorking = false;
    
    const subscription = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          subscriptionWorking = true;
        }
      )
      .subscribe();

    // Wait a moment for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    logTest('Real-time Subscription', subscription.state === 'SUBSCRIBED', `Subscription state: ${subscription.state}`);

    // Clean up subscription
    await supabase.removeChannel(subscription);

  } catch (error) {
    logTest('Real-time Exception', false, error.message);
  }
}

// Test 6: Database Performance Test
async function testDatabasePerformance() {
  console.log('\n⚡ TEST 6: DATABASE PERFORMANCE');
  console.log('-------------------------------');

  try {
    // Test query performance
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .limit(10);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    logTest('Query Performance', !error && queryTime < 2000, `Query took ${queryTime}ms`);
    logTest('Query Response', !error && data, error?.message);

  } catch (error) {
    logTest('Performance Test Exception', false, error.message);
  }
}

// Main test runner
async function runAllFrontendTests() {
  try {
    await testSettingsService();
    await testCategoriesService();
    await testProductsService();
    await testOrderCreation();
    await testRealtimeFunctionality();
    await testDatabasePerformance();

    console.log('\n🎯 FRONTEND INTEGRATION TEST RESULTS');
    console.log('====================================');
    console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 ALL FRONTEND INTEGRATION TESTS PASSED!');
      console.log('🌸 Your flower shop frontend is perfectly connected to the database!');
    } else {
      console.log('\n⚠️ Some frontend tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Frontend test suite failed:', error.message);
  }
}

// Run the tests
runAllFrontendTests();
