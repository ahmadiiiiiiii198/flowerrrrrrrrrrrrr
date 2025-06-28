import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Clock, DollarSign, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import shippingZoneService from '@/services/shippingZoneService';

interface AddressValidatorProps {
  onValidAddress: (validationResult: any) => void;
  orderAmount?: number;
  initialAddress?: string;
}

const AddressValidator = ({ onValidAddress, orderAmount = 0, initialAddress = '' }: AddressValidatorProps) => {
  const [address, setAddress] = useState(initialAddress);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load shipping zone settings
    const currentSettings = shippingZoneService.getSettings();
    setSettings(currentSettings);
  }, []);

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      validateAddress(initialAddress);
    }
  }, [initialAddress]);

  const validateAddress = async (addressToValidate?: string) => {
    const targetAddress = addressToValidate || address;
    
    if (!targetAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a delivery address',
        variant: 'destructive',
      });
      return;
    }

    if (!settings?.enabled) {
      // If shipping zones are disabled, accept any address
      const result = {
        isValid: true,
        isWithinZone: true,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'Standard delivery',
        formattedAddress: targetAddress,
        coordinates: { lat: 0, lng: 0 }
      };
      setValidationResult(result);
      onValidAddress(result);
      return;
    }

    setIsValidating(true);
    
    try {
      const result = await shippingZoneService.validateDeliveryAddress(targetAddress, orderAmount);
      setValidationResult(result);
      
      if (result.isValid && result.isWithinZone) {
        onValidAddress(result);
        toast({
          title: 'Address Validated',
          description: 'Delivery available',
        });
      } else if (result.error) {
        toast({
          title: 'Delivery Not Available',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Address validation error:', error);
      toast({
        title: 'Validation Error',
        description: 'Unable to validate address. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    // Clear previous validation when address changes
    if (validationResult) {
      setValidationResult(null);
    }

    // Auto-validate address with debounce
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    const timeout = setTimeout(() => {
      if (value.trim().length > 10) {
        validateAddress(value.trim());
      }
    }, 1000);

    setValidationTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Delivery Address Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Input */}
        <div className="space-y-2">
          <Label htmlFor="deliveryAddress" className="flex items-center gap-2">
            Delivery Address
            {isValidating && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            )}
            {validationResult && validationResult.isValid && validationResult.isWithinZone && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
            {validationResult && (!validationResult.isValid || !validationResult.isWithinZone) && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </Label>
          <Input
            id="deliveryAddress"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Enter your full delivery address (auto-validation)"
            className={`${
              validationResult
                ? validationResult.isValid && validationResult.isWithinZone
                  ? 'border-green-300 focus:border-green-500'
                  : 'border-red-300 focus:border-red-500'
                : ''
            }`}
          />
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className="space-y-4">
            {/* Status Alert */}
            <Alert className={validationResult.isWithinZone ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {validationResult.isWithinZone ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={validationResult.isWithinZone ? 'text-green-800' : 'text-red-800'}>
                  {validationResult.isWithinZone 
                    ? 'Great! We deliver to this address.' 
                    : validationResult.error || 'Sorry, we don\'t deliver to this area.'
                  }
                </AlertDescription>
              </div>
            </Alert>

            {/* Address Details */}
            {validationResult.isValid && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium">Delivery Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Formatted Address</p>
                      <p className="text-gray-600">{validationResult.formattedAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Distance</p>
                      <p className="text-gray-600">{validationResult.distance.toFixed(2)} km</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Estimated Delivery Time</p>
                      <p className="text-gray-600">{validationResult.estimatedTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Delivery Fee</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          ${validationResult.deliveryFee.toFixed(2)}
                        </span>
                        {validationResult.deliveryFee === 0 && orderAmount >= settings.freeDeliveryThreshold && (
                          <Badge variant="secondary" className="text-xs">
                            Free delivery!
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Free Delivery Threshold Info */}
                {validationResult.deliveryFee > 0 && orderAmount < settings.freeDeliveryThreshold && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 Add ${(settings.freeDeliveryThreshold - orderAmount).toFixed(2)} more to your order for free delivery!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shipping Zone Info */}
        {settings.enabled && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-sm text-blue-800 mb-2">Delivery Information</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• We deliver within {settings.maxDeliveryDistance}km of our restaurant</li>
              <li>• Free delivery on orders over ${settings.freeDeliveryThreshold.toFixed(2)}</li>
              <li>• Delivery fees vary by distance from restaurant</li>
              <li>• Address validation ensures accurate delivery</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressValidator;
