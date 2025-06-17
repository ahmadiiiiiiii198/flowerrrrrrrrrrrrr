import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Bell, Vibrate, Volume2, VolumeX } from 'lucide-react';
import { phoneNotificationService } from '@/services/phoneNotificationService';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileNotificationTest = () => {
  const [isRinging, setIsRinging] = useState(false);
  const [ringCount, setRingCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [audioContextSupported, setAudioContextSupported] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Check vibration support
    setVibrationSupported('vibrate' in navigator);

    // Check audio context support
    setAudioContextSupported('AudioContext' in window || 'webkitAudioContext' in window);

    // Update ring status periodically
    const interval = setInterval(() => {
      setIsRinging(phoneNotificationService.isCurrentlyRinging());
      setRingCount(phoneNotificationService.getRingCount());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        toast({
          title: permission === 'granted' ? 'Permission Granted' : 'Permission Denied',
          description: permission === 'granted' 
            ? 'Browser notifications are now enabled' 
            : 'Browser notifications are disabled',
          variant: permission === 'granted' ? 'default' : 'destructive'
        });
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast({
          title: 'Error',
          description: 'Failed to request notification permission',
          variant: 'destructive'
        });
      }
    }
  };

  const testVibration = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
        toast({
          title: 'Vibration Test',
          description: 'Your device should have vibrated',
        });
      } catch (error) {
        toast({
          title: 'Vibration Failed',
          description: 'Could not trigger vibration',
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Vibration Not Supported',
        description: 'Your device does not support vibration',
        variant: 'destructive'
      });
    }
  };

  const testAudio = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAw==');
      audio.volume = 0.5;
      audio.play().then(() => {
        toast({
          title: 'Audio Test',
          description: 'Audio playback is working',
        });
      }).catch(error => {
        toast({
          title: 'Audio Failed',
          description: 'Could not play audio: ' + error.message,
          variant: 'destructive'
        });
      });
    } catch (error) {
      toast({
        title: 'Audio Error',
        description: 'Audio is not supported',
        variant: 'destructive'
      });
    }
  };

  const testFullNotification = () => {
    phoneNotificationService.notifyNewOrder('TEST-MOBILE-001', 'Mobile Test Customer');
    toast({
      title: 'Mobile Notification Test',
      description: 'Full notification test triggered (audio + vibration + browser notification)',
    });
  };

  const stopRinging = () => {
    phoneNotificationService.stopRinging();
    toast({
      title: 'Ringing Stopped',
      description: 'All notifications have been stopped',
    });
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">Not Requested</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Notification Test
            {isMobile && <Badge variant="outline">Mobile Device</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Capabilities */}
          <div className="space-y-4">
            <h4 className="font-medium">Device Capabilities</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Browser Notifications</span>
                </div>
                {getPermissionBadge()}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4" />
                  <span className="text-sm">Vibration</span>
                </div>
                <Badge variant={vibrationSupported ? "default" : "secondary"} 
                       className={vibrationSupported ? "bg-green-100 text-green-800" : ""}>
                  {vibrationSupported ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {audioContextSupported ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span className="text-sm">Audio Context</span>
                </div>
                <Badge variant={audioContextSupported ? "default" : "secondary"}
                       className={audioContextSupported ? "bg-green-100 text-green-800" : ""}>
                  {audioContextSupported ? "Supported" : "Not Supported"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Individual Tests */}
          <div className="space-y-4">
            <h4 className="font-medium">Individual Tests</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={requestNotificationPermission}
                disabled={notificationPermission === 'granted'}
                variant="outline"
              >
                <Bell className="w-4 h-4 mr-2" />
                Request Notification Permission
              </Button>
              
              <Button 
                onClick={testVibration}
                disabled={!vibrationSupported}
                variant="outline"
              >
                <Vibrate className="w-4 h-4 mr-2" />
                Test Vibration
              </Button>
              
              <Button 
                onClick={testAudio}
                variant="outline"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test Audio
              </Button>
              
              <Button 
                onClick={testFullNotification}
                variant="default"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Test Full Notification
              </Button>
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-4">
            <h4 className="font-medium">Current Status</h4>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Currently Ringing</span>
              <Badge variant={isRinging ? "destructive" : "secondary"}>
                {isRinging ? `Yes (${ringCount} rings)` : "No"}
              </Badge>
            </div>
            
            {isRinging && (
              <Button onClick={stopRinging} variant="destructive" className="w-full">
                Stop Ringing
              </Button>
            )}
          </div>

          {/* Mobile Tips */}
          {isMobile && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <h5 className="font-medium text-sm text-amber-800 mb-2">Mobile Tips:</h5>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Make sure your device is not in silent mode for audio notifications</li>
                <li>• Vibration may not work if your device is in silent mode</li>
                <li>• Browser notifications require permission and may not work in private browsing</li>
                <li>• Some mobile browsers may block audio without user interaction</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileNotificationTest;
