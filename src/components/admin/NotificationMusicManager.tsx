import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Music, Upload, Play, Square, Trash2, Volume2 } from 'lucide-react';
import phoneNotificationService from '@/services/phoneNotificationService';
import ImageUploader from './ImageUploader';
import NotificationMusicTest from './NotificationMusicTest';

const NotificationMusicManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enabled: true,
    customNotificationSound: false,
    notificationSoundUrl: '',
    notificationSoundName: 'Default Ring Tone'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const currentSettings = phoneNotificationService.getSettings();
      setSettings({
        enabled: currentSettings.enabled,
        customNotificationSound: currentSettings.customNotificationSound,
        notificationSoundUrl: currentSettings.notificationSoundUrl,
        notificationSoundName: currentSettings.notificationSoundName
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSoundUpload = (soundUrl: string) => {
    try {
      // Extract filename from URL for display
      const urlParts = soundUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'Custom Notification Sound';
      
      // Update the notification service
      phoneNotificationService.updateNotificationSound(soundUrl, filename);
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        customNotificationSound: true,
        notificationSoundUrl: soundUrl,
        notificationSoundName: filename
      }));

      toast({
        title: 'Success! 🎵',
        description: 'Custom notification sound uploaded and set',
      });
    } catch (error) {
      console.error('Error uploading notification sound:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload notification sound',
        variant: 'destructive',
      });
    }
  };

  const handleResetToDefault = () => {
    try {
      phoneNotificationService.resetToDefaultSound();
      
      setSettings(prev => ({
        ...prev,
        customNotificationSound: false,
        notificationSoundUrl: '',
        notificationSoundName: 'Default Ring Tone'
      }));

      toast({
        title: 'Reset Complete',
        description: 'Notification sound reset to default ring tone',
      });
    } catch (error) {
      console.error('Error resetting notification sound:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset notification sound',
        variant: 'destructive',
      });
    }
  };

  const handleTestSound = () => {
    try {
      phoneNotificationService.testNotificationSound();
      setIsPlaying(true);
      
      // Stop playing indicator after 3 seconds (typical ring duration)
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);

      toast({
        title: 'Testing Sound 🔊',
        description: 'Playing notification sound...',
      });
    } catch (error) {
      console.error('Error testing notification sound:', error);
      toast({
        title: 'Error',
        description: 'Failed to test notification sound',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    try {
      phoneNotificationService.updateSettings({ enabled });
      setSettings(prev => ({ ...prev, enabled }));
      
      toast({
        title: enabled ? 'Notifications Enabled' : 'Notifications Disabled',
        description: enabled 
          ? 'Order notifications will now play sounds' 
          : 'Order notifications are muted',
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Notification Music Settings
          </CardTitle>
          <CardDescription>
            Upload custom notification music that plays when new orders are received
          </CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={handleToggleEnabled}
            />
            <Label htmlFor="notifications-enabled">
              {settings.enabled ? "Notifications Enabled" : "Notifications Disabled"}
            </Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Sound Display */}
          <div className="space-y-2">
            <Label>Current Notification Sound</Label>
            <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 border">
              <Music size={20} className="text-muted-foreground" />
              <span className="font-medium flex-1 truncate">
                {settings.notificationSoundName}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleTestSound}
                disabled={isPlaying}
              >
                {isPlaying ? <Square size={16} /> : <Play size={16} />}
              </Button>
            </div>
          </div>

          {/* Upload New Sound */}
          <div className="space-y-2">
            <Label>Upload Custom Notification Sound</Label>
            <ImageUploader
              onImageSelected={handleSoundUpload}
              buttonLabel="Upload Audio File"
              className="w-full"
              bucketName="uploads"
              folderPath="notification-sounds"
              acceptedFileTypes="audio/*"
              maxFileSize={5 * 1024 * 1024} // 5MB limit
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: MP3, WAV, OGG, M4A (max 5MB)
            </p>
          </div>

          {/* Reset to Default */}
          {settings.customNotificationSound && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleResetToDefault}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} className="mr-2" />
                Reset to Default Ring Tone
              </Button>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Upload your custom notification sound (music, ringtone, etc.)</li>
              <li>• The sound will play when new orders are received</li>
              <li>• Test the sound using the play button</li>
              <li>• You can reset to the default ring tone anytime</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Test Component */}
      <NotificationMusicTest />
    </div>
  );
};

export default NotificationMusicManager;
