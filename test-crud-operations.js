#!/usr/bin/env node

/**
 * Comprehensive CRUD Testing Suite
 * Tests all database operations for frontend and backend
 */

import { createClient } from '@supabase/supabase-js';

// New Supabase project configuration
const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 COMPREHENSIVE CRUD TESTING SUITE');
console.log('=====================================');
console.log('📍 Testing Database:', SUPABASE_URL);
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

// Test 1: Settings CRUD Operations
async function testSettingsCRUD() {
  console.log('\n📋 TEST 1: SETTINGS CRUD OPERATIONS');
  console.log('-----------------------------------');

  try {
    // CREATE: Add a test setting
    const testKey = 'test_setting_' + Date.now();
    const testValue = { message: 'Hello World', timestamp: new Date().toISOString() };
    
    const { data: createData, error: createError } = await supabase
      .from('settings')
      .insert({
        key: testKey,
        value: testValue
      })
      .select()
      .single();

    logTest('Settings CREATE', !createError && createData, createError?.message);

    // READ: Fetch the test setting
    const { data: readData, error: readError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', testKey)
      .single();

    logTest('Settings READ', !readError && readData?.key === testKey, readError?.message);

    // UPDATE: Modify the test setting
    const updatedValue = { message: 'Updated Hello World', timestamp: new Date().toISOString() };
    const { data: updateData, error: updateError } = await supabase
      .from('settings')
      .update({ value: updatedValue })
      .eq('key', testKey)
      .select()
      .single();

    logTest('Settings UPDATE', !updateError && updateData, updateError?.message);

    // DELETE: Remove the test setting
    const { error: deleteError } = await supabase
      .from('settings')
      .delete()
      .eq('key', testKey);

    logTest('Settings DELETE', !deleteError, deleteError?.message);

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', testKey);

    logTest('Settings DELETE Verification', !verifyError && verifyData?.length === 0, verifyError?.message);

  } catch (error) {
    logTest('Settings CRUD Exception', false, error.message);
  }
}

// Test 2: Categories CRUD Operations
async function testCategoriesCRUD() {
  console.log('\n📂 TEST 2: CATEGORIES CRUD OPERATIONS');
  console.log('-------------------------------------');

  try {
    // CREATE: Add a test category
    const testCategory = {
      name: 'Test Category ' + Date.now(),
      description: 'Test category for CRUD operations',
      image_url: 'https://example.com/test.jpg',
      is_active: true,
      sort_order: 999
    };
    
    const { data: createData, error: createError } = await supabase
      .from('categories')
      .insert(testCategory)
      .select()
      .single();

    logTest('Categories CREATE', !createError && createData, createError?.message);
    const categoryId = createData?.id;

    // READ: Fetch the test category
    const { data: readData, error: readError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    logTest('Categories READ', !readError && readData?.name === testCategory.name, readError?.message);

    // UPDATE: Modify the test category
    const updatedName = 'Updated Test Category ' + Date.now();
    const { data: updateData, error: updateError } = await supabase
      .from('categories')
      .update({ name: updatedName, description: 'Updated description' })
      .eq('id', categoryId)
      .select()
      .single();

    logTest('Categories UPDATE', !updateError && updateData?.name === updatedName, updateError?.message);

    // DELETE: Remove the test category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    logTest('Categories DELETE', !deleteError, deleteError?.message);

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId);

    logTest('Categories DELETE Verification', !verifyError && verifyData?.length === 0, verifyError?.message);

  } catch (error) {
    logTest('Categories CRUD Exception', false, error.message);
  }
}

// Test 3: Products CRUD Operations
async function testProductsCRUD() {
  console.log('\n🛍️ TEST 3: PRODUCTS CRUD OPERATIONS');
  console.log('-----------------------------------');

  try {
    // First, get a valid category ID
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (catError || !categories || categories.length === 0) {
      logTest('Products CRUD Setup', false, 'No categories available for testing');
      return;
    }

    const categoryId = categories[0].id;

    // CREATE: Add a test product
    const testProduct = {
      name: 'Test Product ' + Date.now(),
      description: 'Test product for CRUD operations',
      price: 29.99,
      category_id: categoryId,
      image_url: 'https://example.com/test-product.jpg',
      is_active: true,
      sort_order: 999
    };
    
    const { data: createData, error: createError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    logTest('Products CREATE', !createError && createData, createError?.message);
    const productId = createData?.id;

    // READ: Fetch the test product with category join
    const { data: readData, error: readError } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          name,
          id
        )
      `)
      .eq('id', productId)
      .single();

    logTest('Products READ with JOIN', !readError && readData?.name === testProduct.name, readError?.message);

    // UPDATE: Modify the test product
    const updatedPrice = 39.99;
    const { data: updateData, error: updateError } = await supabase
      .from('products')
      .update({ price: updatedPrice, description: 'Updated test product' })
      .eq('id', productId)
      .select()
      .single();

    logTest('Products UPDATE', !updateError && updateData?.price === updatedPrice, updateError?.message);

    // DELETE: Remove the test product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    logTest('Products DELETE', !deleteError, deleteError?.message);

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId);

    logTest('Products DELETE Verification', !verifyError && verifyData?.length === 0, verifyError?.message);

  } catch (error) {
    logTest('Products CRUD Exception', false, error.message);
  }
}

// Test 4: Orders CRUD Operations
async function testOrdersCRUD() {
  console.log('\n📦 TEST 4: ORDERS CRUD OPERATIONS');
  console.log('---------------------------------');

  try {
    // CREATE: Add a test order
    const testOrder = {
      customer_name: 'Test Customer ' + Date.now(),
      customer_email: 'test@example.com',
      customer_phone: '+39 123 456 7890',
      total_amount: 99.99,
      status: 'pending',
      payment_status: 'pending',
      notes: 'Test order for CRUD operations'
    };
    
    const { data: createData, error: createError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    logTest('Orders CREATE', !createError && createData, createError?.message);
    const orderId = createData?.id;

    // READ: Fetch the test order
    const { data: readData, error: readError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    logTest('Orders READ', !readError && readData?.customer_name === testOrder.customer_name, readError?.message);

    // UPDATE: Modify the test order (simulate payment completion)
    const { data: updateData, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        payment_status: 'completed',
        paid_amount: testOrder.total_amount,
        paid_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    logTest('Orders UPDATE', !updateError && updateData?.status === 'paid', updateError?.message);

    // DELETE: Remove the test order
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    logTest('Orders DELETE', !deleteError, deleteError?.message);

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId);

    logTest('Orders DELETE Verification', !verifyError && verifyData?.length === 0, verifyError?.message);

  } catch (error) {
    logTest('Orders CRUD Exception', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  try {
    await testSettingsCRUD();
    await testCategoriesCRUD();
    await testProductsCRUD();
    await testOrdersCRUD();

    console.log('\n🎯 TEST RESULTS SUMMARY');
    console.log('=======================');
    console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Database CRUD operations are working perfectly!');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
runAllTests();
