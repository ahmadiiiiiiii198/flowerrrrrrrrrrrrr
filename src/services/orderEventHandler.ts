// Order Event Handler
// Handles order-related events and creates appropriate notifications

import { supabase } from '@/integrations/supabase/client';
import notificationService from './notificationService';
import {
  NotificationEvent,
  NotificationType,
  OrderData,
  OrderStatus,
  PaymentStatus,
} from '@/types/notifications';

export class OrderEventHandler {
  private realtimeChannel: any = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupOrderSubscriptions();
  }

  private setupOrderSubscriptions(): void {
    this.realtimeChannel = supabase
      .channel('order-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 New order created:', payload);
          this.handleOrderCreated(payload.new as OrderData);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 Order updated:', payload);
          this.handleOrderUpdated(payload.old as OrderData, payload.new as OrderData);
        }
      )
      .subscribe();
  }

  private async handleOrderCreated(order: OrderData): Promise<void> {
    console.log(`🎉 Processing new order: ${order.order_number}`);

    const event: NotificationEvent = {
      type: 'payment_failed', // Use payment_failed for CONTINUOUS ringing
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      amount: order.total_amount,
      metadata: {
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        amount: order.total_amount,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
      },
    };

    await notificationService.createNotification(event);
  }

  private async handleOrderUpdated(oldOrder: OrderData, newOrder: OrderData): Promise<void> {
    console.log(`🔄 Processing order update: ${newOrder.order_number}`);

    // Check for status changes
    if (oldOrder.status !== newOrder.status) {
      await this.handleStatusChange(oldOrder, newOrder);
    }

    // Check for payment status changes
    if (oldOrder.payment_status !== newOrder.payment_status) {
      await this.handlePaymentStatusChange(oldOrder, newOrder);
    }

    // General order update notification (low priority)
    if (this.shouldCreateUpdateNotification(oldOrder, newOrder)) {
      const event: NotificationEvent = {
        type: 'order_updated',
        orderId: newOrder.id,
        orderNumber: newOrder.order_number,
        customerName: newOrder.customer_name,
        amount: newOrder.total_amount,
        metadata: {
          previous_status: oldOrder.status,
          new_status: newOrder.status,
          previous_payment_status: oldOrder.payment_status,
          new_payment_status: newOrder.payment_status,
        },
      };

      await notificationService.createNotification(event);
    }
  }

  private async handleStatusChange(oldOrder: OrderData, newOrder: OrderData): Promise<void> {
    const { status: newStatus } = newOrder;
    const { status: oldStatus } = oldOrder;

    console.log(`📊 Order status changed: ${oldStatus} → ${newStatus}`);

    // Handle specific status changes
    switch (newStatus) {
      case 'cancelled':
        await this.createCancellationNotification(newOrder, oldStatus);
        break;
      
      case 'accepted':
        await this.createAcceptanceNotification(newOrder);
        break;
      
      case 'completed':
        await this.createCompletionNotification(newOrder);
        break;
      
      default:
        // General status update
        break;
    }
  }

  private async handlePaymentStatusChange(oldOrder: OrderData, newOrder: OrderData): Promise<void> {
    const { payment_status: newPaymentStatus } = newOrder;
    const { payment_status: oldPaymentStatus } = oldOrder;

    console.log(`💳 Payment status changed: ${oldPaymentStatus} → ${newPaymentStatus}`);

    switch (newPaymentStatus) {
      case 'completed':
        await this.createPaymentCompletedNotification(newOrder);
        break;
      
      case 'failed':
        await this.createPaymentFailedNotification(newOrder);
        break;
      
      default:
        break;
    }
  }

  private async createCancellationNotification(order: OrderData, previousStatus: string): Promise<void> {
    const event: NotificationEvent = {
      type: 'order_cancelled',
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      amount: order.total_amount,
      metadata: {
        previous_status: previousStatus,
        cancellation_time: new Date().toISOString(),
      },
    };

    await notificationService.createNotification(event);
  }

  private async createAcceptanceNotification(order: OrderData): Promise<void> {
    // This could be a lower priority notification
    const event: NotificationEvent = {
      type: 'order_updated',
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      amount: order.total_amount,
      metadata: {
        new_status: 'accepted',
        acceptance_time: new Date().toISOString(),
      },
    };

    await notificationService.createNotification(event);
  }

  private async createCompletionNotification(order: OrderData): Promise<void> {
    const event: NotificationEvent = {
      type: 'order_updated',
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      amount: order.total_amount,
      metadata: {
        new_status: 'completed',
        completion_time: new Date().toISOString(),
      },
    };

    await notificationService.createNotification(event);
  }

  private async createPaymentCompletedNotification(order: OrderData): Promise<void> {
    const event: NotificationEvent = {
      type: 'payment_completed',
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      amount: order.total_amount,
      metadata: {
        payment_completion_time: new Date().toISOString(),
        amount: order.total_amount,
      },
    };

    await notificationService.createNotification(event);
  }

  private async createPaymentFailedNotification(order: OrderData): Promise<void> {
    const event: NotificationEvent = {
      type: 'payment_failed',
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      amount: order.total_amount,
      metadata: {
        payment_failure_time: new Date().toISOString(),
        amount: order.total_amount,
      },
    };

    await notificationService.createNotification(event);
  }

  private shouldCreateUpdateNotification(oldOrder: OrderData, newOrder: OrderData): boolean {
    // Only create update notifications for significant changes
    const significantFields = ['status', 'payment_status', 'total_amount'];
    
    return significantFields.some(field => 
      oldOrder[field as keyof OrderData] !== newOrder[field as keyof OrderData]
    );
  }

  // Manual notification creation methods
  public async createOrderNotification(orderId: string, type: NotificationType): Promise<void> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      const event: NotificationEvent = {
        type,
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        amount: order.total_amount,
        metadata: {
          manual_creation: true,
          created_at: new Date().toISOString(),
        },
      };

      await notificationService.createNotification(event);
    } catch (error) {
      console.error('Failed to create manual notification:', error);
    }
  }

  public async createTestNotification(): Promise<void> {
    const event: NotificationEvent = {
      type: 'order_created',
      orderId: 'test-order-id',
      orderNumber: `TEST-${Date.now()}`,
      customerName: 'Test Customer',
      amount: 25.99,
      metadata: {
        test_notification: true,
        created_at: new Date().toISOString(),
      },
    };

    await notificationService.createNotification(event);
  }

  public destroy(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
  }
}

// Export singleton instance
export const orderEventHandler = new OrderEventHandler();
export default orderEventHandler;
