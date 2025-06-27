// Notification System Types
// Complete type definitions for the new notification system

export interface NotificationData {
  id: string;
  order_id: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  metadata: NotificationMetadata;
}

export interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
}

export type NotificationType = 
  | 'order_created'
  | 'order_paid'
  | 'order_updated'
  | 'order_cancelled'
  | 'payment_failed'
  | 'payment_completed';

export type NotificationPriority = 1 | 2 | 3 | 4 | 5; // 1 = lowest, 5 = highest

export type OrderStatus = 
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'accepted'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface NotificationMetadata {
  order_number?: string;
  customer_name?: string;
  amount?: number;
  previous_status?: string;
  new_status?: string;
  payment_method?: string;
  [key: string]: any;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  browserNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  ringDuration: number; // seconds
  ringInterval: number; // seconds between rings
  maxRings: number;
  customSoundUrl?: string;
  customSoundName?: string;
  notificationTypes: {
    [K in NotificationType]: {
      enabled: boolean;
      priority: NotificationPriority;
      soundEnabled: boolean;
      persistentNotification: boolean;
    };
  };
}

export interface NotificationEvent {
  type: NotificationType;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount?: number;
  metadata?: NotificationMetadata;
}

export interface AudioNotificationConfig {
  frequency: number;
  duration: number;
  volume: number;
  pattern: 'single' | 'double' | 'triple' | 'continuous';
}

export interface NotificationChannel {
  id: string;
  name: string;
  enabled: boolean;
  handler: (notification: NotificationData) => Promise<void>;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  browserNotificationsEnabled: true,
  emailNotificationsEnabled: false,
  ringDuration: 3,
  ringInterval: 2,
  maxRings: 10,
  notificationTypes: {
    order_created: {
      enabled: true,
      priority: 5,
      soundEnabled: true,
      persistentNotification: true,
    },
    order_paid: {
      enabled: true,
      priority: 5,
      soundEnabled: true,
      persistentNotification: true,
    },
    order_updated: {
      enabled: true,
      priority: 3,
      soundEnabled: false,
      persistentNotification: false,
    },
    order_cancelled: {
      enabled: true,
      priority: 4,
      soundEnabled: true,
      persistentNotification: true,
    },
    payment_failed: {
      enabled: true,
      priority: 4,
      soundEnabled: true,
      persistentNotification: true,
    },
    payment_completed: {
      enabled: true,
      priority: 5,
      soundEnabled: true,
      persistentNotification: true,
    },
  },
};

// Audio patterns for different notification types
export const AUDIO_PATTERNS: Record<NotificationType, AudioNotificationConfig> = {
  order_created: {
    frequency: 800,
    duration: 0.5,
    volume: 0.7,
    pattern: 'triple',
  },
  order_paid: {
    frequency: 1000,
    duration: 0.3,
    volume: 0.8,
    pattern: 'double',
  },
  order_updated: {
    frequency: 600,
    duration: 0.2,
    volume: 0.5,
    pattern: 'single',
  },
  order_cancelled: {
    frequency: 400,
    duration: 0.8,
    volume: 0.6,
    pattern: 'single',
  },
  payment_failed: {
    frequency: 300,
    duration: 1.0,
    volume: 0.7,
    pattern: 'continuous',
  },
  payment_completed: {
    frequency: 1200,
    duration: 0.4,
    volume: 0.8,
    pattern: 'single', // Single notification for completed Stripe payments
  },
};
