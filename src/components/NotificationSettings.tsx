// Notification Settings Component
// Comprehensive settings interface for the notification system

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Bell, 
  Settings,
  TestTube,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import notificationService from '@/services/notificationService';
import audioNotificationService from '@/services/audioNotificationService';
import { 
  NotificationSettings as NotificationSettingsType, 
  NotificationType,
  DEFAULT_NOTIFICATION_SETTINGS 
} from '@/types/notifications';

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsType>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const currentSettings = notificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await notificationService.updateSettings(settings);
      toast({
        title: 'Settings Saved',
        description: 'Notification settings have been updated',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettingsType, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNotificationType = (
    type: NotificationType, 
    key: string, 
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: {
          ...prev.notificationTypes[type],
          [key]: value
        }
      }
    }));
  };

  const testNotificationSound = (type: NotificationType) => {
    audioNotificationService.testNotificationSound(type);
    toast({
      title: `Testing ${type} sound`,
      description: 'Playing notification sound...',
    });
  };

  const testAllSounds = () => {
    audioNotificationService.testAllSounds();
    toast({
      title: 'Testing All Sounds',
      description: 'Playing all notification sounds in sequence...',
    });
  };

  const stopAllSounds = () => {
    audioNotificationService.stopNotificationSound();
    toast({
      title: 'Sounds Stopped',
      description: 'All notification sounds have been stopped',
    });
  };

  const getNotificationTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case 'order_created': return 'New Order';
      case 'order_paid': return 'Order Paid';
      case 'order_updated': return 'Order Updated';
      case 'order_cancelled': return 'Order Cancelled';
      case 'payment_failed': return 'Payment Failed';
      case 'payment_completed': return 'Payment Completed';
      default: return type;
    }
  };

  const getPriorityLabel = (priority: number): string => {
    switch (priority) {
      case 5: return 'Critical';
      case 4: return 'High';
      case 3: return 'Medium';
      case 2: return 'Low';
      case 1: return 'Very Low';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-blue-500';
      case 1: return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading notification settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-enabled">Enable Notifications</Label>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound-enabled">Sound Notifications</Label>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="vibration-enabled">Vibration (Mobile)</Label>
            <Switch
              id="vibration-enabled"
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="browser-notifications">Browser Notifications</Label>
            <Switch
              id="browser-notifications"
              checked={settings.browserNotificationsEnabled}
              onCheckedChange={(checked) => updateSetting('browserNotificationsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Ring Duration: {settings.ringDuration} seconds</Label>
            <Slider
              value={[settings.ringDuration]}
              onValueChange={([value]) => updateSetting('ringDuration', value)}
              max={10}
              min={1}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Ring Interval: {settings.ringInterval} seconds</Label>
            <Slider
              value={[settings.ringInterval]}
              onValueChange={([value]) => updateSetting('ringInterval', value)}
              max={10}
              min={1}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Maximum Rings: {settings.maxRings}</Label>
            <Slider
              value={[settings.maxRings]}
              onValueChange={([value]) => updateSetting('maxRings', value)}
              max={20}
              min={1}
              step={1}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testAllSounds}
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              Test All Sounds
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={stopAllSounds}
              className="flex items-center gap-2"
            >
              <VolumeX className="w-4 h-4" />
              Stop Sounds
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(settings.notificationTypes).map(([type, config]) => (
              <div key={type} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{getNotificationTypeLabel(type as NotificationType)}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-white ${getPriorityColor(config.priority)}`}
                    >
                      {getPriorityLabel(config.priority)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testNotificationSound(type as NotificationType)}
                    className="flex items-center gap-1"
                  >
                    <TestTube className="w-3 h-3" />
                    Test
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Enabled</Label>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => 
                        updateNotificationType(type as NotificationType, 'enabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Sound</Label>
                    <Switch
                      checked={config.soundEnabled}
                      onCheckedChange={(checked) => 
                        updateNotificationType(type as NotificationType, 'soundEnabled', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Persistent</Label>
                    <Switch
                      checked={config.persistentNotification}
                      onCheckedChange={(checked) => 
                        updateNotificationType(type as NotificationType, 'persistentNotification', checked)
                      }
                    />
                  </div>

                  <div>
                    <Label>Priority: {config.priority}</Label>
                    <Slider
                      value={[config.priority]}
                      onValueChange={([value]) => 
                        updateNotificationType(type as NotificationType, 'priority', value)
                      }
                      max={5}
                      min={1}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
