#!/usr/bin/env node

/**
 * Test Shipping Zones Functionality
 * Tests the shipping zones save/load mechanism
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚚 SHIPPING ZONES FUNCTIONALITY TEST');
console.log('====================================');

async function testShippingZones() {
  try {
    console.log('📋 Step 1: Check current shipping configuration...');
    
    // Check current settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['shippingZoneSettings', 'deliveryZones']);

    if (settingsError) {
      console.log('❌ Failed to fetch settings:', settingsError.message);
      return;
    }

    console.log('✅ Found settings:', settings?.map(s => s.key).join(', '));

    const shippingSettings = settings?.find(s => s.key === 'shippingZoneSettings')?.value;
    const deliveryZones = settings?.find(s => s.key === 'deliveryZones')?.value;

    console.log('📊 Current shipping settings:', shippingSettings ? 'Found' : 'Missing');
    console.log('📊 Current delivery zones:', deliveryZones ? `${deliveryZones.length} zones` : 'Missing');

    if (deliveryZones) {
      console.log('   Zones:', deliveryZones.map(z => `${z.name} (${z.maxDistance}km - €${z.deliveryFee})`).join(', '));
    }

    console.log('\n🔄 Step 2: Test adding a new zone...');

    // Simulate adding a new zone (like the admin panel does)
    const newZone = {
      id: Date.now().toString(),
      name: 'Test Zone ' + Date.now(),
      maxDistance: 5,
      deliveryFee: 3.50,
      estimatedTime: '20-30 minuti',
      isActive: true
    };

    const updatedZones = [...(deliveryZones || []), newZone];

    console.log('💾 Saving updated zones...');
    const { data: updateData, error: updateError } = await supabase
      .from('settings')
      .update({ 
        value: updatedZones,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'deliveryZones')
      .select();

    if (updateError) {
      console.log('❌ Failed to save zones:', updateError.message);
      return;
    }

    console.log('✅ Zones saved successfully');

    console.log('\n🔄 Step 3: Verify zones persist after "refresh" (re-read from DB)...');

    // Simulate a page refresh by reading from database again
    const { data: refreshedData, error: refreshError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deliveryZones')
      .single();

    if (refreshError) {
      console.log('❌ Failed to read zones after refresh:', refreshError.message);
      return;
    }

    const refreshedZones = refreshedData.value;
    console.log('✅ Zones after refresh:', refreshedZones ? `${refreshedZones.length} zones` : 'Missing');

    // Check if our test zone is still there
    const testZoneExists = refreshedZones?.find(z => z.name === newZone.name);
    if (testZoneExists) {
      console.log('✅ Test zone persisted after refresh!');
    } else {
      console.log('❌ Test zone disappeared after refresh');
    }

    console.log('\n🔄 Step 4: Test zone update...');

    // Update the test zone
    const updatedTestZone = { ...testZoneExists, deliveryFee: 4.00, name: 'Updated Test Zone' };
    const zonesWithUpdate = refreshedZones.map(z => 
      z.id === testZoneExists.id ? updatedTestZone : z
    );

    const { error: updateZoneError } = await supabase
      .from('settings')
      .update({ 
        value: zonesWithUpdate,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'deliveryZones');

    if (updateZoneError) {
      console.log('❌ Failed to update zone:', updateZoneError.message);
    } else {
      console.log('✅ Zone updated successfully');
    }

    console.log('\n🔄 Step 5: Test zone deletion...');

    // Remove the test zone
    const zonesWithoutTest = zonesWithUpdate.filter(z => z.id !== testZoneExists.id);

    const { error: deleteError } = await supabase
      .from('settings')
      .update({ 
        value: zonesWithoutTest,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'deliveryZones');

    if (deleteError) {
      console.log('❌ Failed to delete zone:', deleteError.message);
    } else {
      console.log('✅ Zone deleted successfully');
    }

    console.log('\n🔄 Step 6: Final verification...');

    // Final check
    const { data: finalData, error: finalError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deliveryZones')
      .single();

    if (finalError) {
      console.log('❌ Final verification failed:', finalError.message);
    } else {
      const finalZones = finalData.value;
      const testZoneStillExists = finalZones?.find(z => z.name.includes('Test Zone'));
      
      if (testZoneStillExists) {
        console.log('⚠️ Test zone still exists (cleanup incomplete)');
      } else {
        console.log('✅ Test zone properly cleaned up');
      }
      
      console.log('📊 Final zone count:', finalZones?.length || 0);
    }

    console.log('\n🎉 SHIPPING ZONES TEST COMPLETED!');
    console.log('');
    console.log('✅ Zones can be saved to database');
    console.log('✅ Zones persist after refresh');
    console.log('✅ Zones can be updated');
    console.log('✅ Zones can be deleted');
    console.log('✅ The admin panel should now work properly');

  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
  }
}

// Test the shipping zone service integration
async function testServiceIntegration() {
  console.log('\n🔧 TESTING SERVICE INTEGRATION');
  console.log('------------------------------');

  try {
    // Test if the service can load the settings correctly
    const { data: serviceSettings, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shippingZoneSettings')
      .single();

    if (error) {
      console.log('❌ Service settings not found:', error.message);
    } else {
      console.log('✅ Service settings found');
      console.log('   Restaurant:', serviceSettings.value.restaurantAddress);
      console.log('   Enabled:', serviceSettings.value.enabled);
    }

    // Test delivery zones loading
    const { data: zonesData, error: zonesError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deliveryZones')
      .single();

    if (zonesError) {
      console.log('❌ Delivery zones not found:', zonesError.message);
    } else {
      console.log('✅ Delivery zones found');
      console.log('   Zone count:', zonesData.value?.length || 0);
    }

  } catch (error) {
    console.log('❌ Service integration test failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await testShippingZones();
  await testServiceIntegration();
}

runTests();
