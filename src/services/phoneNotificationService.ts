// Phone Notification Service for Order Management
// This service handles phone notifications when new orders are received

interface PhoneNotificationSettings {
  enabled: boolean;
  phoneNumber: string;
  ringDuration: number; // in seconds
  ringInterval: number; // in seconds between rings
  maxRings: number;
  vibrationEnabled: boolean; // for mobile devices
  browserNotificationEnabled: boolean; // for browser notifications
  customNotificationSound: boolean; // whether to use custom sound
  notificationSoundUrl: string; // URL to custom notification sound
  notificationSoundName: string; // name of the custom sound file
}

class PhoneNotificationService {
  private settings: PhoneNotificationSettings;
  private audioContext: AudioContext | null = null;
  private isRinging: boolean = false;
  private ringCount: number = 0;
  private ringTimeout: NodeJS.Timeout | null = null;
  private ringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = {
      enabled: true,
      phoneNumber: '',
      ringDuration: 3,
      ringInterval: 2,
      maxRings: 10,
      vibrationEnabled: true,
      browserNotificationEnabled: true,
      customNotificationSound: false,
      notificationSoundUrl: '',
      notificationSoundName: 'Default Ring Tone'
    };
    this.loadSettings();
    this.requestNotificationPermission();
  }

  private async loadSettings() {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'phoneNotificationSettings')
        .single();

      if (!error && data) {
        this.settings = { ...this.settings, ...data.value };
      }
    } catch (error) {
      console.warn('Failed to load phone notification settings:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('phoneNotificationSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    }
  }

  private async saveSettings() {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'phoneNotificationSettings', value: this.settings });

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to save phone notification settings:', error);
      // Fallback to localStorage
      localStorage.setItem('phoneNotificationSettings', JSON.stringify(this.settings));
    }
  }

  private initializeAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Resume audio context if it's suspended (common on mobile)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(error => {
            console.warn('Failed to resume audio context:', error);
          });
        }
      } catch (error) {
        console.error('Failed to create audio context:', error);
        this.audioContext = null;
      }
    }
  }

  private createPhoneRingTone() {
    if (!this.audioContext) {
      // Fallback to HTML5 audio for mobile compatibility
      this.createFallbackRingTone();
      return;
    }

    try {
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Create a phone ring tone (two-tone)
      oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
      oscillator2.frequency.setValueAtTime(480, this.audioContext.currentTime); // A#4

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Ring pattern: on for 1 second, off for 0.5 seconds, repeat
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 1.1);
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + 1.6);
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 2.6);

      oscillator1.start(this.audioContext.currentTime);
      oscillator2.start(this.audioContext.currentTime);
      oscillator1.stop(this.audioContext.currentTime + this.settings.ringDuration);
      oscillator2.stop(this.audioContext.currentTime + this.settings.ringDuration);
    } catch (error) {
      console.error('Failed to create ring tone with Web Audio API:', error);
      this.createFallbackRingTone();
    }
  }

  private createFallbackRingTone() {
    try {
      // Use custom notification sound if available
      if (this.settings.customNotificationSound && this.settings.notificationSoundUrl) {
        const audio = new Audio(this.settings.notificationSoundUrl);
        audio.volume = 0.7;
        audio.play().catch(error => {
          console.warn('Failed to play custom notification sound:', error);
          this.playDefaultRingTone();
        });
      } else {
        this.playDefaultRingTone();
      }
    } catch (error) {
      console.error('Failed to create fallback ring tone:', error);
      this.playDefaultRingTone();
    }
  }

  private playDefaultRingTone() {
    try {
      // Create a simple beep sound using HTML5 audio
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAzKH0fPTgjAHJXfH8N2QQAoUXrTp66hVFApGn+DyvmEaAw==');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.warn('Failed to play default ring tone:', error);
      });
    } catch (error) {
      console.error('Failed to create default ring tone:', error);
    }
  }

  private async sendSMSNotification(orderNumber: string, customerName: string) {
    if (!this.settings.phoneNumber) return;

    try {
      // This would integrate with a SMS service like Twilio
      // For now, we'll just log it
      console.log(`SMS would be sent to ${this.settings.phoneNumber}:`);
      console.log(`New order received: #${orderNumber} from ${customerName}`);
      
      // In a real implementation, you would call your SMS service here
      // Example with Twilio:
      // await fetch('/api/send-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: this.settings.phoneNumber,
      //     message: `New order received: #${orderNumber} from ${customerName}`
      //   })
      // });
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }
  }

  private async requestNotificationPermission() {
    if ('Notification' in window && this.settings.browserNotificationEnabled) {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }

  private triggerVibration() {
    if (!this.settings.vibrationEnabled) return;

    if ('vibrate' in navigator) {
      try {
        // Vibration pattern: vibrate for 500ms, pause 200ms, repeat 3 times
        navigator.vibrate([500, 200, 500, 200, 500]);
      } catch (error) {
        console.warn('Failed to trigger vibration:', error);
      }
    }
  }

  private showBrowserNotification(orderNumber: string, customerName: string) {
    if (!this.settings.browserNotificationEnabled) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification('New Order Received! 🔔', {
          body: `Order #${orderNumber} from ${customerName}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'new-order',
          requireInteraction: true,
          silent: false
        });

        // Auto-close notification after 10 seconds
        setTimeout(() => {
          notification.close();
        }, 10000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.warn('Failed to show browser notification:', error);
      }
    }
  }

  public async notifyNewOrder(orderNumber: string, customerName: string) {
    if (!this.settings.enabled) return;

    const currentPage = window.location.pathname;
    console.log(`📞 Phone notification for order #${orderNumber} from ${customerName} - Page: ${currentPage}`);

    // Check if we're on an admin page - only play sounds on backend pages
    const adminPages = ['/admin', '/orders', '/order-dashboard'];
    const isAdminPage = adminPages.some(page => currentPage.startsWith(page));

    if (!isAdminPage) {
      console.log('🔇 Notification sound blocked - not on admin page');
      return;
    }

    console.log('🔊 Playing notification sound - admin page confirmed');

    // Send SMS notification
    await this.sendSMSNotification(orderNumber, customerName);

    // Show browser notification
    this.showBrowserNotification(orderNumber, customerName);

    // Trigger mobile vibration
    this.triggerVibration();

    // Start phone ringing
    this.startRinging();
  }

  private startRinging() {
    if (this.isRinging) return;

    this.isRinging = true;
    this.ringCount = 0;
    this.initializeAudioContext();

    const ring = () => {
      if (this.ringCount >= this.settings.maxRings) {
        this.stopRinging();
        return;
      }

      this.createPhoneRingTone();
      this.ringCount++;

      // Schedule next ring
      this.ringTimeout = setTimeout(() => {
        if (this.isRinging) {
          ring();
        }
      }, (this.settings.ringDuration + this.settings.ringInterval) * 1000);
    };

    ring();
  }

  public stopRinging() {
    this.isRinging = false;
    this.ringCount = 0;

    if (this.ringTimeout) {
      clearTimeout(this.ringTimeout);
      this.ringTimeout = null;
    }

    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  public updateSettings(newSettings: Partial<PhoneNotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  public getSettings(): PhoneNotificationSettings {
    return { ...this.settings };
  }

  public isCurrentlyRinging(): boolean {
    return this.isRinging;
  }

  public getRingCount(): number {
    return this.ringCount;
  }

  public updateNotificationSound(soundUrl: string, soundName: string) {
    this.settings.customNotificationSound = true;
    this.settings.notificationSoundUrl = soundUrl;
    this.settings.notificationSoundName = soundName;
    this.saveSettings();
  }

  public resetToDefaultSound() {
    this.settings.customNotificationSound = false;
    this.settings.notificationSoundUrl = '';
    this.settings.notificationSoundName = 'Default Ring Tone';
    this.saveSettings();
  }

  public testNotificationSound() {
    this.createFallbackRingTone();
  }
}

// Export singleton instance
export const phoneNotificationService = new PhoneNotificationService();
export default phoneNotificationService;
