// NEW ORDER DASHBOARD - REBUILT FROM SCRATCH
// Modern, clean design with working notification system

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  VolumeX, 
  Volume2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Euro,
  CheckCircle,
  AlertCircle,
  Package,
  Refresh
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import OrderDashboardTest from '@/components/OrderDashboardTest';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  order_id?: string;
  message: string;
  is_read: boolean;
  notification_type: string;
  priority: number;
  created_at: string;
  read_at?: string;
  metadata?: any;
}

// SIMPLE AUDIO SYSTEM - NO COMPLEX SERVICES
class SimpleAudioNotifier {
  private isPlaying = false;
  private audioInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudio();
  }

  private initAudio() {
    // Initialize on user interaction
    const init = () => {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      document.removeEventListener('click', init);
    };
    document.addEventListener('click', init);
  }

  public startContinuousRinging() {
    if (this.isPlaying) return;
    
    console.log('🔊 STARTING CONTINUOUS RINGING');
    this.isPlaying = true;
    this.playTone();
  }

  private playTone() {
    if (!this.audioContext || !this.isPlaying) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);

      // Schedule next tone
      this.audioInterval = setTimeout(() => {
        if (this.isPlaying) {
          this.playTone();
        }
      }, 800);

    } catch (error) {
      console.error('Audio error:', error);
    }
  }

  public stopRinging() {
    console.log('🔇 STOPPING RINGING');
    this.isPlaying = false;
    if (this.audioInterval) {
      clearTimeout(this.audioInterval);
      this.audioInterval = null;
    }
  }

  public isCurrentlyPlaying() {
    return this.isPlaying;
  }
}

// Global audio notifier
const audioNotifier = new SimpleAudioNotifier();

const NewOrderDashboard: React.FC = () => {
  console.log('🚀 NewOrderDashboard component loading...');

  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRinging, setIsRinging] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadOrders();
    loadNotifications();
  }, []);

  // Monitor audio status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRinging(audioNotifier.isCurrentlyPlaying());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    console.log('🔗 Setting up real-time listeners...');

    // Listen for new orders
    const orderChannel = supabase
      .channel('new-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('🆕 NEW ORDER DETECTED:', payload);
        handleNewOrder(payload.new as Order);
      })
      .on('postgres_changes', {
        event: 'UPDATE', 
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('📝 ORDER UPDATED:', payload);
        handleOrderUpdate(payload.new as Order);
      })
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up listeners...');
      supabase.removeChannel(orderChannel);
    };
  }, [soundEnabled]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleNewOrder = (order: Order) => {
    console.log('🎉 PROCESSING NEW ORDER:', order.order_number);
    
    // Add to orders list
    setOrders(prev => [order, ...prev]);
    
    // Create notification
    createNotification(order);
    
    // Trigger audio if enabled
    if (soundEnabled) {
      console.log('🔊 TRIGGERING CONTINUOUS AUDIO');
      audioNotifier.startContinuousRinging();
      
      toast({
        title: '🔔 NEW ORDER RECEIVED!',
        description: `Order #${order.order_number} from ${order.customer_name}`,
        duration: 10000,
      });
    }
  };

  const handleOrderUpdate = (order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  const createNotification = async (order: Order) => {
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          message: `New order received from ${order.customer_name}`,
          notification_type: 'order_created',
          priority: 5,
          metadata: {
            order_number: order.order_number,
            customer_name: order.customer_name,
            total_amount: order.total_amount
          }
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setNotifications(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  const stopAudio = () => {
    audioNotifier.stopRinging();
    toast({
      title: '🔇 Audio Stopped',
      description: 'Notification audio has been stopped',
    });
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      audioNotifier.stopRinging();
    }
    toast({
      title: soundEnabled ? '🔇 Sound Disabled' : '🔊 Sound Enabled',
      description: `Notification sounds ${soundEnabled ? 'disabled' : 'enabled'}`,
    });
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'paid': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    console.log('📊 NewOrderDashboard is loading...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
          <p className="mt-1 text-xs text-gray-400">New Order Dashboard v2.0</p>
        </div>
      </div>
    );
  }

  console.log('✅ NewOrderDashboard loaded successfully with', orders.length, 'orders');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Dashboard</h1>
          <p className="text-gray-600">Manage and monitor incoming orders</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Audio Controls */}
          {isRinging && (
            <Button
              onClick={stopAudio}
              variant="destructive"
              className="animate-pulse"
            >
              <VolumeX className="w-4 h-4 mr-2" />
              Stop Audio
            </Button>
          )}
          
          <Button
            onClick={toggleSound}
            variant="outline"
            className={soundEnabled ? 'text-green-600' : 'text-gray-400'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Notifications */}
          <Button
            onClick={() => setShowNotifications(!showNotifications)}
            variant="outline"
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadNotifications.length}
              </Badge>
            )}
          </Button>

          <Button onClick={loadOrders} variant="outline">
            <Refresh className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Test Panel */}
        {process.env.NODE_ENV === 'development' && (
          <div className="lg:col-span-1">
            <OrderDashboardTest />
          </div>
        )}
        {/* Orders List */}
        <div className={`${process.env.NODE_ENV === 'development' ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Recent Orders ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              #{order.order_number}
                            </h3>
                            <Badge className={`${getStatusColor(order.status)} text-white`}>
                              {order.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Euro className="w-4 h-4 text-gray-400" />
                              <span>€{order.total_amount}</span>
                            </div>
                            {order.customer_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{order.customer_phone}</span>
                              </div>
                            )}
                            {order.customer_address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{order.customer_address}</span>
                              </div>
                            )}
                          </div>
                          
                          {order.notes && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                              {order.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications Panel */}
        <div className={`${showNotifications ? 'block' : 'hidden lg:block'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications ({unreadNotifications.length} unread)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.is_read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        {notification.is_read ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewOrderDashboard;
