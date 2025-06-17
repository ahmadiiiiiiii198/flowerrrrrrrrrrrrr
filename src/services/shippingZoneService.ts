// Shipping Zone Service with Google Maps API Integration
// This service manages delivery zones based on distance from restaurant

interface ShippingZoneSettings {
  enabled: boolean;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
  maxDeliveryDistance: number; // in kilometers
  deliveryFee: number;
  freeDeliveryThreshold: number; // minimum order amount for free delivery
  googleMapsApiKey: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  maxDistance: number; // in km
  deliveryFee: number;
  estimatedTime: string; // e.g., "30-45 minutes"
  isActive: boolean;
}

interface AddressValidationResult {
  isValid: boolean;
  isWithinZone: boolean;
  distance: number; // in kilometers
  deliveryFee: number;
  estimatedTime: string;
  formattedAddress: string;
  coordinates: { lat: number; lng: number };
  error?: string;
}

class ShippingZoneService {
  private settings: ShippingZoneSettings;
  private deliveryZones: DeliveryZone[];

  constructor() {
    this.settings = {
      enabled: true,
      restaurantAddress: 'Piazza della Repubblica, 10100 Torino TO',
      restaurantLat: 45.0703, // Approximate coordinates for Piazza della Repubblica, Torino
      restaurantLng: 7.6869,
      maxDeliveryDistance: 15, // 15km default
      deliveryFee: 5.00,
      freeDeliveryThreshold: 50.00,
      googleMapsApiKey: ''
    };
    this.deliveryZones = [];
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'shippingZoneSettings')
        .single();

      if (!error && data) {
        this.settings = { ...this.settings, ...data.value };
      }

      // Load delivery zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'deliveryZones')
        .single();

      if (!zonesError && zonesData && zonesData.value !== null) {
        this.deliveryZones = zonesData.value;
      }
    } catch (error) {
      console.warn('Failed to load shipping zone settings:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('shippingZoneSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
      const savedZones = localStorage.getItem('deliveryZones');
      if (savedZones) {
        this.deliveryZones = JSON.parse(savedZones);
      }
    }
  }

  private async saveSettings() {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      console.log('💾 Saving shipping settings and delivery zones...');
      console.log('📊 Zones to save:', this.deliveryZones.length);

      // Save settings - try update first, then insert if not exists
      const settingsUpdateResult = await supabase
        .from('settings')
        .update({
          value: this.settings,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'shippingZoneSettings')
        .select();

      if (settingsUpdateResult.error) {
        console.log('Settings update failed, trying insert:', settingsUpdateResult.error.message);
        // If update fails, try insert
        const { error: settingsInsertError } = await supabase
          .from('settings')
          .insert({
            key: 'shippingZoneSettings',
            value: this.settings,
            updated_at: new Date().toISOString()
          });

        if (settingsInsertError) throw settingsInsertError;
      } else {
        console.log('✅ Settings saved successfully');
      }

      // Save delivery zones - try update first, then insert if not exists
      const zonesUpdateResult = await supabase
        .from('settings')
        .update({
          value: this.deliveryZones,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'deliveryZones')
        .select();

      if (zonesUpdateResult.error) {
        console.log('Zones update failed, trying insert:', zonesUpdateResult.error.message);
        // If update fails, try insert
        const { error: zonesInsertError } = await supabase
          .from('settings')
          .insert({
            key: 'deliveryZones',
            value: this.deliveryZones,
            updated_at: new Date().toISOString()
          });

        if (zonesInsertError) throw zonesInsertError;
      } else {
        console.log('✅ Delivery zones saved successfully:', this.deliveryZones.length, 'zones');
      }

    } catch (error) {
      console.error('❌ Failed to save shipping zone settings:', error);
      // Fallback to localStorage
      localStorage.setItem('shippingZoneSettings', JSON.stringify(this.settings));
      localStorage.setItem('deliveryZones', JSON.stringify(this.deliveryZones));
      console.log('💾 Saved to localStorage as fallback');
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Geocode address using Google Maps API
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
    if (!this.settings.googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.settings.googleMapsApiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formattedAddress: result.formatted_address
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Find appropriate delivery zone based on distance
  private findDeliveryZone(distance: number): DeliveryZone | null {
    const activeZones = this.deliveryZones.filter(zone => zone.isActive);
    
    for (const zone of activeZones.sort((a, b) => a.maxDistance - b.maxDistance)) {
      if (distance <= zone.maxDistance) {
        return zone;
      }
    }
    
    return null;
  }

  // Validate delivery address
  public async validateDeliveryAddress(address: string, orderAmount: number = 0): Promise<AddressValidationResult> {
    if (!this.settings.enabled) {
      return {
        isValid: true,
        isWithinZone: true,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 }
      };
    }

    try {
      // Geocode the delivery address
      const geocodeResult = await this.geocodeAddress(address);
      
      if (!geocodeResult) {
        return {
          isValid: false,
          isWithinZone: false,
          distance: 0,
          deliveryFee: 0,
          estimatedTime: 'N/A',
          formattedAddress: address,
          coordinates: { lat: 0, lng: 0 },
          error: 'Unable to find the address. Please check and try again.'
        };
      }

      // Calculate distance from restaurant
      const distance = this.calculateDistance(
        this.settings.restaurantLat,
        this.settings.restaurantLng,
        geocodeResult.lat,
        geocodeResult.lng
      );

      // Check if within maximum delivery distance
      if (distance > this.settings.maxDeliveryDistance) {
        return {
          isValid: true,
          isWithinZone: false,
          distance,
          deliveryFee: 0,
          estimatedTime: 'N/A',
          formattedAddress: geocodeResult.formattedAddress,
          coordinates: geocodeResult,
          error: `Sorry, we don't deliver to this area. Maximum delivery distance is ${this.settings.maxDeliveryDistance}km.`
        };
      }

      // Find appropriate delivery zone
      const deliveryZone = this.findDeliveryZone(distance);
      
      if (!deliveryZone) {
        return {
          isValid: true,
          isWithinZone: false,
          distance,
          deliveryFee: 0,
          estimatedTime: 'N/A',
          formattedAddress: geocodeResult.formattedAddress,
          coordinates: geocodeResult,
          error: 'No delivery zone configured for this distance.'
        };
      }

      // Calculate delivery fee (free if order amount exceeds threshold)
      const deliveryFee = orderAmount >= this.settings.freeDeliveryThreshold ? 0 : deliveryZone.deliveryFee;

      return {
        isValid: true,
        isWithinZone: true,
        distance,
        deliveryFee,
        estimatedTime: deliveryZone.estimatedTime,
        formattedAddress: geocodeResult.formattedAddress,
        coordinates: geocodeResult
      };

    } catch (error) {
      console.error('Address validation error:', error);
      return {
        isValid: false,
        isWithinZone: false,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 },
        error: 'Unable to validate address. Please try again.'
      };
    }
  }

  // Update settings
  public updateSettings(newSettings: Partial<ShippingZoneSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Update delivery zones
  public updateDeliveryZones(zones: DeliveryZone[]) {
    this.deliveryZones = zones;
    this.saveSettings();
  }

  // Get current settings
  public getSettings(): ShippingZoneSettings {
    return { ...this.settings };
  }

  // Get delivery zones
  public getDeliveryZones(): DeliveryZone[] {
    return [...this.deliveryZones];
  }

  // Set restaurant location
  public async setRestaurantLocation(address: string) {
    const geocodeResult = await this.geocodeAddress(address);
    if (geocodeResult) {
      // Keep the original address format, only update coordinates
      this.settings.restaurantAddress = address; // Preserve the original address
      this.settings.restaurantLat = geocodeResult.lat;
      this.settings.restaurantLng = geocodeResult.lng;
      this.saveSettings();
      return true;
    }
    return false;
  }

  // Initialize default delivery zones
  public initializeDefaultZones() {
    this.deliveryZones = [
      {
        id: '1',
        name: 'Zone 1 (0-5km)',
        maxDistance: 5,
        deliveryFee: 3.00,
        estimatedTime: '20-30 minutes',
        isActive: true
      },
      {
        id: '2',
        name: 'Zone 2 (5-10km)',
        maxDistance: 10,
        deliveryFee: 5.00,
        estimatedTime: '30-45 minutes',
        isActive: true
      },
      {
        id: '3',
        name: 'Zone 3 (10-15km)',
        maxDistance: 15,
        deliveryFee: 8.00,
        estimatedTime: '45-60 minutes',
        isActive: true
      }
    ];
    this.saveSettings();
  }
}

// Export singleton instance
export const shippingZoneService = new ShippingZoneService();
export default shippingZoneService;
