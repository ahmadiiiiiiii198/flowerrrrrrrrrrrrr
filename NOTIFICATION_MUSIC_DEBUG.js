// Comprehensive Notification Music Debug Test
// Run this to identify why notification music isn't playing

console.log('🔍 NOTIFICATION MUSIC DEBUG TEST');
console.log('================================');

// Test 1: Check current page detection
console.log('\n📍 TEST 1: Page Detection');
console.log('-------------------------');

const currentPage = window.location.pathname;
console.log('Current page:', currentPage);

const adminPages = ['/admin', '/orders', '/order-dashboard'];
const isAdminPage = adminPages.some(page => currentPage.startsWith(page));

console.log('Admin pages:', adminPages);
console.log('Is admin page:', isAdminPage ? '✅ YES' : '❌ NO');

if (!isAdminPage) {
  console.log('🚨 ISSUE FOUND: Not on admin page - notifications will be blocked');
  console.log('💡 SOLUTION: Navigate to /orders or /admin to enable notifications');
}

// Test 2: Check if phoneNotificationService is available
console.log('\n🔧 TEST 2: Service Availability');
console.log('-------------------------------');

try {
  // Try to access the service
  if (typeof phoneNotificationService !== 'undefined') {
    console.log('✅ phoneNotificationService is available');
    
    // Check settings
    const settings = phoneNotificationService.getSettings();
    console.log('📊 Current settings:');
    console.log('  - Enabled:', settings.enabled ? '✅' : '❌');
    console.log('  - Custom sound:', settings.customNotificationSound ? '✅' : '❌');
    console.log('  - Sound name:', settings.notificationSoundName);
    console.log('  - Sound URL:', settings.notificationSoundUrl || 'Default');
    
    if (!settings.enabled) {
      console.log('🚨 ISSUE FOUND: Notifications are disabled in settings');
      console.log('💡 SOLUTION: Enable notifications in Admin → Notification Music');
    }
    
  } else {
    console.log('❌ phoneNotificationService is not available');
    console.log('🚨 ISSUE FOUND: Service not imported or initialized');
    console.log('💡 SOLUTION: Check if service is properly imported in the component');
  }
} catch (error) {
  console.log('❌ Error accessing phoneNotificationService:', error.message);
}

// Test 3: Check browser audio capabilities
console.log('\n🔊 TEST 3: Browser Audio Capabilities');
console.log('------------------------------------');

// Check AudioContext support
if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
  console.log('✅ AudioContext is supported');
  
  try {
    const AudioContextClass = AudioContext || webkitAudioContext;
    const testContext = new AudioContextClass();
    console.log('✅ AudioContext can be created');
    console.log('  - State:', testContext.state);
    console.log('  - Sample rate:', testContext.sampleRate);
    
    if (testContext.state === 'suspended') {
      console.log('⚠️  AudioContext is suspended (normal until user interaction)');
      console.log('💡 Audio will work after user clicks something');
    }
    
    testContext.close();
  } catch (error) {
    console.log('❌ Error creating AudioContext:', error.message);
    console.log('🚨 ISSUE FOUND: AudioContext creation failed');
  }
} else {
  console.log('❌ AudioContext is not supported in this browser');
  console.log('🚨 ISSUE FOUND: Browser does not support Web Audio API');
}

// Test 4: Check autoplay policy
console.log('\n🎵 TEST 4: Autoplay Policy');
console.log('-------------------------');

if (navigator.userAgent.includes('Chrome')) {
  console.log('🌐 Chrome detected - autoplay policy may be strict');
  console.log('💡 Audio may require user interaction first');
} else if (navigator.userAgent.includes('Firefox')) {
  console.log('🌐 Firefox detected - autoplay policy may be moderate');
} else if (navigator.userAgent.includes('Safari')) {
  console.log('🌐 Safari detected - autoplay policy is very strict');
  console.log('💡 Audio definitely requires user interaction first');
}

// Test 5: Manual audio test
console.log('\n🧪 TEST 5: Manual Audio Test');
console.log('----------------------------');

console.log('Creating test audio...');
try {
  const AudioContextClass = AudioContext || webkitAudioContext;
  const audioContext = new AudioContextClass();
  
  // Create a simple beep
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  console.log('🔊 Playing test beep...');
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
  
  console.log('✅ Test audio created and played');
  console.log('💡 If you heard a beep, audio is working');
  console.log('💡 If no beep, check browser audio settings');
  
} catch (error) {
  console.log('❌ Error creating test audio:', error.message);
  console.log('🚨 ISSUE FOUND: Cannot create audio');
}

// Test 6: Check for common issues
console.log('\n🔍 TEST 6: Common Issues Check');
console.log('-----------------------------');

// Check if page is loaded over HTTPS (required for some audio features)
if (location.protocol === 'https:' || location.hostname === 'localhost') {
  console.log('✅ Page is served over HTTPS or localhost');
} else {
  console.log('⚠️  Page is served over HTTP - some audio features may be limited');
}

// Check if user has interacted with the page
console.log('💡 To test notifications properly:');
console.log('  1. Make sure you are on /orders page');
console.log('  2. Enable notifications in Admin → Notification Music');
console.log('  3. Click somewhere on the page first (for autoplay policy)');
console.log('  4. Test the notification sound manually');
console.log('  5. Then test with a real order');

console.log('\n🎯 SUMMARY');
console.log('----------');
console.log('If notifications still don\'t work after checking all above:');
console.log('1. Check browser console for errors');
console.log('2. Try a different browser');
console.log('3. Check browser audio/notification permissions');
console.log('4. Ensure volume is up and not muted');
console.log('5. Test with a simple order to trigger notifications');

console.log('\n✅ Debug test complete!');
