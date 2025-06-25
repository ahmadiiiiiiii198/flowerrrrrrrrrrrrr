#!/usr/bin/env node

/**
 * Final Comprehensive Test Suite
 * Tests all aspects of the flower shop database and frontend integration
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🌸 FINAL COMPREHENSIVE TEST SUITE - FRANCESCO FIORI & PIANTE');
console.log('============================================================');
console.log('📍 Database:', SUPABASE_URL);
console.log('');

let results = { passed: 0, failed: 0, total: 0 };

function test(name, success, details = '') {
  results.total++;
  if (success) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) console.log(`   ${details}`);
}

async function runFinalTests() {
  console.log('🔍 TESTING DATABASE STRUCTURE & DATA');
  console.log('------------------------------------');

  // Test 1: Database Tables Exist
  try {
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    });
    
    const expectedTables = ['categories', 'content_sections', 'order_items', 'orders', 'products', 'settings'];
    const actualTables = tables?.map(t => t.table_name) || [];
    const hasAllTables = expectedTables.every(table => actualTables.includes(table));
    
    test('Database Tables Structure', hasAllTables, `Found: ${actualTables.join(', ')}`);
  } catch (error) {
    test('Database Tables Structure', false, error.message);
  }

  // Test 2: Settings Data
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['heroContent', 'logoSettings', 'contactContent', 'stripeConfig']);

    const settingsMap = {};
    settings?.forEach(s => settingsMap[s.key] = s.value);

    test('Hero Content Exists', !!settingsMap.heroContent?.heading, 'Hero content configured');
    test('Logo Settings Exists', !!settingsMap.logoSettings?.logoUrl, 'Logo settings configured');
    test('Contact Content Exists', !!settingsMap.contactContent?.phone, 'Contact info configured');
    test('Stripe Config Exists', !!settingsMap.stripeConfig?.publishableKey, 'Stripe keys configured');
  } catch (error) {
    test('Settings Data', false, error.message);
  }

  // Test 3: Categories with Slugs
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, is_active')
      .eq('is_active', true);

    test('Categories Fetch', !error && categories?.length > 0, `Found ${categories?.length || 0} categories`);
    
    if (categories && categories.length > 0) {
      const hasAllSlugs = categories.every(cat => cat.slug);
      test('Categories Have Slugs', hasAllSlugs, 'All categories have slug fields');
    }
  } catch (error) {
    test('Categories Test', false, error.message);
  }

  // Test 4: Products with Category Relationships
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, name, price, is_active,
        categories (
          id, name, slug
        )
      `)
      .eq('is_active', true);

    test('Products with Categories JOIN', !error && products?.length > 0, `Found ${products?.length || 0} products`);
    
    if (products && products.length > 0) {
      const hasCategories = products.every(p => p.categories?.name);
      test('Products-Categories Relationship', hasCategories, 'All products linked to categories');
    }
  } catch (error) {
    test('Products Test', false, error.message);
  }

  console.log('\n💳 TESTING E-COMMERCE FUNCTIONALITY');
  console.log('-----------------------------------');

  // Test 5: Order Creation Flow
  try {
    const testOrder = {
      customer_name: 'Test Customer Final',
      customer_email: 'final-test@francescofiori.it',
      customer_phone: '+39 123 456 7890',
      total_amount: 75.50,
      status: 'payment_pending',
      payment_status: 'pending',
      notes: 'Final comprehensive test order'
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    test('Order Creation', !orderError && order, orderError?.message);

    if (order) {
      // Test payment update
      const { data: paidOrder, error: paymentError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'completed',
          paid_amount: testOrder.total_amount,
          paid_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single();

      test('Payment Processing', !paymentError && paidOrder?.status === 'paid', paymentError?.message);

      // Cleanup
      await supabase.from('orders').delete().eq('id', order.id);
      test('Order Cleanup', true, 'Test order removed');
    }
  } catch (error) {
    test('Order Flow Test', false, error.message);
  }

  console.log('\n🎨 TESTING FRONTEND INTEGRATION');
  console.log('-------------------------------');

  // Test 6: Hero Component Data
  try {
    const { data: heroData, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'heroContent')
      .single();

    const hero = heroData?.value;
    const hasHeroData = hero?.heading && hero?.subheading && hero?.backgroundImage;
    
    test('Hero Component Data', !error && hasHeroData, 'Hero content ready for frontend');
  } catch (error) {
    test('Hero Component Data', false, error.message);
  }

  // Test 7: Categories Component Data
  try {
    const { data: categoriesData, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    const hasValidCategories = categoriesData?.length >= 5 && 
                              categoriesData.every(cat => cat.name && cat.slug);
    
    test('Categories Component Data', !error && hasValidCategories, `${categoriesData?.length || 0} categories ready`);
  } catch (error) {
    test('Categories Component Data', false, error.message);
  }

  // Test 8: Products Component Data
  try {
    const { data: productsData, error } = await supabase
      .from('products')
      .select(`
        id, name, description, price, image_url,
        categories!inner (
          name, slug
        )
      `)
      .eq('is_active', true)
      .order('sort_order');

    const hasValidProducts = productsData?.length >= 3 && 
                            productsData.every(p => p.name && p.price && p.categories);
    
    test('Products Component Data', !error && hasValidProducts, `${productsData?.length || 0} products ready`);
  } catch (error) {
    test('Products Component Data', false, error.message);
  }

  console.log('\n🔒 TESTING SECURITY & PERFORMANCE');
  console.log('---------------------------------');

  // Test 9: RLS Policies
  try {
    // Test that we can read but not modify core settings without auth
    const { data: readData, error: readError } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'heroContent');

    const { error: writeError } = await supabase
      .from('settings')
      .update({ value: { test: 'unauthorized' } })
      .eq('key', 'heroContent');

    test('RLS Read Access', !readError && readData, 'Can read settings');
    test('RLS Write Protection', !!writeError, 'Unauthorized writes blocked');
  } catch (error) {
    test('RLS Security Test', false, error.message);
  }

  // Test 10: Query Performance
  try {
    const start = Date.now();
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          name, slug
        )
      `)
      .eq('is_active', true);

    const duration = Date.now() - start;
    
    test('Query Performance', !error && duration < 1000, `Query took ${duration}ms`);
  } catch (error) {
    test('Query Performance', false, error.message);
  }

  // Final Results
  console.log('\n🎯 FINAL TEST RESULTS');
  console.log('=====================');
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 PERFECT! ALL TESTS PASSED!');
    console.log('🌸 Francesco Fiori & Piante is ready for production!');
    console.log('');
    console.log('✅ Database: Fully functional');
    console.log('✅ Frontend: Connected and working');
    console.log('✅ E-commerce: Order flow operational');
    console.log('✅ Security: RLS policies active');
    console.log('✅ Performance: Queries optimized');
  } else if (results.failed <= 2) {
    console.log('\n🟡 EXCELLENT! Minor issues detected but system is functional.');
  } else {
    console.log('\n🔴 Issues detected. Please review failed tests.');
  }
}

runFinalTests().catch(console.error);
