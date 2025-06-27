// Notification Center Component
// Modern notification display and management interface

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bell, 
  Check, 
  X, 
  Volume2, 
  VolumeX, 
  Settings, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import notificationService from '@/services/notificationService';
import audioNotificationService from '@/services/audioNotificationService';
import { NotificationData, NotificationType } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import orderEventHandler from '@/services/orderEventHandler';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    loadSettings();
    
    // Listen for new notifications
    notificationService.addListener('notification-center', handleNewNotification);
    
    // Monitor audio status
    const audioInterval = setInterval(() => {
      setIsPlaying(audioNotificationService.isCurrentlyPlaying());
    }, 500);

    return () => {
      notificationService.removeListener('notification-center');
      clearInterval(audioInterval);
    };
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(false), // Get all notifications
        notificationService.getNotificationCount()
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    const settings = notificationService.getSettings();
    setSoundEnabled(settings.soundEnabled);
  };

  const handleNewNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast for new notification
    toast({
      title: '🔔 New Notification',
      description: notification.message,
      duration: 5000,
    });
  };

  const markAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
      // Stop any playing audio
      audioNotificationService.stopNotificationSound();
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const success = await notificationService.deleteNotification(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const toggleSound = async () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    
    await notificationService.updateSettings({
      soundEnabled: newSoundEnabled
    });

    if (!newSoundEnabled) {
      audioNotificationService.stopNotificationSound();
    }

    toast({
      title: newSoundEnabled ? '🔊 Sound Enabled' : '🔇 Sound Disabled',
      description: `Notification sounds ${newSoundEnabled ? 'enabled' : 'disabled'}`,
    });
  };

  const stopAudio = () => {
    audioNotificationService.stopNotificationSound();
    toast({
      title: '🔇 Audio Stopped',
      description: 'Notification audio has been stopped',
    });
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'order_created':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'order_paid':
      case 'payment_completed':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'order_cancelled':
      case 'payment_failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'order_updated':
        return <Info className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return 'border-red-500 bg-red-50';
      case 4: return 'border-orange-500 bg-orange-50';
      case 3: return 'border-yellow-500 bg-yellow-50';
      case 2: return 'border-blue-500 bg-blue-50';
      case 1: return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {isPlaying && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopAudio}
                      className="text-red-600 hover:text-red-700"
                    >
                      <VolumeX className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSound}
                    className={soundEnabled ? 'text-green-600' : 'text-gray-400'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                  
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-blue-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}

                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => orderEventHandler.createTestNotification()}
                      className="text-purple-600"
                    >
                      Test
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all ${
                        notification.is_read 
                          ? 'bg-gray-50 border-gray-200' 
                          : getPriorityColor(notification.priority)
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getNotificationIcon(notification.notification_type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationCenter;
