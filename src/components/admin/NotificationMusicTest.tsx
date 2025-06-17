import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, Volume2, Bell } from 'lucide-react';
import phoneNotificationService from '@/services/phoneNotificationService';

const NotificationMusicTest = () => {
  const { toast } = useToast();
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const testNotificationSound = () => {
    try {
      setIsTestingSound(true);
      phoneNotificationService.testNotificationSound();
      
      toast({
        title: 'Testing Notification Sound 🔊',
        description: 'Playing the current notification sound...',
      });

      // Reset button state after 3 seconds
      setTimeout(() => {
        setIsTestingSound(false);
      }, 3000);
    } catch (error) {
      console.error('Error testing notification sound:', error);
      toast({
        title: 'Error',
        description: 'Failed to test notification sound',
        variant: 'destructive',
      });
      setIsTestingSound(false);
    }
  };

  const testFullNotification = () => {
    try {
      setIsTestingNotification(true);
      
      // Simulate a new order notification
      phoneNotificationService.notifyNewOrder('TEST-001', 'Test Customer');
      
      toast({
        title: 'Testing Full Notification 🔔',
        description: 'Simulating a new order notification with sound, vibration, and browser notification',
        duration: 5000,
      });

      // Reset button state after 5 seconds
      setTimeout(() => {
        setIsTestingNotification(false);
      }, 5000);
    } catch (error) {
      console.error('Error testing full notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to test full notification',
        variant: 'destructive',
      });
      setIsTestingNotification(false);
    }
  };

  const stopNotifications = () => {
    try {
      phoneNotificationService.stopRinging();
      toast({
        title: 'Notifications Stopped',
        description: 'All notification sounds have been stopped',
      });
    } catch (error) {
      console.error('Error stopping notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop notifications',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Test Notification Music
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Test Sound Only */}
          <Button
            onClick={testNotificationSound}
            disabled={isTestingSound}
            variant="outline"
            className="flex items-center gap-2 h-20 flex-col"
          >
            <Play className="h-6 w-6" />
            <span className="text-sm">
              {isTestingSound ? 'Playing...' : 'Test Sound Only'}
            </span>
          </Button>

          {/* Test Full Notification */}
          <Button
            onClick={testFullNotification}
            disabled={isTestingNotification}
            className="flex items-center gap-2 h-20 flex-col bg-emerald-500 hover:bg-emerald-600"
          >
            <Bell className="h-6 w-6" />
            <span className="text-sm">
              {isTestingNotification ? 'Testing...' : 'Test Full Notification'}
            </span>
          </Button>

          {/* Stop All */}
          <Button
            onClick={stopNotifications}
            variant="destructive"
            className="flex items-center gap-2 h-20 flex-col"
          >
            <Volume2 className="h-6 w-6" />
            <span className="text-sm">Stop All Sounds</span>
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Test Options:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• <strong>Test Sound Only:</strong> Plays just the notification sound</li>
            <li>• <strong>Test Full Notification:</strong> Simulates a complete new order notification (sound + vibration + browser notification)</li>
            <li>• <strong>Stop All Sounds:</strong> Stops any currently playing notification sounds</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2">Note:</h4>
          <p className="text-amber-700 text-sm">
            Make sure your browser allows notifications and audio playback. 
            Some browsers may block autoplay until you interact with the page first.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationMusicTest;
