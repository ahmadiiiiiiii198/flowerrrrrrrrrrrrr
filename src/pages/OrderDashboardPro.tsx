import React, { useState, useEffect, useCallback } from 'react';
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
  XCircle,
  Truck,
  Star,
  TrendingUp,
  Eye,
  Filter,
  Search,
  Trash2,
  Edit,
  MoreVertical,
  Download,
  Settings,
  Zap,
  Activity,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types - Complete database schema
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
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  paid_amount?: number;
  paid_at?: string;
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
  created_at: string;
  notification_type?: string;
  priority?: number;
  read_at?: string;
  metadata?: any;
}

// BULLETPROOF Continuous Audio Notification System
class ContinuousAudioNotifier {
  private audioContext: AudioContext | null = null;
  private isRinging = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio() {
    const initAudio = () => {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.isInitialized = true;
        console.log('🔊 Audio system initialized successfully');
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
      } catch (error) {
        console.error('❌ Audio initialization failed:', error);
      }
    };

    // Initialize on user interaction
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);

    // Try to initialize immediately (might fail due to autoplay policy)
    try {
      initAudio();
    } catch (error) {
      console.log('⏳ Audio will initialize on first user interaction');
    }
  }

  startContinuousRinging() {
    if (this.isRinging) {
      console.log('🔊 Already ringing, ignoring duplicate start request');
      return;
    }

    if (!this.isInitialized || !this.audioContext) {
      console.log('⚠️ Audio not initialized yet, will start ringing on next user interaction');
      // Try to initialize again
      this.initializeAudio();
      return;
    }

    console.log('🚨 STARTING CONTINUOUS RINGING');
    this.isRinging = true;
    this.playRingTone();
  }

  private playRingTone() {
    if (!this.isRinging || !this.audioContext) return;

    try {
      // Create oscillator for ring tone
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Professional ring tone frequency
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.type = 'sine';

      // Ring pattern: 0.5s on, 0.3s off
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.55);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.6);

      // Schedule next ring
      this.timeoutId = setTimeout(() => {
        if (this.isRinging) {
          this.playRingTone();
        }
      }, 800); // Ring every 800ms

    } catch (error) {
      console.error('❌ Audio playback error:', error);
    }
  }

  stopRinging() {
    console.log('🔇 STOPPING CONTINUOUS RINGING');
    this.isRinging = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  get isActive() {
    return this.isRinging;
  }

  // Test function
  testRing() {
    console.log('🧪 Testing ring tone...');
    this.startContinuousRinging();
    setTimeout(() => {
      this.stopRinging();
      console.log('🧪 Test ring completed');
    }, 3000);
  }
}

const audioNotifier = new ContinuousAudioNotifier();

const OrderDashboardPro: React.FC = () => {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // Audio status monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAudioActive(audioNotifier.isActive);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Data loading with ALL columns
  const loadOrders = useCallback(async () => {
    console.log('📊 Loading orders from database...');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          total_amount,
          status,
          payment_status,
          payment_method,
          stripe_session_id,
          stripe_payment_intent_id,
          paid_amount,
          paid_at,
          notes,
          metadata,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`✅ Loaded ${data?.length || 0} orders from database`);
      setOrders(data || []);
    } catch (error) {
      console.error('❌ Failed to load orders:', error);
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
    console.log('🔔 Loading notifications from database...');
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .select(`
          id,
          order_id,
          message,
          is_read,
          created_at,
          notification_type,
          priority,
          read_at,
          metadata
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      console.log(`✅ Loaded ${data?.length || 0} notifications from database`);
      setNotifications(data || []);
    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadOrders();
    loadNotifications();
  }, [loadOrders, loadNotifications]);

  // Real-time subscriptions with BULLETPROOF continuous ringing
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions...');

    const orderChannel = supabase
      .channel('orders-realtime-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('🚨 NEW ORDER DETECTED!', payload);
        const newOrder = payload.new as Order;

        // Add to orders list
        setOrders(prev => [newOrder, ...prev]);

        if (soundEnabled) {
          console.log('🔊 Starting continuous ringing for new order...');
          audioNotifier.startContinuousRinging();

          toast({
            title: '🚨 NEW ORDER RECEIVED!',
            description: `Order #${newOrder.order_number} from ${newOrder.customer_name} - €${newOrder.total_amount}`,
            duration: 10000,
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('📝 Order updated:', payload);
        const updatedOrder = payload.new as Order;
        setOrders(prev => prev.map(order =>
          order.id === updatedOrder.id ? updatedOrder : order
        ));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('🗑️ Order deleted:', payload);
        const deletedOrder = payload.old as Order;
        setOrders(prev => prev.filter(order => order.id !== deletedOrder.id));
      })
      .subscribe((status) => {
        console.log('📡 Orders subscription status:', status);
      });

    const notificationChannel = supabase
      .channel('notifications-realtime-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_notifications'
      }, (payload) => {
        console.log('🔔 New notification:', payload);
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_notifications'
      }, (payload) => {
        console.log('📝 Notification updated:', payload);
        const updatedNotification = payload.new as Notification;
        setNotifications(prev => prev.map(notification =>
          notification.id === updatedNotification.id ? updatedNotification : notification
        ));
      })
      .subscribe((status) => {
        console.log('📡 Notifications subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...');
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [soundEnabled, toast]);

  // Event handlers
  const handleStopAudio = () => {
    console.log('🔇 User clicked stop audio');
    audioNotifier.stopRinging();
    toast({
      title: '🔇 Audio Stopped',
      description: 'Continuous ringing has been stopped',
    });
  };

  const toggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);

    if (!newSoundState) {
      // If disabling sound, stop any current ringing
      audioNotifier.stopRinging();
    }

    toast({
      title: newSoundState ? '🔊 Sound Enabled' : '🔇 Sound Disabled',
      description: `Notification sounds ${newSoundState ? 'enabled' : 'disabled'}`,
    });
  };

  // Test function for development
  const testNotificationSound = () => {
    console.log('🧪 Testing notification sound...');
    audioNotifier.testRing();
    toast({
      title: '🧪 Testing Audio',
      description: 'Playing test notification sound for 3 seconds',
    });
  };

  // Create test order to verify notification system
  const createTestOrder = async () => {
    try {
      console.log('🧪 Creating test order...');
      const testOrder = {
        order_number: `TEST-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+1234567890',
        customer_address: 'Test Address, Test City',
        total_amount: 25.99,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'pay_later',
        notes: 'Test order for notification system verification',
        metadata: { test: true, created_by: 'dashboard_test' }
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([testOrder])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Test order created successfully:', data);
      toast({
        title: '🧪 Test Order Created',
        description: `Test order ${data.order_number} created - should trigger continuous ringing!`,
        duration: 5000,
      });

    } catch (error) {
      console.error('❌ Failed to create test order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test order',
        variant: 'destructive'
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete related notifications first
      await supabase
        .from('order_notifications')
        .delete()
        .eq('order_id', orderId);

      // Delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.filter(order => order.id !== orderId));
      setSelectedOrder(null);

      toast({
        title: '✅ Order Deleted',
        description: 'Order has been successfully deleted',
      });
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive'
      });
    }
  };

  const deleteAllOrders = async () => {
    if (!confirm(`⚠️ DELETE ALL ORDERS?\n\nThis will permanently delete ALL ${orders.length} orders.\nThis action CANNOT be undone!\n\nClick OK to delete all orders, or Cancel to abort.`)) {
      return;
    }

    try {
      // Delete all notifications first
      await supabase
        .from('order_notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Delete all orders
      const { error } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setOrders([]);
      setNotifications([]);
      setSelectedOrder(null);

      toast({
        title: '✅ All Orders Deleted',
        description: `Successfully deleted all ${orders.length} orders`,
      });
    } catch (error) {
      console.error('Failed to delete all orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all orders',
        variant: 'destructive'
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      toast({
        title: '✅ Status Updated',
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Star className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const todayOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  );
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const pendingOrders = orders.filter(order => order.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading order dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
                Order Command Center
              </h1>
              <p className="text-xl text-blue-100 font-medium">Real-time order management & analytics</p>
              <div className="flex items-center gap-2 mt-3 justify-center lg:justify-start">
                <Activity className="w-5 h-5 text-green-400 animate-pulse" />
                <span className="text-green-300 font-medium">Live System Active</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-end">
              {isAudioActive && (
                <Button
                  onClick={handleStopAudio}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-2xl animate-pulse border-2 border-red-300"
                  size="lg"
                >
                  <VolumeX className="w-5 h-5 mr-2" />
                  Stop Alert
                </Button>
              )}

              <Button
                onClick={toggleSound}
                variant="outline"
                size="lg"
                className={`shadow-xl border-2 backdrop-blur-sm ${
                  soundEnabled
                    ? 'bg-green-500/20 border-green-300 text-green-100 hover:bg-green-500/30'
                    : 'bg-gray-500/20 border-gray-400 text-gray-300 hover:bg-gray-500/30'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </Button>

              <Button
                onClick={testNotificationSound}
                variant="outline"
                size="lg"
                className="bg-purple-500/20 border-purple-300 text-purple-100 hover:bg-purple-500/30 shadow-xl border-2 backdrop-blur-sm"
              >
                <Bell className="w-5 h-5 mr-2" />
                Test Audio
              </Button>

              <Button
                onClick={createTestOrder}
                variant="outline"
                size="lg"
                className="bg-yellow-500/20 border-yellow-300 text-yellow-100 hover:bg-yellow-500/30 shadow-xl border-2 backdrop-blur-sm"
              >
                <Package className="w-5 h-5 mr-2" />
                Test Order
              </Button>

              <Button
                onClick={loadOrders}
                variant="outline"
                size="lg"
                className="bg-blue-500/20 border-blue-300 text-blue-100 hover:bg-blue-500/30 shadow-xl border-2 backdrop-blur-sm"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={deleteAllOrders}
                variant="outline"
                size="lg"
                className="bg-red-500/20 border-red-300 text-red-100 hover:bg-red-500/30 shadow-xl border-2 backdrop-blur-sm"
                disabled={orders.length === 0}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-300/30 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 font-semibold text-sm uppercase tracking-wider">Total Orders</p>
                  <p className="text-5xl font-black text-white mt-2">{orders.length}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm font-medium">All time</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-500/30 rounded-2xl border border-blue-300/50">
                  <ShoppingBag className="w-8 h-8 text-blue-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-300/30 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 font-semibold text-sm uppercase tracking-wider">Today's Orders</p>
                  <p className="text-5xl font-black text-white mt-2">{todayOrders.length}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 text-sm font-medium">Live today</span>
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/30 rounded-2xl border border-emerald-300/50">
                  <Calendar className="w-8 h-8 text-emerald-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-300/30 shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 font-semibold text-sm uppercase tracking-wider">Pending Orders</p>
                  <p className="text-5xl font-black text-white mt-2">{pendingOrders.length}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-amber-300 text-sm font-medium">Awaiting</span>
                  </div>
                </div>
                <div className="p-4 bg-amber-500/30 rounded-2xl border border-amber-300/50">
                  <Clock className="w-8 h-8 text-amber-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-300/30 shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 font-semibold text-sm uppercase tracking-wider">Total Revenue</p>
                  <p className="text-5xl font-black text-white mt-2">€{totalRevenue.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm font-medium">Earnings</span>
                  </div>
                </div>
                <div className="p-4 bg-green-500/30 rounded-2xl border border-green-300/50">
                  <DollarSign className="w-8 h-8 text-green-100" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Orders List */}
          <div className="xl:col-span-3">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="border-b border-white/10 bg-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/30 rounded-xl">
                      <Package className="w-6 h-6 text-blue-100" />
                    </div>
                    <span className="text-white font-bold text-xl">Orders ({filteredOrders.length})</span>
                  </CardTitle>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                    >
                      <option value="all" className="bg-gray-800">All Status</option>
                      <option value="pending" className="bg-gray-800">Pending</option>
                      <option value="paid" className="bg-gray-800">Paid</option>
                      <option value="processing" className="bg-gray-800">Processing</option>
                      <option value="shipped" className="bg-gray-800">Shipped</option>
                      <option value="delivered" className="bg-gray-800">Delivered</option>
                      <option value="cancelled" className="bg-gray-800">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="p-6 bg-white/10 rounded-3xl inline-block mb-6">
                      <Package className="w-20 h-20 mx-auto text-white/40" />
                    </div>
                    <p className="text-white/80 text-xl font-semibold">No orders found</p>
                    <p className="text-white/60 text-sm mt-2">Orders will appear here when customers place them</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredOrders.map((order, index) => (
                      <div
                        key={order.id}
                        className={`p-6 border-b border-white/10 hover:bg-white/5 transition-all duration-300 ${
                          selectedOrder?.id === order.id ? 'bg-blue-500/20 border-l-4 border-blue-400' : ''
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <h3 className="font-black text-xl text-white">
                                #{order.order_number}
                              </h3>
                              <Badge className={`${getStatusColor(order.status)} border-0 px-3 py-1 text-sm font-semibold`}>
                                <span className="flex items-center gap-2">
                                  {getStatusIcon(order.status)}
                                  {order.status.toUpperCase()}
                                </span>
                              </Badge>

                              {/* Status Update Dropdown */}
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="pending" className="bg-gray-800">Pending</option>
                                <option value="paid" className="bg-gray-800">Paid</option>
                                <option value="processing" className="bg-gray-800">Processing</option>
                                <option value="shipped" className="bg-gray-800">Shipped</option>
                                <option value="delivered" className="bg-gray-800">Delivered</option>
                                <option value="cancelled" className="bg-gray-800">Cancelled</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <User className="w-4 h-4 text-blue-300" />
                                  </div>
                                  <span className="font-semibold text-white">{order.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Mail className="w-4 h-4 text-purple-300" />
                                  </div>
                                  <span className="text-white/80">{order.customer_email}</span>
                                </div>
                                {order.customer_phone && (
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                      <Phone className="w-4 h-4 text-green-300" />
                                    </div>
                                    <span className="text-white/80">{order.customer_phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                {order.customer_address && (
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                      <MapPin className="w-4 h-4 text-red-300" />
                                    </div>
                                    <span className="text-white/80 text-sm">{order.customer_address}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Calendar className="w-4 h-4 text-yellow-300" />
                                  </div>
                                  <span className="text-white/80 text-sm">
                                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <CreditCard className="w-4 h-4 text-indigo-300" />
                                  </div>
                                  <span className="text-white/80 text-sm">
                                    Payment: {order.payment_status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {order.notes && (
                              <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
                                <p className="text-white/90 text-sm">{order.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-right space-y-4">
                            <div className="flex items-center gap-2 justify-end">
                              <DollarSign className="w-6 h-6 text-green-400" />
                              <span className="font-black text-3xl text-green-400">€{order.total_amount}</span>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                                className="bg-blue-500/20 border-blue-300 text-blue-100 hover:bg-blue-500/30"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteOrder(order.id);
                                }}
                                className="bg-red-500/20 border-red-300 text-red-100 hover:bg-red-500/30"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
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
          <div className="xl:col-span-1">
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
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDashboardPro;
