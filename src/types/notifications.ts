// Simplified Notification Types
// Basic types for the new order dashboard

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

// Default notification settings - EXTREMELY AGGRESSIVE FOR MAXIMUM ATTENTION
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  browserNotificationsEnabled: true,
  emailNotificationsEnabled: false,
  ringDuration: 5, // LONGER RING DURATION
  ringInterval: 1, // SHORTER INTERVAL BETWEEN RINGS
  maxRings: 20, // MORE RINGS - IMPOSSIBLE TO MISS
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

// Audio patterns for different notification types - EXTREMELY STRONG AND AUDIBLE
export const AUDIO_PATTERNS: Record<NotificationType, AudioNotificationConfig> = {
  order_created: {
    frequency: 1200, // HIGHER FREQUENCY - MORE PIERCING
    duration: 1.0, // LONGER DURATION
    volume: 1.0, // MAXIMUM VOLUME
    pattern: 'continuous', // CONTINUOUS PATTERN - IMPOSSIBLE TO MISS
  },
  order_paid: {
    frequency: 1500, // VERY HIGH FREQUENCY - EXTREMELY AUDIBLE
    duration: 0.8, // LONGER DURATION
    volume: 1.0, // MAXIMUM VOLUME
    pattern: 'triple', // TRIPLE BEEPS
  },
  order_updated: {
    frequency: 1000, // HIGHER FREQUENCY
    duration: 0.6, // LONGER DURATION
    volume: 1.0, // MAXIMUM VOLUME
    pattern: 'double', // DOUBLE BEEPS
  },
  order_cancelled: {
    frequency: 800, // STRONG FREQUENCY
    duration: 1.2, // MUCH LONGER DURATION
    volume: 1.0, // MAXIMUM VOLUME
    pattern: 'continuous', // CONTINUOUS PATTERN
  },
  payment_failed: {
    frequency: 500, // DEEP URGENT FREQUENCY
    duration: 2.0, // VERY LONG DURATION
    volume: 1.0, // MAXIMUM VOLUME
    pattern: 'continuous', // CONTINUOUS URGENT PATTERN
  },
  payment_completed: {
    frequency: 1800, // EXTREMELY HIGH FREQUENCY - VERY PIERCING
    duration: 0.8, // LONGER DURATION
    volume: 1.0, // MAXIMUM VOLUME
    pattern: 'triple', // TRIPLE SUCCESS BEEPS
  },
};
