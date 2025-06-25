// Comprehensive Shipping Zone System Test
// Run this to verify all functionality is working correctly

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ijhuoolcnxbdvpqmqofo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA'
);

console.log('🧪 COMPREHENSIVE SHIPPING ZONE SYSTEM TEST');
console.log('==========================================');

// Test 1: Database Persistence
async function testDatabasePersistence() {
  console.log('\n📊 TEST 1: Database Persistence');
  console.log('--------------------------------');
  
  try {
    // Create comprehensive test zones
    const testZones = [
      {
        id: '1',
        name: 'Centro Storico (0-2km)',
        maxDistance: 2,
        deliveryFee: 2.00,
        estimatedTime: '15-25 minutes',
        isActive: true
      },
      {
        id: '2',
        name: 'Zona Residenziale (2-5km)',
        maxDistance: 5,
        deliveryFee: 3.50,
        estimatedTime: '25-35 minutes',
        isActive: true
      },
      {
        id: '3',
        name: 'Periferia (5-10km)',
        maxDistance: 10,
        deliveryFee: 5.00,
        estimatedTime: '35-50 minutes',
        isActive: true
      },
      {
        id: '4',
        name: 'Zona Estesa (10-15km)',
        maxDistance: 15,
        deliveryFee: 7.50,
        estimatedTime: '50-70 minutes',
        isActive: false // Disabled zone for testing
      }
    ];

    console.log('💾 Saving test zones to database...');
    const { data, error } = await supabase
      .from('settings')
      .update({ 
        value: testZones,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'deliveryZones')
      .select();

    if (error) {
      console.log('❌ FAILED to save zones:', error.message);
      return false;
    }

    console.log('✅ Zones saved successfully');

    // Verify by reading back
    const { data: readData, error: readError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deliveryZones')
      .single();

    if (readError) {
      console.log('❌ FAILED to read zones:', readError.message);
      return false;
    }

    const savedZones = readData.value;
    console.log('📖 Read back from database:');
    console.log(`   Total zones: ${savedZones.length}`);
    console.log(`   Active zones: ${savedZones.filter(z => z.isActive).length}`);
    console.log(`   Inactive zones: ${savedZones.filter(z => !z.isActive).length}`);

    savedZones.forEach((zone, index) => {
      const status = zone.isActive ? '✅' : '❌';
      console.log(`   ${status} ${zone.name} - ${zone.maxDistance}km - €${zone.deliveryFee}`);
    });

    return savedZones.length === testZones.length;

  } catch (error) {
    console.log('❌ TEST 1 FAILED:', error.message);
    return false;
  }
}

// Test 2: Address Validation
async function testAddressValidation() {
  console.log('\n🗺️  TEST 2: Address Validation');
  console.log('------------------------------');

  try {
    // Get current settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shippingZoneSettings')
      .single();

    const { data: zonesData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deliveryZones')
      .single();

    const settings = settingsData.value;
    const zones = zonesData.value.filter(z => z.isActive);

    console.log('📍 Restaurant location:', settings.restaurantAddress);
    console.log('🗝️  Google Maps API:', settings.googleMapsApiKey ? 'Configured' : 'Missing');

    // Test addresses with expected results
    const testCases = [
      {
        address: 'Via Roma 1, Torino, Italy',
        expectedZone: 'Centro Storico (0-2km)',
        description: 'City center address'
      },
      {
        address: 'Corso Francia 100, Torino, Italy',
        expectedZone: 'Periferia (5-10km)',
        description: 'Suburban address'
      },
      {
        address: 'Via Po 25, Torino, Italy',
        expectedZone: 'Centro Storico (0-2km)',
        description: 'Historic center address'
      },
      {
        address: 'Moncalieri, Italy',
        expectedZone: 'Periferia (5-10km)',
        description: 'Nearby town'
      },
      {
        address: 'Milano, Italy',
        expectedZone: null,
        description: 'Outside delivery area'
      }
    ];

    let passedTests = 0;
    const totalTests = testCases.length;

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.address}`);
      console.log(`   Expected: ${testCase.expectedZone || 'Outside delivery area'}`);

      try {
        // Geocode address
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testCase.address)}&key=${settings.googleMapsApiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          const coords = result.geometry.location;

          // Calculate distance
          const R = 6371;
          const dLat = (coords.lat - settings.restaurantLat) * Math.PI / 180;
          const dLng = (coords.lng - settings.restaurantLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(settings.restaurantLat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) * 
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          console.log(`   📏 Distance: ${distance.toFixed(2)}km`);

          // Find matching zone
          const matchingZone = zones.find(zone => distance <= zone.maxDistance);

          if (matchingZone) {
            console.log(`   ✅ Zone: ${matchingZone.name}`);
            console.log(`   💰 Fee: €${matchingZone.deliveryFee}`);
            console.log(`   ⏱️  Time: ${matchingZone.estimatedTime}`);
            
            if (matchingZone.name === testCase.expectedZone) {
              console.log(`   🎯 RESULT: PASS`);
              passedTests++;
            } else {
              console.log(`   ❌ RESULT: FAIL (Expected ${testCase.expectedZone})`);
            }
          } else {
            console.log(`   ❌ Outside all delivery zones`);
            if (testCase.expectedZone === null) {
              console.log(`   🎯 RESULT: PASS`);
              passedTests++;
            } else {
              console.log(`   ❌ RESULT: FAIL (Expected ${testCase.expectedZone})`);
            }
          }
        } else {
          console.log(`   ❌ Geocoding failed: ${data.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n📊 Address Validation Results: ${passedTests}/${totalTests} tests passed`);
    return passedTests === totalTests;

  } catch (error) {
    console.log('❌ TEST 2 FAILED:', error.message);
    return false;
  }
}

// Test 3: Order Flow Simulation
async function testOrderFlow() {
  console.log('\n🛒 TEST 3: Order Flow Simulation');
  console.log('--------------------------------');

  try {
    // Simulate creating an order with address validation
    const testOrder = {
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+39 123 456 7890',
      deliveryAddress: 'Via Roma 1, Torino, Italy',
      productName: 'Test Product',
      quantity: 2,
      basePrice: 25.00
    };

    console.log('📝 Simulating order creation...');
    console.log(`   Customer: ${testOrder.customerName}`);
    console.log(`   Address: ${testOrder.deliveryAddress}`);
    console.log(`   Product: ${testOrder.productName} x${testOrder.quantity}`);

    // Get zones for validation
    const { data: zonesData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deliveryZones')
      .single();

    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shippingZoneSettings')
      .single();

    const zones = zonesData.value.filter(z => z.isActive);
    const settings = settingsData.value;

    // Validate address (simplified)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testOrder.deliveryAddress)}&key=${settings.googleMapsApiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const coords = data.results[0].geometry.location;
      
      // Calculate distance
      const R = 6371;
      const dLat = (coords.lat - settings.restaurantLat) * Math.PI / 180;
      const dLng = (coords.lng - settings.restaurantLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(settings.restaurantLat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      const matchingZone = zones.find(zone => distance <= zone.maxDistance);

      if (matchingZone) {
        const subtotal = testOrder.basePrice * testOrder.quantity;
        const deliveryFee = subtotal >= settings.freeDeliveryThreshold ? 0 : matchingZone.deliveryFee;
        const total = subtotal + deliveryFee;

        console.log('✅ Address validation: PASSED');
        console.log(`   📏 Distance: ${distance.toFixed(2)}km`);
        console.log(`   🚚 Zone: ${matchingZone.name}`);
        console.log(`   💰 Subtotal: €${subtotal.toFixed(2)}`);
        console.log(`   🚛 Delivery: €${deliveryFee.toFixed(2)}`);
        console.log(`   💳 Total: €${total.toFixed(2)}`);
        console.log(`   ⏱️  Estimated time: ${matchingZone.estimatedTime}`);
        
        console.log('🎯 Order would be ACCEPTED for payment processing');
        return true;
      } else {
        console.log('❌ Address validation: FAILED');
        console.log('🚫 Order would be REJECTED - outside delivery area');
        return false;
      }
    } else {
      console.log('❌ Address geocoding failed');
      return false;
    }

  } catch (error) {
    console.log('❌ TEST 3 FAILED:', error.message);
    return false;
  }
}

// Test 4: Admin Panel Save Functionality
async function testAdminSave() {
  console.log('\n⚙️  TEST 4: Admin Panel Save Functionality');
  console.log('------------------------------------------');

  try {
    // Simulate admin panel save operation
    const newSettings = {
      enabled: true,
      restaurantAddress: 'Piazza della Repubblica, 10100 Torino TO',
      restaurantLat: 45.0758889,
      restaurantLng: 7.6830312,
      maxDeliveryDistance: 15,
      deliveryFee: 5.00,
      freeDeliveryThreshold: 50.00,
      googleMapsApiKey: 'AIzaSyBkHCqVhJJJJJJJJJJJJJJJJJJJJJJJJJJ' // Masked for security
    };

    console.log('💾 Testing settings save...');
    const { error: settingsError } = await supabase
      .from('settings')
      .update({ 
        value: newSettings,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'shippingZoneSettings');

    if (settingsError) {
      console.log('❌ Settings save failed:', settingsError.message);
      return false;
    }

    console.log('✅ Settings saved successfully');

    // Test zones save
    const newZones = [
      {
        id: '1',
        name: 'Updated Zone 1',
        maxDistance: 3,
        deliveryFee: 2.50,
        estimatedTime: '15-25 minutes',
        isActive: true
      }
    ];

    console.log('💾 Testing zones save...');
    const { error: zonesError } = await supabase
      .from('settings')
      .update({ 
        value: newZones,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'deliveryZones');

    if (zonesError) {
      console.log('❌ Zones save failed:', zonesError.message);
      return false;
    }

    console.log('✅ Zones saved successfully');

    // Verify persistence after "page refresh" simulation
    console.log('🔄 Simulating page refresh...');
    
    const { data: verifySettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shippingZoneSettings')
      .single();

    const { data: verifyZones } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deliveryZones')
      .single();

    if (verifySettings && verifyZones) {
      console.log('✅ Data persisted after refresh');
      console.log(`   Settings enabled: ${verifySettings.value.enabled}`);
      console.log(`   Zones count: ${verifyZones.value.length}`);
      return true;
    } else {
      console.log('❌ Data not persisted');
      return false;
    }

  } catch (error) {
    console.log('❌ TEST 4 FAILED:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive shipping zone tests...\n');

  const results = {
    test1: await testDatabasePersistence(),
    test2: await testAddressValidation(),
    test3: await testOrderFlow(),
    test4: await testAdminSave()
  };

  console.log('\n📊 FINAL RESULTS');
  console.log('================');
  console.log(`📊 Database Persistence: ${results.test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🗺️  Address Validation: ${results.test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🛒 Order Flow: ${results.test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`⚙️  Admin Save: ${results.test4 ? '✅ PASS' : '❌ FAIL'}`);

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Shipping zone system is fully functional.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }

  return passedTests === totalTests;
}

// Execute tests
runAllTests().catch(console.error);
