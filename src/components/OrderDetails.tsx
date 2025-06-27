
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Loader2, Truck, Package, CheckCircle, Clock, X, Trash2 } from 'lucide-react';

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

interface OrderDetailsProps {
  order: Order;
  onUpdate: () => void;
  onDelete?: () => void;
}

const OrderDetails = ({ order, onUpdate, onDelete }: OrderDetailsProps) => {
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    setUpdating(true);
    try {
      const { error } = await supabase.rpc('update_order_status', {
        order_uuid: order.id,
        new_status: newStatus,
        status_notes: notes || null,
        tracking_num: trackingNumber || null,
      });

      if (error) throw error;

      toast({
        title: t('orderUpdated'),
        description: t('orderUpdatedSuccessfully'),
      });

      onUpdate();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: t('updateFailed'),
        description: t('failedToUpdateOrder'),
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickStatusUpdate = async (status: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase.rpc('update_order_status', {
        order_uuid: order.id,
        new_status: status,
        status_notes: status === 'accepted' ? 'Order accepted and will be prepared' : 'Order rejected',
        tracking_num: null,
      });

      if (error) throw error;

      toast({
        title: status === 'accepted' ? 'Ordine Accettato' : 'Ordine Rifiutato',
        description: `Ordine #${order.order_number} è stato ${status === 'accepted' ? 'accettato' : 'rifiutato'}`,
      });

      onUpdate();
    } catch (error) {
      console.error('Quick update error:', error);
      toast({
        title: t('updateFailed'),
        description: `Impossibile ${status === 'accepted' ? 'accettare' : 'rifiutare'} l'ordine`,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirm(`Sei sicuro di voler eliminare l'ordine #${order.order_number}? Questa azione non può essere annullata.`)) {
      return;
    }

    setUpdating(true);
    try {
      // Use manual deletion directly since the database function isn't available yet
      console.log('Starting manual order deletion for order:', order.id);
      await deleteOrderManually();

      toast({
        title: t('orderDeleted'),
        description: t('orderDeletedSuccessfully'),
      });

      if (onDelete) {
        onDelete();
      } else {
        onUpdate();
      }
    } catch (error) {
      console.error('Delete error:', error);

      // Provide more specific error messages
      let errorMessage = 'Impossibile eliminare l\'ordine';
      if (error.message.includes('does not exist')) {
        errorMessage = 'L\'ordine non esiste più';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Non hai i permessi per eliminare questo ordine';
      } else if (error.message.includes('violates foreign key constraint')) {
        errorMessage = 'Impossibile eliminare l\'ordine - ha record correlati che devono essere rimossi prima';
      } else if (error.message) {
        errorMessage = `Impossibile eliminare l'ordine: ${error.message}`;
      }

      toast({
        title: t('deleteFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrderManually = async () => {
    // Manual deletion with proper error handling - delete related records first
    console.log('Starting manual deletion process for order:', order.id);

    try {
      // 1. Delete order notifications first (if they exist)
      console.log('Deleting order notifications...');
      const { error: notificationsError } = await supabase
        .from('order_notifications')
        .delete()
        .eq('order_id', order.id);

      if (notificationsError && !notificationsError.message.includes('does not exist')) {
        console.warn('Warning deleting notifications:', notificationsError);
        // Continue anyway - notifications are not critical
      } else {
        console.log('✓ Order notifications deleted');
      }

      // 2. Delete order status history (if it exists)
      console.log('Deleting order status history...');
      const { error: statusHistoryError } = await supabase
        .from('order_status_history')
        .delete()
        .eq('order_id', order.id);

      if (statusHistoryError && !statusHistoryError.message.includes('does not exist')) {
        console.warn('Warning deleting status history:', statusHistoryError);
        // Continue anyway - status history is not critical
      } else {
        console.log('✓ Order status history deleted');
      }

      // 3. Delete order items
      console.log('Deleting order items...');
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id);

      if (itemsError) {
        console.error('Failed to delete order items:', itemsError);
        throw new Error(`Failed to delete order items: ${itemsError.message}`);
      } else {
        console.log('✓ Order items deleted');
      }

      // 4. Finally delete the order itself
      console.log('Deleting order...');
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (orderError) {
        console.error('Failed to delete order:', orderError);
        throw new Error(`Failed to delete order: ${orderError.message}`);
      } else {
        console.log('✅ Order deleted successfully');
      }

    } catch (error) {
      console.error('Manual deletion failed:', error);
      throw error;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="border-emerald-200 shadow-lg">
      <CardHeader className="pb-3 sm:pb-4 md:pb-6 bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-emerald-200 p-3 sm:p-4 md:p-6">
        <CardTitle className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <img
                  src="https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png"
                  alt="Francesco Fiori & Piante Logo"
                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.className = 'text-sm sm:text-lg';
                    fallback.textContent = '🌿';
                    e.currentTarget.parentElement!.appendChild(fallback);
                  }}
                />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Ordine #{order.order_number}</span>
            </div>
            <Button
              onClick={handleDeleteOrder}
              disabled={updating}
              variant="destructive"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 p-0 bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <Badge variant="outline" className="text-xs sm:text-sm border-emerald-300 text-emerald-700 bg-emerald-50 px-2 py-1">
              {getStatusIcon(order.status)}
              <span className="ml-1 sm:ml-2">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </Badge>
          </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 md:space-y-8 pt-4 sm:pt-6 p-3 sm:p-4 md:p-6">
        {/* Customer Information */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
          <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base md:text-lg text-gray-800 border-b border-gray-300 pb-2">Informazioni Cliente</h4>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base">
            <div className="break-words"><strong className="text-gray-700">Nome:</strong> <span className="text-gray-800">{order.customer_name}</span></div>
            <div className="break-all"><strong className="text-gray-700">Email:</strong> <span className="text-gray-800">{order.customer_email}</span></div>
            {order.customer_phone && (
              <div><strong className="text-gray-700">Telefono:</strong> <span className="text-gray-800">{order.customer_phone}</span></div>
            )}
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-200">
          <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base md:text-lg text-gray-800 border-b border-emerald-300 pb-2">Informazioni Ordine</h4>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <strong className="text-gray-700">Importo Totale:</strong>
              <span className="text-lg sm:text-xl font-bold text-emerald-700">€{Number(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="break-words"><strong className="text-gray-700">Creato:</strong> <span className="text-gray-800">{formatDate(order.created_at)}</span></div>
            <div className="break-words"><strong className="text-gray-700">Ultimo Aggiornamento:</strong> <span className="text-gray-800">{formatDate(order.updated_at)}</span></div>
            {order.tracking_number && (
              <div className="break-all"><strong className="text-gray-700">Numero di Tracciamento:</strong> <span className="text-gray-800 font-mono text-xs sm:text-sm">{order.tracking_number}</span></div>
            )}
            {order.shipped_at && (
              <div className="break-words"><strong className="text-gray-700">Spedito:</strong> <span className="text-gray-800">{formatDate(order.shipped_at)}</span></div>
            )}
            {order.delivered_at && (
              <div className="break-words"><strong className="text-gray-700">Consegnato:</strong> <span className="text-gray-800">{formatDate(order.delivered_at)}</span></div>
            )}
          </div>
        </div>

        {/* Quick Actions for Pending Orders */}
        {order.status === 'pending' && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-bold mb-4 text-base sm:text-lg text-gray-800 border-b border-amber-300 pb-2">Azioni Rapide</h4>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => handleQuickStatusUpdate('accepted')}
                disabled={updating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
              >
                {updating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-5 w-5" />
                )}
                <span className="hidden sm:inline">Accetta Ordine</span>
                <span className="sm:hidden">Accetta</span>
              </Button>
              <Button
                onClick={() => handleQuickStatusUpdate('rejected')}
                disabled={updating}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 font-semibold py-3"
              >
                {updating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <X className="mr-2 h-5 w-5" />
                )}
                <span className="hidden sm:inline">Rifiuta Ordine</span>
                <span className="sm:hidden">Rifiuta</span>
              </Button>
            </div>
          </div>
        )}

        {/* Status Update Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-bold mb-4 text-base sm:text-lg text-gray-800 border-b border-gray-300 pb-2">Aggiorna Stato Ordine</h4>
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-sm sm:text-base font-semibold mb-3 block text-gray-700">Stato</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="text-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue placeholder="Seleziona stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In Attesa</SelectItem>
                  <SelectItem value="accepted">Accettato</SelectItem>
                  <SelectItem value="rejected">Rifiutato</SelectItem>
                  <SelectItem value="preparing">In Preparazione</SelectItem>
                  <SelectItem value="ready">Pronto per Ritiro/Consegna</SelectItem>
                  <SelectItem value="out_for_delivery">In Consegna</SelectItem>
                  <SelectItem value="delivered">Consegnato</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="cancelled">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newStatus === 'out_for_delivery' || newStatus === 'delivered') && (
              <div>
                <label className="text-sm sm:text-base font-semibold mb-3 block text-gray-700">Numero di Tracciamento</label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Numero di tracciamento (opzionale)"
                  className="text-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="text-sm sm:text-base font-semibold mb-3 block text-gray-700">Aggiungi Note</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive (opzionale)"
                rows={3}
                className="text-sm resize-none border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base h-10 sm:h-auto"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-xs sm:text-sm md:text-base">Aggiornamento in corso...</span>
                </>
              ) : (
                <span className="text-xs sm:text-sm md:text-base">Aggiorna Ordine</span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetails;
