
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
      // 1. Delete order notifications
      console.log('Deleting order notifications...');
      const { error: notificationsError } = await supabase
        .from('order_notifications')
        .delete()
        .eq('order_id', order.id);

      if (notificationsError) {
        console.warn('Failed to delete notifications:', notificationsError);
        // Continue anyway - notifications are not critical
      } else {
        console.log('✓ Order notifications deleted');
      }

      // 2. Delete order status history
      console.log('Deleting order status history...');
      const { error: statusHistoryError } = await supabase
        .from('order_status_history')
        .delete()
        .eq('order_id', order.id);

      if (statusHistoryError) {
        console.warn('Failed to delete status history:', statusHistoryError);
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
        console.log('✓ Order deleted successfully');
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Order #{order.order_number}
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline">
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <Button
              onClick={handleDeleteOrder}
              disabled={updating}
              variant="destructive"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div>
          <h4 className="font-semibold mb-2">{t('customerInformation')}</h4>
          <div className="space-y-1 text-sm">
            <div><strong>{t('name')}:</strong> {order.customer_name}</div>
            <div><strong>{t('email')}:</strong> {order.customer_email}</div>
            {order.customer_phone && (
              <div><strong>{t('phone')}:</strong> {order.customer_phone}</div>
            )}
          </div>
        </div>

        <Separator />

        {/* Order Information */}
        <div>
          <h4 className="font-semibold mb-2">{t('orderInformation')}</h4>
          <div className="space-y-1 text-sm">
            <div><strong>{t('totalAmount')}:</strong> {formatCurrency(Number(order.total_amount))}</div>
            <div><strong>{t('created')}:</strong> {formatDate(order.created_at)}</div>
            <div><strong>{t('lastUpdated')}:</strong> {formatDate(order.updated_at)}</div>
            {order.tracking_number && (
              <div><strong>{t('trackingNumber')}:</strong> {order.tracking_number}</div>
            )}
            {order.shipped_at && (
              <div><strong>{t('shipped')}:</strong> {formatDate(order.shipped_at)}</div>
            )}
            {order.delivered_at && (
              <div><strong>{t('delivered')}:</strong> {formatDate(order.delivered_at)}</div>
            )}
          </div>
        </div>

        <Separator />

        {/* Quick Actions for Pending Orders */}
        {order.status === 'pending' && (
          <div>
            <h4 className="font-semibold mb-3">Azioni Rapide</h4>
            <div className="flex gap-3">
              <Button
                onClick={() => handleQuickStatusUpdate('accepted')}
                disabled={updating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Accetta Ordine
              </Button>
              <Button
                onClick={() => handleQuickStatusUpdate('rejected')}
                disabled={updating}
                variant="destructive"
                className="flex-1"
              >
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Rifiuta Ordine
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Status Update Section */}
        <div>
          <h4 className="font-semibold mb-3">{t('updateOrderStatus')}</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('status')}</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="accepted">{t('accepted')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                  <SelectItem value="preparing">In Preparazione</SelectItem>
                  <SelectItem value="ready">Pronto per Ritiro/Consegna</SelectItem>
                  <SelectItem value="out_for_delivery">In Consegna</SelectItem>
                  <SelectItem value="delivered">{t('delivered')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newStatus === 'out_for_delivery' || newStatus === 'delivered') && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t('trackingNumber')}</label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={t('trackingNumberOptional')}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">{t('addNotes')}</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesOptional')}
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
              className="w-full"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('updateOrder')
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetails;
