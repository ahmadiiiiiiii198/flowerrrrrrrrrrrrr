import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Package,
  Truck,
  CheckCircle,
  Clock,
  DollarSign,
  Phone,
  Settings,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Volume2,
  VolumeX,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import OrderDetails from '@/components/OrderDetails';
import OrderNotifications from '@/components/OrderNotifications';
import OrderSystemTester from '@/components/OrderSystemTester';
import phoneNotificationService from '@/services/phoneNotificationService';
import backgroundOrderService from '@/services/backgroundOrderService';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes?: string;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

const OrderDashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isPhoneRinging, setIsPhoneRinging] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  // Fetch orders with real-time updates
  const { data: orders, isLoading, refetch, error } = useQuery({
    queryKey: ['orders-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching when tab is not active
  });

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['order-notifications-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Check notifications every 10 seconds
    refetchIntervalInBackground: true,
  });

  // Calculate dashboard statistics
  useEffect(() => {
    if (orders) {
      const today = new Date().toDateString();
      const todayOrders = orders.filter(order => 
        new Date(order.created_at).toDateString() === today
      );

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        acceptedOrders: orders.filter(o => o.status === 'accepted').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalRevenue: orders.reduce((sum, order) => sum + Number(order.total_amount), 0),
        todayOrders: todayOrders.length
      });
      setLastUpdate(new Date());
    }
  }, [orders]);

  // Set up real-time listeners for orders
  useEffect(() => {
    const channel = supabase
      .channel('order-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔔 New order inserted in dashboard:', payload);

          // Trigger notifications for new orders regardless of status
          console.log('🎉 New order created - triggering notification');
          console.log('📊 Order status:', payload.new.status);

          // Only trigger notifications if we're on the order dashboard page
          if (window.location.pathname === '/orders') {
            // Trigger enhanced notifications (SINGLE SOURCE)
            phoneNotificationService.notifyNewOrder(
              payload.new.order_number,
              payload.new.customer_name
            );
          }

            // Show persistent toast notification
            toast({
              title: `🔔 ${t('newOrderReceived')}`,
              description: `Ordine #${payload.new.order_number} da ${payload.new.customer_name} - Stato: ${payload.new.status}`,
              duration: 15000, // Show for 15 seconds
            });

            // Trigger browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nuovo Ordine Ricevuto!', {
                body: `Ordine #${payload.new.order_number} da ${payload.new.customer_name}`,
                icon: '/favicon.ico',
                tag: 'new-order',
                requireInteraction: true, // Keep notification until user interacts
              });
            }

          refetch();
          refetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔄 Order updated in dashboard:', payload);

          // Only trigger notifications when order status changes to 'paid'
          // This means a customer has successfully completed payment
          if (payload.new.status === 'paid' && payload.old.status !== 'paid') {
            console.log('🎉 Order payment completed - triggering notification');

            // Only trigger notifications if we're on the order dashboard page
            if (window.location.pathname === '/orders') {
              // Trigger enhanced notifications (SINGLE SOURCE)
              phoneNotificationService.notifyNewOrder(
                payload.new.order_number,
                payload.new.customer_name
              );
            }

            // Show persistent toast notification
            toast({
              title: `🔔 ${t('orderPaymentCompleted')}`,
              description: `Ordine #${payload.new.order_number} da ${payload.new.customer_name} - Pagamento Riuscito!`,
              duration: 15000, // Show for 15 seconds
            });

            // Trigger browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pagamento Ordine Completato!', {
                body: `Ordine #${payload.new.order_number} da ${payload.new.customer_name} - Pagamento Riuscito!`,
                icon: '/favicon.ico',
                tag: 'order-paid',
                requireInteraction: true, // Keep notification until user interacts
              });
            }
          }

          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchNotifications, toast]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: `🌐 ${t('backOnline')}`,
        description: t('connectionRestored'),
      });
      refetch();
      refetchNotifications();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: `📡 ${t('connectionLost')}`,
        description: t('workingOffline'),
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch, refetchNotifications, toast]);

  // Update notification count and phone ringing status
  useEffect(() => {
    if (notifications) {
      setNotificationCount(notifications.length);
    }
  }, [notifications]);

  // Monitor phone ringing status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPhoneRinging(phoneNotificationService.isCurrentlyRinging());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Request notification permission and start background service on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({
            title: `🔔 ${t('notificationsEnabled')}`,
            description: t('browserNotificationsEnabled'),
          });
        }
      });
    }

    // Start background order service (but disable its notifications since we handle them here)
    backgroundOrderService.updateSettings({
      ...backgroundOrderService.getSettings(),
      soundEnabled: false // Disable background service notifications to prevent duplicates
    });

    backgroundOrderService.start().then(() => {
      toast({
        title: `🚀 ${t('backgroundServiceStarted')}`,
        description: t('backgroundMonitoringActive'),
      });
    }).catch(error => {
      console.error('Failed to start background service:', error);
      toast({
        title: `⚠️ ${t('backgroundServiceWarning')}`,
        description: t('notificationFeaturesMayNotWork'),
        variant: 'destructive',
      });
    });

    // Cleanup on unmount
    return () => {
      backgroundOrderService.stop();
    };
  }, [toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', icon: Package },
      processing: { color: 'bg-purple-100 text-purple-800', icon: Package },
      shipped: { color: 'bg-orange-100 text-orange-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    phoneNotificationService.updateSettings({
      ...phoneNotificationService.getSettings(),
      enabled: !soundEnabled
    });

    toast({
      title: soundEnabled ? `🔇 ${t('soundDisabled')}` : `🔊 ${t('soundEnabled')}`,
      description: soundEnabled ? t('orderNotificationsSilent') : t('orderNotificationsSound'),
    });
  };

  const testNotificationSound = () => {
    console.log('🧪 Testing notification sound manually...');
    console.log('📍 Current page:', window.location.pathname);

    // Test the notification service directly
    phoneNotificationService.notifyNewOrder('TEST-001', 'Test Customer');

    toast({
      title: `🔊 ${t('testingNotificationSound')}`,
      description: t('playingTestNotification'),
      duration: 5000,
    });
  };

  const deleteAllOrders = async () => {
    if (!orders || orders.length === 0) {
      toast({
        title: 'No Orders to Delete',
        description: 'There are no orders to delete.',
        variant: 'destructive',
      });
      return;
    }

    // Single confirmation dialog
    const confirmed = window.confirm(
      `⚠️ DELETE ALL ORDERS?\n\n` +
      `This will permanently delete ALL ${orders.length} orders.\n` +
      `This action CANNOT be undone!\n\n` +
      `Click OK to delete all orders, or Cancel to abort.`
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log('🗑️ Deleting all orders...');

      // First, delete all order notifications to avoid foreign key constraint violations
      const { error: notificationsError } = await supabase
        .from('order_notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (notificationsError && !notificationsError.message.includes('does not exist')) {
        console.warn('Warning deleting order notifications:', notificationsError);
        // Continue anyway - notifications are not critical
      }

      // Second, delete all order status history
      const { error: statusHistoryError } = await supabase
        .from('order_status_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (statusHistoryError && !statusHistoryError.message.includes('does not exist')) {
        console.warn('Warning deleting order status history:', statusHistoryError);
        // Continue anyway - status history is not critical
      }

      // Third, delete all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
        toast({
          title: 'Deletion Failed',
          description: `Error deleting order items: ${itemsError.message}`,
          variant: 'destructive',
        });
        return;
      }

      // Finally, delete all orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (ordersError) {
        console.error('Error deleting orders:', ordersError);
        toast({
          title: 'Deletion Failed',
          description: `Error deleting orders: ${ordersError.message}`,
          variant: 'destructive',
        });
        return;
      }

      // Refresh the orders list
      refetch();

      toast({
        title: '🗑️ All Orders Deleted',
        description: `Successfully deleted ${orders.length} orders and all related data.`,
        duration: 10000,
      });

      // Clear selected order
      setSelectedOrder(null);

      console.log('✅ All orders deleted successfully');

    } catch (error) {
      console.error('Error deleting orders:', error);
      toast({
        title: 'Deletion Failed',
        description: 'An unexpected error occurred while deleting orders.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingOrderDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              🌸 {t('orderDashboard')}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">
              {t('realTimeOrderManagement')}
            </p>
          </div>

          {/* Mobile-optimized control buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2">
            {/* Connection Status */}
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="hidden sm:inline">{isOnline ? t('online') : t('offline')}</span>
            </Badge>

            {/* Sound Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? t('soundOn') : t('soundOff')}</span>
            </Button>

            {/* Test Notification Button */}
            <Button
              onClick={testNotificationSound}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 px-2 sm:px-3"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t('testSound')}</span>
            </Button>

            {/* Phone Ringing Indicator */}
            {isPhoneRinging && (
              <Button
                onClick={() => phoneNotificationService.stopRinging()}
                variant="destructive"
                size="sm"
                className="animate-pulse flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">{t('stopRinging')}</span>
              </Button>
            )}

            {/* Notifications */}
            <div className="flex-shrink-0">
              <OrderNotifications
                notifications={notifications || []}
                count={notificationCount}
                onRefresh={() => {
                  refetch();
                  refetchNotifications();
                }}
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                refetchNotifications();
              }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">{t('refresh')}</span>
            </Button>
          </div>
        </div>

        {/* Last Update Time */}
        <div className="mt-2 text-xs text-gray-500">
          {t('lastUpdatedDashboard')}: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{t('totalOrders')}</p>
                <p className="text-lg sm:text-xl font-bold">{stats.totalOrders}</p>
              </div>
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{t('pending')}</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{t('accepted')}</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">{stats.acceptedOrders}</p>
              </div>
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{t('completed')}</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{stats.completedOrders}</p>
              </div>
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{t('today')}</p>
                <p className="text-lg sm:text-xl font-bold text-purple-600">{stats.todayOrders}</p>
              </div>
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{t('revenue')}</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm py-2">{t('dashboard')}</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs sm:text-sm py-2">{t('orders')}</TabsTrigger>
          <TabsTrigger value="testing" className="text-xs sm:text-sm py-2">{t('systemTesting')}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Orders List */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base sm:text-lg">
              <span>{t('recentOrders')}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{orders?.length || 0} totale</Badge>
                {orders && orders.length > 0 && (
                  <Button
                    onClick={deleteAllOrders}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs px-2 py-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Elimina Tutti</span>
                    <span className="sm:hidden">Elimina</span>
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {orders && orders.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm sm:text-base">#{order.order_number}</div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
                        {order.customer_name}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="font-medium">{formatCurrency(Number(order.total_amount))}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6 sm:py-8">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">{t('noOrdersFound')}</p>
                <p className="text-xs mt-1 sm:mt-2">{t('createFirstOrder')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">{t('orderDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedOrder ? (
              <OrderDetails
                order={selectedOrder}
                onUpdate={() => {
                  refetch();
                  setSelectedOrder(null);
                }}
                onDelete={() => {
                  refetch();
                  setSelectedOrder(null);
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-6 sm:py-8">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">{t('selectOrderToView')}</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Orders List */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base sm:text-lg">
                  <span>{t('allOrders')}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{orders?.length || 0} totale</Badge>
                    {orders && orders.length > 0 && (
                      <Button
                        onClick={deleteAllOrders}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs px-2 py-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Elimina Tutti</span>
                        <span className="sm:hidden">Elimina</span>
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {orders.map((order) => (
                      <Card
                        key={order.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">#{order.order_number}</div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {order.customer_name}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {order.customer_email}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            <span className="font-medium">{formatCurrency(Number(order.total_amount))}</span>
                          </div>
                          {order.notes && (
                            <div className="text-xs text-gray-400 mt-2 truncate">
                              {order.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('noOrdersFound')}</p>
                    <p className="text-xs mt-2">{t('createFirstOrder')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('orderDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder ? (
                  <OrderDetails
                    order={selectedOrder}
                    onUpdate={() => {
                      refetch();
                      setSelectedOrder(null);
                    }}
                    onDelete={() => {
                      refetch();
                      setSelectedOrder(null);
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('selectOrderToView')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <OrderSystemTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDashboard;
