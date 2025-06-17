import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Phone, Bell, Settings, TestTube, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import phoneNotificationService from '@/services/phoneNotificationService';

const PhoneNotificationSettings = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    phoneNumber: '',
    ringDuration: 3,
    ringInterval: 2,
    maxRings: 10,
    vibrationEnabled: true,
    browserNotificationEnabled: true
  });
  const [isRinging, setIsRinging] = useState(false);
  const [ringCount, setRingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Load current settings
    const currentSettings = phoneNotificationService.getSettings();
    setSettings(currentSettings);

    // Update ring status periodically
    const interval = setInterval(() => {
      setIsRinging(phoneNotificationService.isCurrentlyRinging());
      setRingCount(phoneNotificationService.getRingCount());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleSettingsChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    phoneNotificationService.updateSettings(newSettings);
  };

  const testNotification = () => {
    phoneNotificationService.notifyNewOrder('TEST-001', 'Test Customer');
    toast({
      title: 'Test Notification Sent',
      description: 'Phone notification test has been triggered',
    });
  };

  const stopRinging = () => {
    phoneNotificationService.stopRinging();
    toast({
      title: 'Ringing Stopped',
      description: 'Phone notification ringing has been stopped',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Phone Notification Settings
            {isRinging && (
              <Badge variant="destructive" className="animate-pulse">
                <Bell className="w-3 h-3 mr-1" />
                Ringing ({ringCount}/{settings.maxRings})
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enabled">Enable Phone Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive phone notifications when new orders are placed
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (for SMS)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+393498851455"
              value={settings.phoneNumber}
              onChange={(e) => handleSettingsChange('phoneNumber', e.target.value)}
              disabled={!settings.enabled}
            />
            <p className="text-sm text-gray-500">
              Enter your phone number to receive SMS notifications (optional)
            </p>
          </div>

          <Separator />

          {/* Ring Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Ring Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ringDuration">Ring Duration (seconds)</Label>
                <Input
                  id="ringDuration"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.ringDuration}
                  onChange={(e) => handleSettingsChange('ringDuration', parseInt(e.target.value))}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ringInterval">Interval Between Rings (seconds)</Label>
                <Input
                  id="ringInterval"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.ringInterval}
                  onChange={(e) => handleSettingsChange('ringInterval', parseInt(e.target.value))}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRings">Maximum Rings</Label>
                <Input
                  id="maxRings"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxRings}
                  onChange={(e) => handleSettingsChange('maxRings', parseInt(e.target.value))}
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Controls */}
          <div className="space-y-4">
            <h4 className="font-medium">Test & Control</h4>
            <div className="flex gap-3">
              <Button
                onClick={testNotification}
                disabled={!settings.enabled}
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                Test Notification
              </Button>
              
              {isRinging && (
                <Button
                  onClick={stopRinging}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <VolumeX className="w-4 h-4" />
                  Stop Ringing
                </Button>
              )}
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h5 className="font-medium text-sm">Current Status</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Notifications:</span>
                <Badge variant={settings.enabled ? "default" : "secondary"} className="ml-2">
                  {settings.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Currently Ringing:</span>
                <Badge variant={isRinging ? "destructive" : "secondary"} className="ml-2">
                  {isRinging ? `Yes (${ringCount}/${settings.maxRings})` : "No"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Mobile Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Mobile Settings</h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vibrationEnabled">Vibration (Mobile)</Label>
                <p className="text-sm text-gray-500">
                  Vibrate mobile device when new orders arrive
                </p>
              </div>
              <Switch
                id="vibrationEnabled"
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => handleSettingsChange('vibrationEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browserNotificationEnabled">Browser Notifications</Label>
                <p className="text-sm text-gray-500">
                  Show browser notifications for new orders
                </p>
              </div>
              <Switch
                id="browserNotificationEnabled"
                checked={settings.browserNotificationEnabled}
                onCheckedChange={(checked) => handleSettingsChange('browserNotificationEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-sm text-blue-800 mb-2">How it works:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• When a new order is received, your browser will play a phone ring tone</li>
              <li>• On mobile devices, the phone will also vibrate if enabled</li>
              <li>• Browser notifications will appear if permission is granted</li>
              <li>• The ringing will continue until you stop it or reach the maximum rings</li>
              <li>• If you provide a phone number, you'll also receive SMS notifications</li>
              <li>• Make sure your browser allows audio playback and notifications to work</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneNotificationSettings;
