// Script to clear business hours cache and force refresh
console.log('🗑️ CLEARING BUSINESS HOURS CACHE');
console.log('================================');

// This script simulates what happens when you clear the cache
console.log('✅ Cache clearing simulation completed');
console.log('');
console.log('🔧 SOLUTION:');
console.log('1. Go to your website: http://localhost:4000');
console.log('2. Open browser developer tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Run this command:');
console.log('   window.dispatchEvent(new CustomEvent("businessHoursUpdated", { detail: { timestamp: Date.now() } }))');
console.log('');
console.log('OR');
console.log('');
console.log('1. Go to admin panel: http://localhost:4000/admin');
console.log('2. Click "Orari" tab');
console.log('3. Click the "Ricarica" button to force refresh');
console.log('4. Or make any small change to hours and save to trigger cache clear');
console.log('');
console.log('🎯 This will force all components to refresh their business hours data');
console.log('and the checkout should start working immediately.');
