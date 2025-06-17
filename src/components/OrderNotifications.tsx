
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, X, Volume2, VolumeX, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import phoneNotificationService from '@/services/phoneNotificationService';

interface Notification {
  id: string;
  order_id: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
}

interface OrderNotificationsProps {
  notifications: Notification[];
  count: number;
  onRefresh: () => void;
}

// Create a more prominent notification sound
const createNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);

  return audioContext;
};

const OrderNotifications = ({ notifications, count, onRefresh }: OrderNotificationsProps) => {
  const [open, setOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [orders, setOrders] = useState<{[key: string]: Order}>({});
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const ringingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // DISABLED: Don't start ringing here - let phoneNotificationService handle it
  // This prevents duplicate ringing from multiple sources
  useEffect(() => {
    // Only update local ringing state, don't trigger new ringing
    if (count === 0 && isRinging) {
      stopRinging();
    }
  }, [count, soundEnabled]);

  // Fetch order details for notifications
  useEffect(() => {
    if (notifications.length > 0) {
      fetchOrderDetails();
    }
  }, [notifications]);

  const fetchOrderDetails = async () => {
    try {
      const orderIds = notifications.map(n => n.order_id).filter(Boolean);
      if (orderIds.length === 0) return;

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status')
        .in('id', orderIds);

      if (error) throw error;

      const ordersMap: {[key: string]: Order} = {};
      ordersData?.forEach(order => {
        ordersMap[order.id] = order;
      });
      setOrders(ordersMap);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const startContinuousRinging = () => {
    // Play initial sound
    playNotificationSound();

    // Set up continuous ringing every 3 seconds
    ringingIntervalRef.current = setInterval(() => {
      if (soundEnabled) {
        playNotificationSound();
      }
    }, 3000);
  };

  const stopRinging = () => {
    setIsRinging(false);
    if (ringingIntervalRef.current) {
      clearInterval(ringingIntervalRef.current);
      ringingIntervalRef.current = null;
    }
  };

  const playNotificationSound = () => {
    try {
      // Use the phoneNotificationService to play the custom uploaded notification sound
      phoneNotificationService.testNotificationSound();
    } catch (error) {
      console.error('Failed to play custom notification sound:', error);
      // Fallback to the old method if phoneNotificationService fails
      try {
        createNotificationSound();
      } catch (fallbackError) {
        console.error('Failed to play fallback notification sound:', fallbackError);
        // Final fallback to HTML5 audio
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAzKH0fPTgjAHJXfH8N2QQAoUXrTp66hVFApGn+DyvmEaAw==');
          audio.volume = 0.5;
          audio.play();
        } catch (finalError) {
          console.error('All notification sound methods failed:', finalError);
        }
      }
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      stopRinging();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (ringingIntervalRef.current) {
        clearInterval(ringingIntervalRef.current);
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false);

      if (error) throw error;

      // Stop ringing when all notifications are marked as read
      stopRinging();

      // Also stop the phone notification service ringing
      phoneNotificationService.stopRinging();

      onRefresh();
      setOpen(false);

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const handleOrderAction = async (orderId: string, action: 'accepted' | 'rejected') => {
    if (!orderId) {
      console.error('No order ID provided');
      return;
    }

    console.log(`Attempting to ${action} order:`, orderId);
    setUpdatingOrder(orderId);

    try {
      const { error } = await supabase.rpc('update_order_status', {
        order_uuid: orderId,
        new_status: action,
        status_notes: action === 'accepted' ? 'Order accepted from notifications' : 'Order rejected from notifications',
        tracking_num: null,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      console.log(`Order ${orderId} successfully ${action}`);

      // Update local order state
      setOrders(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], status: action }
      }));

      toast({
        title: action === 'accepted' ? 'Order Accepted! ✅' : 'Order Rejected ❌',
        description: `Order #${orders[orderId]?.order_number} has been ${action}`,
      });

      // Mark the notification as read since action was taken
      const notification = notifications.find(n => n.order_id === orderId);
      if (notification && !notification.is_read) {
        await markAsRead(notification.id);
      }

      // Stop ringing since the order has been handled
      stopRinging();

      // Also stop the phone notification service ringing
      phoneNotificationService.stopRinging();

      // Refresh to get updated data
      onRefresh();
    } catch (error) {
      console.error(`Error ${action} order:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} order`,
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Debug function to create a test order and notification
  const createTestOrder = async () => {
    try {
      // Create a test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: `TEST-${Date.now()}`,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          total_amount: 25.00,
          status: 'pending',
          notes: 'Test order for debugging accept/reject buttons'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create a notification for this order
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          is_read: false
        });

      if (notificationError) throw notificationError;

      toast({
        title: 'Test Order Created! 🧪',
        description: `Test order ${order.order_number} created with notification`,
      });

      onRefresh();
    } catch (error) {
      console.error('Error creating test order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test order',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sound Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSound}
        className={`${soundEnabled ? 'text-green-600' : 'text-gray-400'}`}
        title={soundEnabled ? 'Sound enabled' : 'Sound disabled'}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </Button>

      {/* Notifications Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`relative ${isRinging ? 'animate-pulse bg-red-50 border-red-300' : ''}`}
          >
            <Bell className={`w-4 h-4 ${isRinging ? 'text-red-600' : ''}`} />
            {count > 0 && (
              <Badge
                variant="destructive"
                className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs ${
                  isRinging ? 'animate-bounce' : ''
                }`}
              >
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopRinging}
                      className="text-xs text-orange-600"
                    >
                      Stop Ringing
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  </>
                )}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={createTestOrder}
                    className="text-xs text-blue-600"
                  >
                    Create Test Order
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const order = orders[notification.order_id];
                const isUpdating = updatingOrder === notification.order_id;

                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded border ${
                      notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Notification Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {notification.notification_type === 'new_order' && 'New Order Received'}
                          </div>
                          {order && (
                            <div className="text-xs text-gray-600 mt-1">
                              Order #{order.order_number} - {order.customer_name}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(notification.created_at)}
                          </div>
                          {order && (
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'payment_pending' ? 'bg-orange-100 text-orange-800' :
                                order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Delete notification"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Order Action Buttons - Show for actionable orders */}
                      {(!order || order.status === 'pending' || order.status === 'payment_pending' || order.status === 'paid') && (
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <Button
                            size="sm"
                            onClick={() => handleOrderAction(notification.order_id, 'accepted')}
                            disabled={isUpdating}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOrderAction(notification.order_id, 'rejected')}
                            disabled={isUpdating}
                            className="flex-1 h-8"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Debug info */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-400 mt-2">
                          Debug: Order ID: {notification.order_id}, Status: {order?.status || 'No order data'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-4">
                No notifications
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
    </div>
  );
};

export default OrderNotifications;
