// Test Google Maps API directly
const testGoogleMapsAPI = async () => {
  const apiKey = 'AIzaSyBkHCjFa0GKD7lJThAyFnSaeCXFDsBtJhs';
  const testAddress = 'corso principe oddone 82, torino';
  
  console.log('🧪 Testing Google Maps API...');
  console.log('📍 Test address:', testAddress);
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;
    console.log('🔗 Request URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 API Response:', data);
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      console.log('✅ Geocoding successful!');
      console.log('📍 Coordinates:', result.geometry.location);
      console.log('📮 Formatted address:', result.formatted_address);
      
      // Calculate distance from restaurant
      const restaurantLat = 45.0703;
      const restaurantLng = 7.6869;
      const addressLat = result.geometry.location.lat;
      const addressLng = result.geometry.location.lng;
      
      const distance = calculateDistance(restaurantLat, restaurantLng, addressLat, addressLng);
      console.log('📏 Distance from restaurant:', distance.toFixed(2), 'km');
      
      return {
        success: true,
        coordinates: result.geometry.location,
        formattedAddress: result.formatted_address,
        distance: distance
      };
    } else {
      console.error('❌ Geocoding failed:', data.status, data.error_message);
      return { success: false, error: data.status };
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error.message };
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Run the test
if (typeof window !== 'undefined') {
  window.testGoogleMaps = testGoogleMapsAPI;
  console.log('🔧 Test function available as window.testGoogleMaps()');
}

export { testGoogleMapsAPI };
