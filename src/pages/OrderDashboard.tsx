import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  DollarSign,
  Clock,
  Package,
  RotateCcw,
  User,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types
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
  metadata?: any;
}

// Modern Audio Notification System
class AudioNotificationManager {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio() {
    const initAudio = () => {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
  }

  startContinuousAlert() {
    if (this.isPlaying || !this.audioContext) return;
    
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

      oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.6);

      this.intervalId = setTimeout(() => {
        if (this.isPlaying) this.playTone();
      }, 1000);
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  stopAlert() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  get isActive() {
    return this.isPlaying;
  }
}

// Global audio manager
const audioManager = new AudioNotificationManager();

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const OrderDashboard: React.FC = () => {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();

  // Audio status monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAudioActive(audioManager.isActive);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Data loading
  const loadOrders = useCallback(async () => {
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
  }, [toast]);

  const loadNotifications = useCallback(async () => {
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
  }, []);

  // Initial data load
  useEffect(() => {
    console.log('OrderDashboard: Starting initial data load...');
    const initializeData = async () => {
      try {
        await Promise.all([loadOrders(), loadNotifications()]);
        console.log('OrderDashboard: Data loaded successfully');
      } catch (error) {
        console.error('OrderDashboard: Error during initialization:', error);
        setLoading(false); // Ensure loading is cleared even on error
      }
    };

    initializeData();

    // Failsafe: Clear loading after 10 seconds no matter what
    const timeout = setTimeout(() => {
      console.log('OrderDashboard: Timeout reached, clearing loading state');
      setLoading(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loadOrders, loadNotifications]);

  // Real-time subscriptions
  useEffect(() => {
    const orderChannel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        const newOrder = payload.new as Order;
        setOrders(prev => [newOrder, ...prev]);
        
        if (soundEnabled) {
          audioManager.startContinuousAlert();
          toast({
            title: '🔔 New Order Received!',
            description: `Order #${newOrder.order_number} from ${newOrder.customer_name}`,
            duration: 8000,
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        const updatedOrder = payload.new as Order;
        setOrders(prev => prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [soundEnabled, toast]);

  // Event handlers
  const handleStopAudio = () => {
    audioManager.stopAlert();
    toast({
      title: '🔇 Audio Stopped',
      description: 'Notification audio has been stopped',
    });
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      audioManager.stopAlert();
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

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </motion.div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🚀 NEW Order Management System
              </h1>
              <p className="text-gray-600 mt-2">Monitor and manage incoming orders in real-time</p>
            </div>
            
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {isAudioActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Button
                      onClick={handleStopAudio}
                      variant="destructive"
                      className="animate-pulse shadow-lg"
                    >
                      <VolumeX className="w-4 h-4 mr-2" />
                      Stop Alert
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <Button
                onClick={toggleSound}
                variant="outline"
                className={`shadow-md ${soundEnabled ? 'text-green-600 border-green-200' : 'text-gray-400'}`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              <Button
                onClick={() => setShowNotifications(!showNotifications)}
                variant="outline"
                className="relative shadow-md"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {unreadNotifications.length}
                  </motion.div>
                )}
              </Button>

              <Button onClick={loadOrders} variant="outline" className="shadow-md">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Orders List */}
          <motion.div variants={itemVariants} className="xl:col-span-3">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  <span>Recent Orders</span>
                  <Badge variant="secondary" className="ml-auto">
                    {orders.length} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">No orders yet</p>
                    <p className="text-gray-400 text-sm">Orders will appear here when customers place them</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {orders.map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-6 hover:bg-gray-50/50 transition-all duration-200"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-bold text-lg text-gray-900">
                                  #{order.order_number}
                                </h3>
                                <Badge className={`${getStatusColor(order.status)} border`}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                  </span>
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{order.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{order.customer_email}</span>
                                </div>
                                {order.customer_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">{order.customer_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold text-green-600">€{order.total_amount}</span>
                                </div>
                              </div>
                              
                              {order.customer_address && (
                                <div className="flex items-start gap-2 mt-3 text-sm">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <span className="text-gray-600">{order.customer_address}</span>
                                </div>
                              )}
                              
                              {order.notes && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                                  <p className="text-gray-700">{order.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications Panel */}
          <motion.div 
            variants={itemVariants} 
            className={`xl:col-span-1 ${showNotifications ? 'block' : 'hidden xl:block'}`}
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <span>Notifications</span>
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        className={`p-4 cursor-pointer transition-colors ${
                          notification.is_read 
                            ? 'opacity-60' 
                            : 'bg-blue-50/50'
                        }`}
                        onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          {notification.is_read ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDashboard;
