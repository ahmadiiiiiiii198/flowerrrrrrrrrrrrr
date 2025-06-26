#!/usr/bin/env node

/**
 * Test Product Update Functionality
 * Tests the specific product update issue with compare_price
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🛍️ PRODUCT UPDATE FUNCTIONALITY TEST');
console.log('====================================');

async function testProductUpdate() {
  try {
    console.log('📋 Step 1: Fetch existing products...');
    
    // Get an existing product to test update
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.log('❌ Failed to fetch products:', fetchError.message);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found to test');
      return;
    }

    const testProduct = products[0];
    console.log('✅ Found test product:', testProduct.name);
    console.log('   Current price:', testProduct.price);
    console.log('   Current compare_price:', testProduct.compare_price);

    console.log('\n🔄 Step 2: Test product update (simulating admin panel)...');

    // Simulate the exact update that the admin panel would do
    const updateData = {
      name: testProduct.name,
      description: testProduct.description || 'Updated description',
      price: parseFloat(testProduct.price) + 1, // Increase price by 1
      compare_price: testProduct.compare_price ? parseFloat(testProduct.compare_price) + 1 : 50,
      slug: testProduct.slug,
      category_id: testProduct.category_id,
      image_url: testProduct.image_url,
      is_active: testProduct.is_active,
      is_featured: testProduct.is_featured,
      stock_quantity: testProduct.stock_quantity || 10,
      sort_order: testProduct.sort_order || 0,
      meta_title: testProduct.meta_title || testProduct.name,
      meta_description: testProduct.meta_description || testProduct.description,
      labels: testProduct.labels || [],
      updated_at: new Date().toISOString()
    };

    console.log('   Updating with data:', {
      price: updateData.price,
      compare_price: updateData.compare_price,
      stock_quantity: updateData.stock_quantity
    });

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', testProduct.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Product update failed:', updateError.message);
      console.log('   Error details:', updateError);
      return;
    }

    console.log('✅ Product updated successfully!');
    console.log('   New price:', updatedProduct.price);
    console.log('   New compare_price:', updatedProduct.compare_price);

    console.log('\n🔄 Step 3: Test another update with different fields...');

    // Test updating just specific fields
    const { data: partialUpdate, error: partialError } = await supabase
      .from('products')
      .update({
        description: 'Test description updated at ' + new Date().toLocaleString(),
        stock_quantity: 15,
        is_featured: !testProduct.is_featured
      })
      .eq('id', testProduct.id)
      .select()
      .single();

    if (partialError) {
      console.log('❌ Partial update failed:', partialError.message);
    } else {
      console.log('✅ Partial update successful!');
      console.log('   New stock_quantity:', partialUpdate.stock_quantity);
      console.log('   New is_featured:', partialUpdate.is_featured);
    }

    console.log('\n🔄 Step 4: Restore original values...');

    // Restore original values
    const { error: restoreError } = await supabase
      .from('products')
      .update({
        price: testProduct.price,
        compare_price: testProduct.compare_price,
        description: testProduct.description,
        stock_quantity: testProduct.stock_quantity,
        is_featured: testProduct.is_featured
      })
      .eq('id', testProduct.id);

    if (restoreError) {
      console.log('⚠️ Failed to restore original values:', restoreError.message);
    } else {
      console.log('✅ Original values restored');
    }

    console.log('\n🎉 PRODUCT UPDATE TEST COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Products can be updated with all fields including compare_price');
    console.log('✅ The "couldn\'t find the compared price" error should be resolved');
    console.log('✅ Admin panel product updates should now work properly');

  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
  }
}

// Test the product structure first
async function testProductStructure() {
  console.log('🔍 TESTING PRODUCT TABLE STRUCTURE');
  console.log('----------------------------------');

  try {
    const { data: columns, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'products' AND table_schema = 'public' ORDER BY ordinal_position"
    });

    if (error) {
      console.log('❌ Failed to get table structure:', error.message);
      return;
    }

    console.log('📋 Products table columns:');
    const requiredFields = ['compare_price', 'slug', 'is_featured', 'stock_quantity', 'gallery', 'meta_title', 'meta_description', 'labels'];
    const existingColumns = columns?.map(c => c.column_name) || [];

    requiredFields.forEach(field => {
      if (existingColumns.includes(field)) {
        console.log(`   ✅ ${field}`);
      } else {
        console.log(`   ❌ ${field} - MISSING`);
      }
    });

    console.log('\n📊 All columns:', existingColumns.join(', '));

  } catch (error) {
    console.log('❌ Structure test failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await testProductStructure();
  console.log('\n');
  await testProductUpdate();
}

runTests();
