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
  private customAudio: HTMLAudioElement | null = null;
  private activeSound: any = null;

  constructor() {
    this.initializeAudio();
    this.loadActiveSound();
  }

  private async loadActiveSound() {
    try {
      const { data, error } = await supabase
        .from('notification_sounds')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading active sound:', error);
        return;
      }

      this.activeSound = data;
      console.log('🎵 Active sound loaded:', data?.name || 'Default');
    } catch (error) {
      console.error('Error loading active sound:', error);
    }
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
    if (!this.isRinging) return;

    try {
      // Check if we have a custom sound
      if (this.activeSound && this.activeSound.sound_type === 'custom' && this.activeSound.file_url) {
        this.playCustomSound();
      } else {
        // Play built-in sound
        if (!this.audioContext) return;
        this.playDualToneRing();
      }

      // Schedule next ring cycle
      const interval = this.activeSound?.sound_type === 'custom' ? 5000 : 4000;
      this.timeoutId = setTimeout(() => {
        if (this.isRinging) {
          this.playRingTone();
        }
      }, interval);

    } catch (error) {
      console.error('❌ Audio playback error:', error);
    }
  }

  private playCustomSound() {
    if (!this.activeSound?.file_url) return;

    try {
      // Stop any existing custom audio
      if (this.customAudio) {
        this.customAudio.pause();
        this.customAudio.currentTime = 0;
      }

      // Create new audio instance
      this.customAudio = new Audio(this.activeSound.file_url);
      this.customAudio.volume = 0.7;

      this.customAudio.onerror = () => {
        console.error('❌ Custom sound playback failed, falling back to built-in');
        // Fallback to built-in sound
        if (this.audioContext) {
          this.playDualToneRing();
        }
      };

      this.customAudio.play().catch(error => {
        console.error('❌ Custom sound play failed:', error);
        // Fallback to built-in sound
        if (this.audioContext) {
          this.playDualToneRing();
        }
      });

    } catch (error) {
      console.error('❌ Custom sound error:', error);
      // Fallback to built-in sound
      if (this.audioContext) {
        this.playDualToneRing();
      }
    }
  }

  private playDualToneRing() {
    if (!this.audioContext) return;

    // Create two oscillators for a richer ringing sound
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    const masterGain = this.audioContext.createGain();

    // Connect audio nodes
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(masterGain);
    gainNode2.connect(masterGain);
    masterGain.connect(this.audioContext.destination);

    // Set frequencies for pleasant ringing (like a phone)
    oscillator1.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
    oscillator2.frequency.setValueAtTime(1108, this.audioContext.currentTime); // C#6 note
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    const currentTime = this.audioContext.currentTime;

    // Master volume
    masterGain.gain.setValueAtTime(0.15, currentTime);

    // Ring pattern: ring-ring-pause-ring-ring-pause
    // First ring
    this.createRingBurst(gainNode1, gainNode2, currentTime, 0);
    // Second ring
    this.createRingBurst(gainNode1, gainNode2, currentTime, 0.8);

    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    oscillator1.stop(currentTime + 2.0);
    oscillator2.stop(currentTime + 2.0);
  }

  private createRingBurst(gainNode1: GainNode, gainNode2: GainNode, startTime: number, offset: number) {
    const ringStart = startTime + offset;
    const ringDuration = 0.6;

    // Fade in
    gainNode1.gain.setValueAtTime(0, ringStart);
    gainNode2.gain.setValueAtTime(0, ringStart);
    gainNode1.gain.linearRampToValueAtTime(1, ringStart + 0.05);
    gainNode2.gain.linearRampToValueAtTime(0.8, ringStart + 0.05);

    // Hold
    gainNode1.gain.setValueAtTime(1, ringStart + ringDuration - 0.05);
    gainNode2.gain.setValueAtTime(0.8, ringStart + ringDuration - 0.05);

    // Fade out
    gainNode1.gain.linearRampToValueAtTime(0, ringStart + ringDuration);
    gainNode2.gain.linearRampToValueAtTime(0, ringStart + ringDuration);
  }

  stopRinging() {
    console.log('🔇 STOPPING CONTINUOUS RINGING');
    this.isRinging = false;

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Stop custom audio if playing
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.currentTime = 0;
      this.customAudio = null;
    }
  }

  get isActive() {
    return this.isRinging;
  }

  async refreshActiveSound() {
    await this.loadActiveSound();
    console.log('🔄 Active sound refreshed:', this.activeSound?.name || 'Default');
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

// Expose audio notifier globally for sound management
(window as any).audioNotifier = audioNotifier;

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
    setLoading(true);
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

      console.log(`✅ Loaded ${data?.length || 0} orders from database:`, data);
      setOrders(data || []);

      // Show success toast for debugging
      toast({
        title: '✅ Orders Loaded',
        description: `Successfully loaded ${data?.length || 0} orders`,
      });
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
      .channel('orders-realtime-channel-' + Date.now()) // Unique channel name
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('🚨 NEW ORDER DETECTED!', payload);
        const newOrder = payload.new as Order;

        // Add to orders list
        setOrders(prev => {
          console.log('📝 Adding new order to list. Previous count:', prev.length);
          const updated = [newOrder, ...prev];
          console.log('📝 New order list count:', updated.length);
          return updated;
        });

        // Always show toast notification
        toast({
          title: '🚨 NEW ORDER RECEIVED!',
          description: `Order #${newOrder.order_number} from ${newOrder.customer_name} - €${newOrder.total_amount}`,
          duration: 10000,
        });

        if (soundEnabled) {
          console.log('🔊 Starting continuous ringing for new order...');
          console.log('🎵 Audio initialized:', audioNotifier.isActive);
          audioNotifier.startContinuousRinging();
        } else {
          console.log('🔇 Sound disabled, skipping audio notification');
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
        if (status === 'SUBSCRIBED') {
          console.log('✅ Orders real-time subscription ACTIVE');
          toast({
            title: '📡 Real-time Connected',
            description: 'Orders will now appear instantly',
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Orders subscription ERROR');
          toast({
            title: '❌ Real-time Error',
            description: 'Orders may not appear instantly',
            variant: 'destructive'
          });
        }
      });

    const notificationChannel = supabase
      .channel('notifications-realtime-channel-' + Date.now()) // Unique channel name
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_notifications'
      }, (payload) => {
        console.log('🔔 New notification:', payload);
        const newNotification = payload.new as Notification;
        setNotifications(prev => {
          console.log('📝 Adding new notification. Previous count:', prev.length);
          return [newNotification, ...prev];
        });
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
        if (status === 'SUBSCRIBED') {
          console.log('✅ Notifications real-time subscription ACTIVE');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Notifications subscription ERROR');
        }
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
      title: '🧪 Test Audio',
      description: 'Riproduzione suono di notifica per 3 secondi',
    });
  };

  // Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    await Promise.all([loadOrders(), loadNotifications()]);
    toast({
      title: '🔄 Aggiornato',
      description: 'Ordini e notifiche sono stati aggiornati',
    });
  };

  // Create test order to verify notification system
  const createTestOrder = async () => {
    try {
      console.log('🧪 Creating test order...');
      console.log('🔊 Sound enabled:', soundEnabled);
      console.log('🎵 Audio system ready:', audioNotifier.isActive);

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
        notes: 'Ordine di test per verifica sistema notifiche',
        metadata: { test: true, created_by: 'dashboard_test' }
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([testOrder])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Test order created successfully:', data);

      // Force refresh orders list to ensure it shows up
      await loadOrders();

      toast({
        title: '🧪 Ordine di Test Creato',
        description: `Ordine di test ${data.order_number} creato - dovrebbe attivare la suoneria continua!`,
        duration: 5000,
      });

    } catch (error) {
      console.error('❌ Failed to create test order:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile creare ordine di test',
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
        title: '✅ Ordine Eliminato',
        description: 'Ordine eliminato con successo',
      });
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare ordine',
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
        title: '✅ Tutti gli Ordini Eliminati',
        description: `Eliminati con successo tutti i ${orders.length} ordini`,
      });
    } catch (error) {
      console.error('Failed to delete all orders:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare tutti gli ordini',
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In Attesa';
      case 'paid': return 'Pagato';
      case 'cancelled': return 'Annullato';
      case 'processing': return 'In Lavorazione';
      case 'shipped': return 'Spedito';
      case 'delivered': return 'Consegnato';
      default: return 'Sconosciuto';
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rose-600 font-medium">🌸 Loading flower shop dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 relative">
      {/* Elegant Francesco Fiori Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle botanical elements */}
        <div className="absolute top-20 left-10 w-6 h-6 bg-emerald-200/20 rounded-full blur-sm animate-pulse" style={{animationDelay: '0s', animationDuration: '4s'}}></div>
        <div className="absolute top-40 right-20 w-4 h-4 bg-amber-200/30 rounded-full blur-sm animate-pulse" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-emerald-100/30 rounded-full blur-sm animate-pulse" style={{animationDelay: '1s', animationDuration: '4.5s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-5 h-5 bg-amber-100/40 rounded-full blur-sm animate-pulse" style={{animationDelay: '3s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-emerald-200/25 rounded-full blur-sm animate-pulse" style={{animationDelay: '1.5s', animationDuration: '5s'}}></div>

        {/* Elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-amber-50/30"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Floral Header - Mobile Optimized */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
            <div className="text-center lg:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start mb-4 md:mb-6 gap-3 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white to-emerald-50 rounded-full flex items-center justify-center shadow-xl overflow-hidden border-2 sm:border-3 border-emerald-200/50">
                  <img
                    src="https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png"
                    alt="Francesco Fiori & Piante Logo"
                    className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
                    onError={(e) => {
                      // Fallback to botanical emoji if logo fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.className = 'text-2xl sm:text-4xl';
                      fallback.textContent = '🌿';
                      e.currentTarget.parentElement!.appendChild(fallback);
                    }}
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-800 mb-2 md:mb-3 font-serif leading-tight">
                    Francesco Fiori & Piante
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-emerald-700 font-medium tracking-wide">Gestione Ordini in Tempo Reale</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 justify-center lg:justify-start">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-emerald-700 font-semibold text-base md:text-lg">Sistema Attivo</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 justify-center lg:justify-end">
              {isAudioActive && (
                <Button
                  onClick={handleStopAudio}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-2xl animate-pulse border-2 border-red-300 text-xs sm:text-sm"
                  size="sm"
                >
                  <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Stop Alert</span>
                  <span className="sm:hidden">Stop</span>
                </Button>
              )}

              <Button
                onClick={toggleSound}
                variant="outline"
                size="sm"
                className={`shadow-lg border-2 backdrop-blur-sm rounded-full text-xs sm:text-sm ${
                  soundEnabled
                    ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                <span className="hidden sm:inline">🔊 {soundEnabled ? 'Audio Attivo' : 'Audio Spento'}</span>
                <span className="sm:hidden">🔊</span>
              </Button>

              <Button
                onClick={testNotificationSound}
                variant="outline"
                size="sm"
                className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200 shadow-lg border-2 rounded-full text-xs sm:text-sm"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">🔔 Test Audio</span>
                <span className="sm:hidden">🔔</span>
              </Button>

              <Button
                onClick={createTestOrder}
                variant="outline"
                size="sm"
                className="bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200 shadow-lg border-2 rounded-full text-xs sm:text-sm"
              >
                <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">🌻 Test Ordine</span>
                <span className="sm:hidden">🌻</span>
              </Button>

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 shadow-lg border-2 rounded-full text-xs sm:text-sm"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">🔄 Aggiorna</span>
                <span className="sm:hidden">🔄</span>
              </Button>

              <Button
                onClick={deleteAllOrders}
                variant="outline"
                size="sm"
                className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200 shadow-lg border-2 rounded-full text-xs sm:text-sm"
                disabled={orders.length === 0}
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">🗑️ Cancella Tutto</span>
                <span className="sm:hidden">🗑️</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Francesco Fiori Statistics Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-12">
          <Card className="bg-white/90 backdrop-blur-sm border border-emerald-200 shadow-lg hover:shadow-emerald-200/50 transition-all duration-300 hover:scale-105 rounded-xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-1 sm:mb-2 truncate">Ordini Totali</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">{orders.length}</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                    <span className="text-emerald-700 text-xs sm:text-sm font-medium truncate">Tutti i tempi</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-xl border border-emerald-200 ml-2">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-amber-200 shadow-lg hover:shadow-amber-200/50 transition-all duration-300 hover:scale-105 rounded-xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-1 sm:mb-2 truncate">Ordini Oggi</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">{todayOrders.length}</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                    <span className="text-amber-700 text-xs sm:text-sm font-medium truncate">Freschi oggi</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-amber-100 rounded-xl border border-amber-200 ml-2">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-orange-200 shadow-lg hover:shadow-orange-200/50 transition-all duration-300 hover:scale-105 rounded-xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-1 sm:mb-2 truncate">In Attesa</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">{pendingOrders.length}</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 animate-pulse" />
                    <span className="text-orange-700 text-xs sm:text-sm font-medium truncate">In lavorazione</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 rounded-xl border border-orange-200 ml-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-green-200 shadow-lg hover:shadow-green-200/50 transition-all duration-300 hover:scale-105 rounded-xl">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-1 sm:mb-2 truncate">Ricavi Totali</p>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">€{totalRevenue.toFixed(2)}</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    <span className="text-green-700 text-xs sm:text-sm font-medium truncate">Crescita continua</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-xl border border-green-200 ml-2">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {/* Orders List */}
          <div className="xl:col-span-3">
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl border border-emerald-200">
                      <Package className="w-6 h-6 text-emerald-700" />
                    </div>
                    <span className="text-gray-800 font-bold text-xl">Ordini ({filteredOrders.length})</span>
                  </CardTitle>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Cerca ordini..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                    >
                      <option value="all">Tutti gli Stati</option>
                      <option value="pending">In Attesa</option>
                      <option value="paid">Pagato</option>
                      <option value="processing">In Lavorazione</option>
                      <option value="shipped">Spedito</option>
                      <option value="delivered">Consegnato</option>
                      <option value="cancelled">Annullato</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-6">
                      <Package className="w-20 h-20 mx-auto text-gray-400" />
                    </div>
                    <p className="text-gray-700 text-xl font-semibold">Nessun ordine trovato</p>
                    <p className="text-gray-500 text-sm mt-2">Gli ordini appariranno qui quando i clienti li effettueranno</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredOrders.map((order, index) => (
                      <div
                        key={order.id}
                        className={`p-6 border-b border-gray-200 hover:bg-gray-50 transition-all duration-300 ${
                          selectedOrder?.id === order.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <h3 className="font-bold text-xl text-gray-800">
                                #{order.order_number}
                              </h3>
                              <Badge className={`${getStatusColor(order.status)} border-0 px-3 py-1 text-sm font-semibold`}>
                                <span className="flex items-center gap-2">
                                  {getStatusIcon(order.status)}
                                  {getStatusText(order.status)}
                                </span>
                              </Badge>

                              {/* Status Update Dropdown */}
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="pending">In Attesa</option>
                                <option value="paid">Pagato</option>
                                <option value="processing">In Lavorazione</option>
                                <option value="shipped">Spedito</option>
                                <option value="delivered">Consegnato</option>
                                <option value="cancelled">Annullato</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-100 rounded-lg">
                                    <User className="w-4 h-4 text-emerald-700" />
                                  </div>
                                  <span className="font-semibold text-gray-800">{order.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <Mail className="w-4 h-4 text-blue-700" />
                                  </div>
                                  <span className="text-gray-700">{order.customer_email}</span>
                                </div>
                                {order.customer_phone && (
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <Phone className="w-4 h-4 text-green-700" />
                                    </div>
                                    <span className="text-gray-700">{order.customer_phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                {order.customer_address && (
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                      <MapPin className="w-4 h-4 text-amber-700" />
                                    </div>
                                    <span className="text-gray-700 text-sm">{order.customer_address}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <Calendar className="w-4 h-4 text-purple-700" />
                                  </div>
                                  <span className="text-gray-700 text-sm">
                                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-100 rounded-lg">
                                    <CreditCard className="w-4 h-4 text-indigo-700" />
                                  </div>
                                  <span className="text-gray-700 text-sm">
                                    Pagamento: {order.payment_status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {order.notes && (
                              <div className="mt-4 p-4 bg-gray-100 rounded-xl border border-gray-200">
                                <p className="text-gray-800 text-sm">{order.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-right space-y-4">
                            <div className="flex items-center gap-2 justify-end">
                              <DollarSign className="w-6 h-6 text-emerald-600" />
                              <span className="font-bold text-3xl text-emerald-700">€{order.total_amount}</span>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                                className="bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizza
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteOrder(order.id);
                                }}
                                className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Elimina
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
            <Card className="shadow-lg border border-gray-200 bg-white/95 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-800">Notifiche</span>
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
                    <p className="text-gray-500">Nessuna notifica</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          notification.is_read
                            ? 'opacity-60'
                            : 'bg-emerald-50/50'
                        }`}
                        onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          {notification.is_read ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
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
