// Core Notification Service
// Handles all notification operations including creation, management, and delivery

import { supabase } from '@/integrations/supabase/client';
import {
  NotificationData,
  NotificationEvent,
  NotificationSettings,
  NotificationType,
  NotificationPriority,
  DEFAULT_NOTIFICATION_SETTINGS,
  OrderData,
} from '@/types/notifications';

export class NotificationService {
  private settings: NotificationSettings;
  private listeners: Map<string, (notification: NotificationData) => void> = new Map();
  private realtimeChannel: any = null;

  constructor() {
    this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS };
    this.initialize();
  }

  private async initialize() {
    await this.loadSettings();
    this.setupRealtimeSubscription();
    this.requestBrowserPermissions();
  }

  // Settings Management
  private async loadSettings(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'notification_settings')
        .single();

      if (!error && data?.value) {
        this.settings = { ...this.settings, ...data.value };
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('notification_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    }
  }

  public async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'notification_settings',
          value: this.settings,
        });

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to save notification settings:', error);
      localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Notification Creation
  public async createNotification(event: NotificationEvent): Promise<NotificationData | null> {
    try {
      const typeConfig = this.settings.notificationTypes[event.type];
      if (!typeConfig.enabled) {
        console.log(`Notification type ${event.type} is disabled`);
        return null;
      }

      const message = this.generateMessage(event);
      const notificationData = {
        order_id: event.orderId,
        message,
        notification_type: event.type,
        priority: typeConfig.priority,
        is_read: false,
        metadata: {
          order_number: event.orderNumber,
          customer_name: event.customerName,
          amount: event.amount,
          ...event.metadata,
        },
      };

      const { data, error } = await supabase
        .from('order_notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Notification created: ${event.type} for order ${event.orderNumber}`);
      return data as NotificationData;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  private generateMessage(event: NotificationEvent): string {
    const { type, orderNumber, customerName, amount } = event;
    
    switch (type) {
      case 'order_created':
        return `New order #${orderNumber} received from ${customerName}`;
      case 'order_paid':
        return `Payment completed for order #${orderNumber} by ${customerName}`;
      case 'order_updated':
        return `Order #${orderNumber} has been updated`;
      case 'order_cancelled':
        return `Order #${orderNumber} has been cancelled`;
      case 'payment_failed':
        return `Payment failed for order #${orderNumber}`;
      case 'payment_completed':
        return `Payment of €${amount?.toFixed(2)} completed for order #${orderNumber}`;
      default:
        return `Notification for order #${orderNumber}`;
    }
  }

  // Notification Retrieval
  public async getNotifications(unreadOnly: boolean = true): Promise<NotificationData[]> {
    try {
      let query = supabase
        .from('order_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as NotificationData[];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  public async getNotificationCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('order_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get notification count:', error);
      return 0;
    }
  }

  // Notification Management
  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
      console.log(`✅ Notification ${notificationId} marked as read`);
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  public async markAllAsRead(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('is_read', false);

      if (error) throw error;
      console.log('✅ All notifications marked as read');
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      console.log(`✅ Notification ${notificationId} deleted`);
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  // Real-time Subscription
  private setupRealtimeSubscription(): void {
    this.realtimeChannel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          const notification = payload.new as NotificationData;
          this.handleNewNotification(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_notifications',
        },
        (payload) => {
          console.log('🔄 Notification updated:', payload);
          this.notifyListeners('notification_updated', payload.new as NotificationData);
        }
      )
      .subscribe();
  }

  private handleNewNotification(notification: NotificationData): void {
    // Notify all listeners
    this.notifyListeners('notification_created', notification);
    
    // Check if this notification type should trigger alerts
    const typeConfig = this.settings.notificationTypes[notification.notification_type];
    if (typeConfig.enabled) {
      this.triggerNotificationAlert(notification);
    }
  }

  private triggerNotificationAlert(notification: NotificationData): void {
    // This will be handled by the AudioNotificationService
    // Emit event for other services to handle
    window.dispatchEvent(new CustomEvent('newNotification', {
      detail: notification
    }));
  }

  // Event Listeners
  public addListener(id: string, callback: (notification: NotificationData) => void): void {
    this.listeners.set(id, callback);
  }

  public removeListener(id: string): void {
    this.listeners.delete(id);
  }

  private notifyListeners(event: string, notification: NotificationData): void {
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Browser Permissions
  private async requestBrowserPermissions(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
