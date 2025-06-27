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
  Search
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
  created_at: string;
}

// Audio Notification System
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

const audioManager = new AudioNotificationManager();

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
        .limit(100);

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
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadOrders();
    loadNotifications();
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

    const notificationChannel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_notifications'
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        
        if (soundEnabled) {
          audioManager.startContinuousAlert();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(notificationChannel);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Order Management Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Monitor and manage your orders in real-time</p>
            </div>

            <div className="flex items-center gap-3">
              {isAudioActive && (
                <Button
                  onClick={handleStopAudio}
                  variant="destructive"
                  className="animate-pulse shadow-lg"
                >
                  <VolumeX className="w-4 h-4 mr-2" />
                  Stop Alert
                </Button>
              )}

              <Button
                onClick={toggleSound}
                variant="outline"
                className={`shadow-md ${soundEnabled ? 'text-green-600 border-green-200' : 'text-gray-400'}`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              <Button
                onClick={loadOrders}
                variant="outline"
                className="shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{todayOrders.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-3xl font-bold text-amber-600">{pendingOrders.length}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Orders List */}
          <div className="xl:col-span-3">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    <span>Orders ({filteredOrders.length})</span>
                  </CardTitle>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">No orders found</p>
                    <p className="text-gray-400 text-sm">Orders will appear here when customers place them</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`p-6 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer ${
                          selectedOrder?.id === order.id ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedOrder(order)}
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{order.customer_name}</span>
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
                              </div>

                              <div className="space-y-2">
                                {order.customer_address && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 text-sm">{order.customer_address}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600 text-sm">
                                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600 text-sm">
                                    Payment: {order.payment_status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-5 h-5 text-gray-400" />
                              <span className="font-bold text-2xl text-green-600">€{order.total_amount}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
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
