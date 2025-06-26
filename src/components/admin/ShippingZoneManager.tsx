import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Truck, Clock, DollarSign, Plus, Trash2, TestTube, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import shippingZoneService from '@/services/shippingZoneService';

interface DeliveryZone {
  id: string;
  name: string;
  maxDistance: number;
  deliveryFee: number;
  estimatedTime: string;
  isActive: boolean;
}

const ShippingZoneManager = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    restaurantAddress: '',
    restaurantLat: 0,
    restaurantLng: 0,
    maxDeliveryDistance: 15,
    deliveryFee: 5.00,
    freeDeliveryThreshold: 50.00,
    googleMapsApiKey: ''
  });
  
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [testAddress, setTestAddress] = useState('');
  const [testOrderAmount, setTestOrderAmount] = useState(25);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings and zones on component mount
    const loadData = async () => {
      try {
        // Force reload from database to get latest data
        await shippingZoneService.reloadFromDatabase();

        const currentSettings = shippingZoneService.getSettings();
        setSettings(currentSettings);

        const currentZones = shippingZoneService.getDeliveryZones();
        setDeliveryZones(currentZones);

        console.log('📊 Loaded shipping zones:', currentZones.length, 'zones');
      } catch (error) {
        console.error('Failed to load shipping data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load shipping zone data. Using defaults.',
          variant: 'destructive',
        });
      }
    };

    loadData();
  }, []);

  const handleSettingsChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    shippingZoneService.updateSettings(newSettings);
  };

  const handleSetRestaurantLocation = async () => {
    if (!settings.restaurantAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a restaurant address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await shippingZoneService.setRestaurantLocation(settings.restaurantAddress);
    
    if (success) {
      const updatedSettings = shippingZoneService.getSettings();
      setSettings(updatedSettings);
      toast({
        title: 'Success',
        description: 'Restaurant location set successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to geocode restaurant address',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const addDeliveryZone = () => {
    const newZone: DeliveryZone = {
      id: Date.now().toString(),
      name: `Zone ${deliveryZones.length + 1}`,
      maxDistance: 5,
      deliveryFee: 3.00,
      estimatedTime: '30-45 minutes',
      isActive: true
    };
    
    const updatedZones = [...deliveryZones, newZone];
    setDeliveryZones(updatedZones);
    shippingZoneService.updateDeliveryZones(updatedZones);
  };

  const updateDeliveryZone = (id: string, updates: Partial<DeliveryZone>) => {
    const updatedZones = deliveryZones.map(zone => 
      zone.id === id ? { ...zone, ...updates } : zone
    );
    setDeliveryZones(updatedZones);
    shippingZoneService.updateDeliveryZones(updatedZones);
  };

  const deleteDeliveryZone = (id: string) => {
    const updatedZones = deliveryZones.filter(zone => zone.id !== id);
    setDeliveryZones(updatedZones);
    shippingZoneService.updateDeliveryZones(updatedZones);
    toast({
      title: 'Zone Deleted',
      description: 'Delivery zone has been removed',
    });
  };

  const initializeDefaultZones = () => {
    shippingZoneService.initializeDefaultZones();
    const newZones = shippingZoneService.getDeliveryZones();
    setDeliveryZones(newZones);
    toast({
      title: 'Default Zones Added',
      description: 'Three default delivery zones have been created',
    });
  };

  const saveAllSettings = async () => {
    setIsSaving(true);
    try {
      // Force save all current settings and zones
      shippingZoneService.updateSettings(settings);
      shippingZoneService.updateDeliveryZones(deliveryZones);

      // Force reload from database to ensure consistency
      await shippingZoneService.reloadFromDatabase();

      // Update local state with fresh data
      const freshZones = shippingZoneService.getDeliveryZones();
      setDeliveryZones(freshZones);

      toast({
        title: 'Settings Saved! ✅',
        description: 'All delivery zone settings have been saved to the database.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testDeliveryAddress = async () => {
    if (!testAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a test address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await shippingZoneService.validateDeliveryAddress(testAddress, testOrderAmount);
    setTestResult(result);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: 'Test Result',
        description: result.error,
        variant: result.isWithinZone ? 'default' : 'destructive',
      });
    } else {
      toast({
        title: 'Test Successful',
        description: `Address is ${result.isWithinZone ? 'within' : 'outside'} delivery zone`,
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-optimized Main Settings */}
      <Card className="mx-1 md:mx-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Truck className="w-4 h-4 md:w-5 md:h-5" />
            Shipping Zone Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-3 md:px-6">
          {/* Enable/Disable */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <Label htmlFor="enabled" className="text-sm font-medium">Enable Delivery Zone Restrictions</Label>
              <p className="text-xs md:text-sm text-gray-500">
                Limit deliveries based on distance from restaurant
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Google Maps API Key */}
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="apiKey" className="text-sm font-medium">Google Maps API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Google Maps API Key"
              value={settings.googleMapsApiKey}
              onChange={(e) => handleSettingsChange('googleMapsApiKey', e.target.value)}
              disabled={!settings.enabled}
              className="text-sm md:text-base"
            />
            <p className="text-xs md:text-sm text-gray-500">
              Required for address validation and distance calculation
            </p>
          </div>

          <Separator />

          {/* Restaurant Location */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-medium text-sm md:text-base">Restaurant Location</h4>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="restaurantAddress" className="text-sm font-medium">Restaurant Address</Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  id="restaurantAddress"
                  placeholder="Enter your restaurant address"
                  value={settings.restaurantAddress}
                  onChange={(e) => handleSettingsChange('restaurantAddress', e.target.value)}
                  disabled={!settings.enabled}
                  className="flex-1 text-sm md:text-base"
                />
                <Button
                  onClick={handleSetRestaurantLocation}
                  disabled={!settings.enabled || isLoading}
                  className="w-full md:w-auto text-xs md:text-sm"
                  size="sm"
                >
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Set Location
                </Button>
              </div>
              {settings.restaurantLat !== 0 && settings.restaurantLng !== 0 && (
                <p className="text-xs md:text-sm text-green-600">
                  ✓ Location set: {settings.restaurantLat.toFixed(6)}, {settings.restaurantLng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="maxDistance" className="text-sm font-medium">Max Delivery Distance (km)</Label>
              <Input
                id="maxDistance"
                type="number"
                min="1"
                max="100"
                value={settings.maxDeliveryDistance}
                onChange={(e) => handleSettingsChange('maxDeliveryDistance', parseFloat(e.target.value))}
                disabled={!settings.enabled}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="defaultFee" className="text-sm font-medium">Default Delivery Fee ($)</Label>
              <Input
                id="defaultFee"
                type="number"
                min="0"
                step="0.01"
                value={settings.deliveryFee}
                onChange={(e) => handleSettingsChange('deliveryFee', parseFloat(e.target.value))}
                disabled={!settings.enabled}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="freeThreshold" className="text-sm font-medium">Free Delivery Threshold ($)</Label>
              <Input
                id="freeThreshold"
                type="number"
                min="0"
                step="0.01"
                value={settings.freeDeliveryThreshold}
                onChange={(e) => handleSettingsChange('freeDeliveryThreshold', parseFloat(e.target.value))}
                disabled={!settings.enabled}
                className="text-sm md:text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-optimized Delivery Zones */}
      <Card className="mx-1 md:mx-0">
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              Delivery Zones
            </CardTitle>
            <Button
              onClick={addDeliveryZone}
              disabled={!settings.enabled}
              size="sm"
              className="w-full md:w-auto text-xs md:text-sm"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Add Zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6">
          {deliveryZones.map((zone) => (
            <div key={zone.id} className="border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
                  <Input
                    value={zone.name}
                    onChange={(e) => updateDeliveryZone(zone.id, { name: e.target.value })}
                    className="w-full md:w-48 text-sm md:text-base"
                    disabled={!settings.enabled}
                  />
                  <Badge variant={zone.isActive ? "default" : "secondary"} className="self-start md:self-auto">
                    {zone.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-2">
                  <Switch
                    checked={zone.isActive}
                    onCheckedChange={(checked) => updateDeliveryZone(zone.id, { isActive: checked })}
                    disabled={!settings.enabled}
                  />
                  <Button
                    onClick={() => deleteDeliveryZone(zone.id)}
                    variant="destructive"
                    size="sm"
                    disabled={!settings.enabled}
                    className="h-8 w-8 md:h-9 md:w-9"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label className="text-sm font-medium">Max Distance (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={zone.maxDistance}
                    onChange={(e) => updateDeliveryZone(zone.id, { maxDistance: parseFloat(e.target.value) })}
                    disabled={!settings.enabled}
                    className="text-sm md:text-base"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="text-sm font-medium">Delivery Fee ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={zone.deliveryFee}
                    onChange={(e) => updateDeliveryZone(zone.id, { deliveryFee: parseFloat(e.target.value) })}
                    disabled={!settings.enabled}
                    className="text-sm md:text-base"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="text-sm font-medium">Estimated Time</Label>
                  <Input
                    value={zone.estimatedTime}
                    onChange={(e) => updateDeliveryZone(zone.id, { estimatedTime: e.target.value })}
                    placeholder="e.g., 30-45 minutes"
                    disabled={!settings.enabled}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          ))}

          {deliveryZones.length === 0 && (
            <div className="text-center py-6 md:py-8 text-gray-500">
              <p className="mb-3 md:mb-4 text-sm md:text-base">No delivery zones configured.</p>
              <div className="flex flex-col gap-2 md:flex-row md:gap-2 md:justify-center">
                <Button
                  onClick={addDeliveryZone}
                  disabled={!settings.enabled}
                  variant="outline"
                  className="w-full md:w-auto text-xs md:text-sm"
                  size="sm"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Add Custom Zone
                </Button>
                <Button
                  onClick={initializeDefaultZones}
                  disabled={!settings.enabled}
                  className="w-full md:w-auto text-xs md:text-sm"
                  size="sm"
                >
                  Add Default Zones
                </Button>
              </div>
            </div>
          )}

          {/* Save All Settings Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={saveAllSettings}
              disabled={!settings.enabled || isSaving}
              className="w-full md:w-auto"
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-optimized Test Address Validation */}
      <Card className="mx-1 md:mx-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <TestTube className="w-4 h-4 md:w-5 md:h-5" />
            Test Address Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="testAddress" className="text-sm font-medium">Test Address</Label>
              <Input
                id="testAddress"
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
                placeholder="Enter address to test"
                disabled={!settings.enabled}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="testAmount" className="text-sm font-medium">Order Amount ($)</Label>
              <Input
                id="testAmount"
                type="number"
                min="0"
                step="0.01"
                value={testOrderAmount}
                onChange={(e) => setTestOrderAmount(parseFloat(e.target.value))}
                disabled={!settings.enabled}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <Label className="text-sm font-medium md:invisible">Test</Label>
              <Button
                onClick={testDeliveryAddress}
                disabled={!settings.enabled || isLoading}
                className="w-full text-xs md:text-sm"
                size="sm"
              >
                {isLoading ? 'Testing...' : 'Test Address'}
              </Button>
            </div>
          </div>

          {testResult && (
            <div className={`p-3 md:p-4 rounded-lg border ${
              testResult.isWithinZone ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <h5 className="font-medium mb-2 text-sm md:text-base">Test Result:</h5>
              <div className="space-y-1 text-xs md:text-sm">
                <p><strong>Address:</strong> {testResult.formattedAddress}</p>
                <p><strong>Distance:</strong> {testResult.distance.toFixed(2)} km</p>
                <p><strong>Within Zone:</strong> {testResult.isWithinZone ? 'Yes' : 'No'}</p>
                <p><strong>Delivery Fee:</strong> ${testResult.deliveryFee.toFixed(2)}</p>
                <p><strong>Estimated Time:</strong> {testResult.estimatedTime}</p>
                {testResult.error && (
                  <p className="text-red-600"><strong>Error:</strong> {testResult.error}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingZoneManager;
