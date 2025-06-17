
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, Truck, CheckCircle, Clock, DollarSign, Phone, PhoneCall } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OrderDetails from './OrderDetails';
import OrderNotifications from './OrderNotifications';
import phoneNotificationService from '@/services/phoneNotificationService';

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
}

const OrderManagement = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isPhoneRinging, setIsPhoneRinging] = useState(false);
  const { toast } = useToast();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    }
  });

  const { data: notifications } = useQuery({
    queryKey: ['order-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Set up real-time listeners (NO NOTIFICATIONS - only data refresh)
  useEffect(() => {
    const channel = supabase
      .channel('order-changes-admin')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received in admin (no notification):', payload);

          // Only show toast in admin, NO PHONE NOTIFICATION
          toast({
            title: 'New Order Received! 🔔',
            description: `Order #${payload.new.order_number} from ${payload.new.customer_name}`,
            duration: 10000, // Show for 10 seconds
          });
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', icon: Clock },
      accepted: { color: 'bg-green-500', icon: CheckCircle },
      rejected: { color: 'bg-red-500', icon: Clock },
      preparing: { color: 'bg-blue-500', icon: Package },
      ready: { color: 'bg-purple-500', icon: Package },
      out_for_delivery: { color: 'bg-purple-500', icon: Truck },
      delivered: { color: 'bg-green-500', icon: CheckCircle },
      completed: { color: 'bg-green-600', icon: CheckCircle },
      cancelled: { color: 'bg-red-500', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h2 className="text-lg md:text-2xl font-semibold text-center md:text-left">Order Management</h2>
          {isPhoneRinging && (
            <Badge variant="destructive" className="animate-pulse self-center md:self-auto">
              <PhoneCall className="w-3 h-3 mr-1" />
              Phone Ringing
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:space-x-4">
          {isPhoneRinging && (
            <Button
              onClick={() => phoneNotificationService.stopRinging()}
              variant="destructive"
              size="sm"
              className="animate-pulse w-full md:w-auto"
            >
              <Phone className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Stop Ringing
            </Button>
          )}
          <OrderNotifications
            notifications={notifications || []}
            count={notificationCount}
            onRefresh={refetch}
          />
          <div className="flex items-center justify-center md:justify-start space-x-2 text-xs md:text-sm text-gray-600">
            <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
            <span>
              Total: {formatCurrency(orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-base md:text-lg font-medium">Recent Orders</h3>
          {orders && orders.length > 0 ? (
            <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm md:text-base">#{order.order_number}</div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 space-y-1">
                      <div className="truncate">{order.customer_name}</div>
                      <div className="truncate">{order.customer_email}</div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{formatCurrency(Number(order.total_amount))}</span>
                        <span className="text-xs">{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 md:p-8 text-center text-gray-500">
                <p className="text-sm md:text-base">No orders found</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
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
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 text-center text-gray-500">
                <p className="text-sm md:text-base">Select an order to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
