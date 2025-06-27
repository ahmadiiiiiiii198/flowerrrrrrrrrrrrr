// Notification System Initializer
// Coordinates all notification services and provides a unified interface

import notificationService from './notificationService';
import audioNotificationService from './audioNotificationService';
import orderEventHandler from './orderEventHandler';
import { NotificationEvent, NotificationType } from '@/types/notifications';

export class NotificationSystem {
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🔔 Notification system already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing notification system...');

      // Services are auto-initialized in their constructors
      // Just ensure they're loaded
      await this.ensureServicesReady();

      this.initialized = true;
      console.log('✅ Notification system initialized successfully');

      // Test the system in development
      if (process.env.NODE_ENV === 'development') {
        this.runDevelopmentTests();
      }

    } catch (error) {
      console.error('❌ Failed to initialize notification system:', error);
      throw error;
    }
  }

  private async ensureServicesReady(): Promise<void> {
    // Ensure all services are properly loaded
    const services = [
      notificationService,
      audioNotificationService,
      orderEventHandler
    ];

    console.log(`🔧 ${services.length} notification services loaded`);
  }

  private runDevelopmentTests(): void {
    console.log('🧪 Running development tests...');
    
    // Test notification creation after a delay
    setTimeout(() => {
      console.log('🧪 Creating test notification...');
      this.createTestNotification();
    }, 2000);
  }

  // Public API methods
  public async createTestNotification(): Promise<void> {
    await orderEventHandler.createTestNotification();
  }

  public async createOrderNotification(
    orderId: string, 
    type: NotificationType
  ): Promise<void> {
    await orderEventHandler.createOrderNotification(orderId, type);
  }

  public async createCustomNotification(event: NotificationEvent): Promise<void> {
    await notificationService.createNotification(event);
  }

  public stopAllAudio(): void {
    audioNotificationService.stopNotificationSound();
  }

  public testAudioForType(type: NotificationType): void {
    audioNotificationService.testNotificationSound(type);
  }

  public testAllAudioTypes(): void {
    audioNotificationService.testAllSounds();
  }

  public getNotificationService() {
    return notificationService;
  }

  public getAudioService() {
    return audioNotificationService;
  }

  public getOrderEventHandler() {
    return orderEventHandler;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async destroy(): Promise<void> {
    console.log('🔄 Destroying notification system...');
    
    try {
      audioNotificationService.destroy();
      orderEventHandler.destroy();
      notificationService.destroy();
      
      this.initialized = false;
      console.log('✅ Notification system destroyed');
    } catch (error) {
      console.error('❌ Error destroying notification system:', error);
    }
  }

  // Utility methods
  public async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
  }> {
    try {
      const [allNotifications, unreadCount] = await Promise.all([
        notificationService.getNotifications(false),
        notificationService.getNotificationCount()
      ]);

      const byType = allNotifications.reduce((acc, notification) => {
        acc[notification.notification_type] = (acc[notification.notification_type] || 0) + 1;
        return acc;
      }, {} as Record<NotificationType, number>);

      return {
        total: allNotifications.length,
        unread: unreadCount,
        byType
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {} as Record<NotificationType, number>
      };
    }
  }

  public async clearAllNotifications(): Promise<boolean> {
    try {
      // This would need to be implemented in notificationService
      // For now, just mark all as read
      return await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      return false;
    }
  }

  // Health check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      notificationService: boolean;
      audioService: boolean;
      orderEventHandler: boolean;
    };
    lastError?: string;
  }> {
    try {
      const services = {
        notificationService: !!notificationService,
        audioService: !!audioNotificationService,
        orderEventHandler: !!orderEventHandler
      };

      const allHealthy = Object.values(services).every(Boolean);
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        services
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          notificationService: false,
          audioService: false,
          orderEventHandler: false
        },
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const notificationSystem = new NotificationSystem();
export default notificationSystem;

// Auto-initialize when imported
notificationSystem.initialize().catch(error => {
  console.error('Failed to auto-initialize notification system:', error);
});
