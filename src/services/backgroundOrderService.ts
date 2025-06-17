// Background Order Service
// Handles persistent order notifications and background processing
// Works even when phone screen is off or app is in background

import { supabase } from '@/integrations/supabase/client';
import phoneNotificationService from './phoneNotificationService';

interface OrderNotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  persistentNotifications: boolean;
  backgroundSync: boolean;
  wakeScreen: boolean;
  maxRetries: number;
  retryInterval: number;
}

class BackgroundOrderService {
  private settings: OrderNotificationSettings;
  private isRunning: boolean = false;
  private serviceWorker: ServiceWorker | null = null;
  private realtimeChannel: any = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private wakeLock: any = null; // Screen Wake Lock API
  private lastOrderCheck: Date = new Date();
  private retryCount: number = 0;

  constructor() {
    this.settings = {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      persistentNotifications: true,
      backgroundSync: true,
      wakeScreen: true,
      maxRetries: 5,
      retryInterval: 30000 // 30 seconds
    };

    this.loadSettings();
    this.initializeService();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('backgroundOrderSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load background order settings:', error);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('backgroundOrderSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save background order settings:', error);
    }
  }

  public updateSettings(newSettings: Partial<OrderNotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    
    if (this.isRunning) {
      this.restart();
    }
  }

  public getSettings(): OrderNotificationSettings {
    return { ...this.settings };
  }

  private async initializeService() {
    try {
      console.log('🚀 Initializing Background Order Service...');

      // Register service worker for background processing
      await this.registerServiceWorker();

      // Request necessary permissions
      await this.requestPermissions();

      // Set up wake lock to prevent screen from sleeping
      await this.setupWakeLock();

      // Start the service
      await this.start();

      console.log('✅ Background Order Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Background Order Service:', error);
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('📦 Service Worker registered:', registration);

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        this.serviceWorker = registration.active;

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  private async requestPermissions() {
    // Request notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
    }

    // Request background sync permission (if available)
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('🔄 Background sync supported');
    }

    // Request persistent notification permission
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'persistent-notification' as any });
        console.log('📱 Persistent notification permission:', result.state);
      } catch (error) {
        console.log('📱 Persistent notification not supported');
      }
    }
  }

  private async setupWakeLock() {
    if (this.settings.wakeScreen && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('📱 Screen wake lock acquired');

        this.wakeLock.addEventListener('release', () => {
          console.log('📱 Screen wake lock released');
        });
      } catch (error) {
        console.error('❌ Failed to acquire wake lock:', error);
      }
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    console.log('💬 Message from Service Worker:', event.data);
    
    if (event.data.type === 'NEW_ORDER_NOTIFICATION') {
      this.handleNewOrderFromServiceWorker(event.data);
    }
  }

  private handleNewOrderFromServiceWorker(data: any) {
    const { orderNumber, customerName, amount, orderId } = data;
    
    // Trigger all notification methods
    this.triggerComprehensiveNotification(orderNumber, customerName, amount, orderId);
  }

  public async start() {
    if (this.isRunning) {
      console.log('⚠️ Background Order Service already running');
      return;
    }

    if (!this.settings.enabled) {
      console.log('⚠️ Background Order Service disabled');
      return;
    }

    console.log('🚀 Starting Background Order Service...');
    this.isRunning = true;

    // Set up real-time order monitoring
    await this.setupRealtimeMonitoring();

    // Start heartbeat to keep service alive
    this.startHeartbeat();

    // Start periodic sync
    if (this.settings.backgroundSync) {
      this.startPeriodicSync();
    }

    console.log('✅ Background Order Service started');
  }

  public async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Background Order Service...');
    this.isRunning = false;

    // Clean up real-time monitoring
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Stop periodic sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Release wake lock
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }

    console.log('✅ Background Order Service stopped');
  }

  public async restart() {
    await this.stop();
    await this.start();
  }

  private async setupRealtimeMonitoring() {
    try {
      this.realtimeChannel = supabase
        .channel('background-order-monitoring')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('🔔 New order detected in background service:', payload);
            this.handleNewOrder(payload.new);
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
            console.log('🔄 Order updated in background service:', payload);
            this.handleOrderUpdate(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime subscription status:', status);
        });

    } catch (error) {
      console.error('❌ Failed to setup realtime monitoring:', error);
      this.scheduleRetry();
    }
  }

  private handleNewOrder(order: any) {
    const { order_number, customer_name, total_amount, id } = order;
    
    console.log('🔔 Processing new order in background:', order_number);
    
    // Trigger comprehensive notification
    this.triggerComprehensiveNotification(
      order_number,
      customer_name,
      `$${total_amount}`,
      id
    );

    // Update last check time
    this.lastOrderCheck = new Date();
    this.retryCount = 0; // Reset retry count on successful processing
  }

  private handleOrderUpdate(order: any) {
    console.log('🔄 Order updated:', order.order_number, 'Status:', order.status);
    
    // You could add specific handling for order status changes here
    if (order.status === 'accepted' || order.status === 'completed') {
      // Maybe send a different type of notification
    }
  }

  private triggerComprehensiveNotification(
    orderNumber: string,
    customerName: string,
    amount: string,
    orderId: string
  ) {
    console.log('🚨 Triggering comprehensive notification for order:', orderNumber);
    console.log('📍 Current page:', window.location.pathname);

    // 1. Phone notification service (sound + vibration)
    // ONLY play sounds on the admin/orders pages (backend)
    if (this.settings.soundEnabled && this.isOnAdminPage()) {
      console.log('🔊 Playing notification sound (admin page detected)');
      phoneNotificationService.notifyNewOrder(orderNumber, customerName);
    } else if (this.settings.soundEnabled) {
      console.log('🔇 Notification sound disabled (not on admin page)');
    }

    // 2. Browser notification (persistent)
    if (this.settings.persistentNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`🔔 New Order #${orderNumber}`, {
        body: `Order from ${customerName} - ${amount}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-order',
        requireInteraction: true,
        silent: !this.settings.soundEnabled,
        // vibrate: this.settings.vibrationEnabled ? [200, 100, 200, 100, 200] : undefined, // Not supported in all browsers
        actions: [
          {
            action: 'view',
            title: 'View Order'
          },
          {
            action: 'accept',
            title: 'Accept'
          }
        ],
        data: {
          orderId,
          orderNumber,
          url: '/orders'
        }
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/orders';
        notification.close();
      };
    }

    // 3. Service Worker notification (for background)
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'NEW_ORDER',
        orderNumber,
        customerName,
        amount,
        orderId
      });
    }

    // 4. Vibration (if supported and enabled)
    if (this.settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }

    // 5. Wake screen (if wake lock is active)
    if (this.wakeLock && this.settings.wakeScreen) {
      // The wake lock should keep the screen on
      console.log('📱 Screen should stay awake for notification');
    }

    // 6. Focus window if possible
    if (window && document.hidden) {
      try {
        window.focus();
      } catch (error) {
        console.log('Could not focus window:', error);
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isRunning) {
        console.log('💓 Background Order Service heartbeat');
        
        // Check if realtime connection is still active
        if (this.realtimeChannel && this.realtimeChannel.state !== 'joined') {
          console.log('🔄 Realtime connection lost, reconnecting...');
          this.setupRealtimeMonitoring();
        }
      }
    }, 60000); // Every minute
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.syncOrders();
      }
    }, 30000); // Every 30 seconds
  }

  private async syncOrders() {
    try {
      console.log('🔄 Syncing orders in background...');
      
      // Check for new orders since last check
      const { data: newOrders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', this.lastOrderCheck.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (newOrders && newOrders.length > 0) {
        console.log(`📦 Found ${newOrders.length} new orders during sync`);
        
        // Process each new order
        newOrders.forEach(order => {
          if (new Date(order.created_at) > this.lastOrderCheck) {
            this.handleNewOrder(order);
          }
        });
      }

      this.lastOrderCheck = new Date();
      this.retryCount = 0;

    } catch (error) {
      console.error('❌ Order sync failed:', error);
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    if (this.retryCount < this.settings.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Scheduling retry ${this.retryCount}/${this.settings.maxRetries} in ${this.settings.retryInterval}ms`);

      setTimeout(() => {
        if (this.isRunning) {
          this.setupRealtimeMonitoring();
        }
      }, this.settings.retryInterval);
    } else {
      console.error('❌ Max retries reached, stopping background service');
      this.stop();
    }
  }

  private isOnAdminPage(): boolean {
    const pathname = window.location.pathname;
    const adminPages = ['/admin', '/orders', '/order-dashboard'];

    // Check if current page is an admin page
    const isAdmin = adminPages.some(page => pathname.startsWith(page));

    console.log(`📍 Page check: ${pathname} -> Admin: ${isAdmin}`);
    return isAdmin;
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      hasServiceWorker: !!this.serviceWorker,
      hasWakeLock: !!this.wakeLock,
      hasRealtimeConnection: this.realtimeChannel?.state === 'joined',
      lastOrderCheck: this.lastOrderCheck,
      retryCount: this.retryCount,
      settings: this.settings
    };
  }
}

// Export singleton instance
export const backgroundOrderService = new BackgroundOrderService();
export default backgroundOrderService;
