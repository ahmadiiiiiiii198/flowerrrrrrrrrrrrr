
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, Truck, CheckCircle, Clock, DollarSign, Phone, PhoneCall } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OrderDetails from './OrderDetails';

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

  // Audio monitoring removed - handled by new order dashboard

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
    <div className="space-y-6 md:space-y-8">
      {/* Francesco Fiori Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-white to-emerald-50 rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-emerald-200">
              <img
                src="https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png"
                alt="Francesco Fiori & Piante Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.className = 'text-2xl';
                  fallback.textContent = '🌿';
                  e.currentTarget.parentElement!.appendChild(fallback);
                }}
              />
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-gray-800 text-center md:text-left font-serif">Gestione Ordini</h2>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:space-x-6">
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-sm text-emerald-700 font-medium">
              📱 Notifiche ordini gestite dalla <a href="/orders" className="font-bold underline hover:text-emerald-800">Dashboard Dedicata</a>
            </p>
          </div>
          <div className="flex items-center justify-center md:justify-start space-x-2 text-sm md:text-base text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
            <span className="font-semibold">
              Totale: {formatCurrency(orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Ordini Recenti</h3>
          {orders && orders.length > 0 ? (
            <div className="space-y-3 md:space-y-4 max-h-80 md:max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-emerald-500 border-emerald-300' : 'border-gray-200 hover:border-emerald-300'
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-3 sm:p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-2">
                      <div className="font-bold text-sm md:text-base text-gray-800">#{order.order_number}</div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-gray-700 space-y-1 sm:space-y-2">
                      <div className="truncate font-medium">{order.customer_name}</div>
                      <div className="truncate text-gray-600 text-xs sm:text-sm">{order.customer_email}</div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 border-t border-gray-100 gap-1 sm:gap-0">
                        <span className="font-bold text-emerald-700 text-sm sm:text-base">{formatCurrency(Number(order.total_amount))}</span>
                        <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-gray-200">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center text-gray-500">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base md:text-lg font-medium">Nessun ordine trovato</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Gli ordini appariranno qui quando verranno effettuati</p>
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
