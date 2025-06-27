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
    this.initializeAudioOnUserInteraction();
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
    console.log('🎵 createPhoneRingTone() called, audioContext:', !!this.audioContext);

    // Always use fallback for better compatibility
    console.log('📱 Using HTML5 audio fallback for better compatibility...');
    this.createFallbackRingTone();
    return;

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
    console.log('🔊 createFallbackRingTone() called');
    try {
      // Use custom notification sound if available
      if (this.settings.customNotificationSound && this.settings.notificationSoundUrl) {
        console.log('🎵 Playing custom notification sound:', this.settings.notificationSoundUrl);
        const audio = new Audio(this.settings.notificationSoundUrl);
        audio.volume = 0.8;
        audio.play().then(() => {
          console.log('✅ Custom audio played successfully');
        }).catch(error => {
          console.warn('❌ Failed to play custom notification sound:', error);
          this.playDefaultRingTone();
        });
      } else {
        console.log('🔔 Playing default ring tone');
        this.playDefaultRingTone();
      }
    } catch (error) {
      console.error('❌ Failed to create fallback ring tone:', error);
      this.playDefaultRingTone();
    }
  }

  private playDefaultRingTone() {
    console.log('🎶 playDefaultRingTone() called');
    try {
      // Create a simple notification sound using Web Audio API
      this.createWebAudioNotification();
    } catch (error) {
      console.error('❌ Failed to create default ring tone:', error);
      this.playAlternativeSound();
    }
  }

  private createWebAudioNotification() {
    console.log('🎵 Creating Web Audio notification...');
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a simple beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency for a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      // Set volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      console.log('✅ Web Audio notification created successfully');

      // Play multiple beeps for continuous notification
      setTimeout(() => this.createWebAudioNotification(), 1000);

    } catch (error) {
      console.warn('❌ Web Audio failed, trying alternative:', error);
      this.playAlternativeSound();
    }
  }

  private playAlternativeSound() {
    console.log('🔔 Trying alternative sound approach...');
    try {
      // Try a different audio approach
      const audio = new Audio();
      audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAATM=';
      audio.volume = 0.9;
      audio.loop = false;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Alternative sound played successfully');
        }).catch(error => {
          console.warn('❌ Alternative sound also failed:', error);
          // Last resort: try to create audio context manually
          this.tryManualAudioContext();
        });
      }
    } catch (error) {
      console.error('❌ Alternative sound failed:', error);
      this.tryManualAudioContext();
    }
  }

  private tryManualAudioContext() {
    console.log('🎵 Trying manual audio context creation...');
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      console.log('✅ Manual audio context sound created');
    } catch (error) {
      console.error('❌ Manual audio context also failed:', error);
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

  private initializeAudioOnUserInteraction() {
    // Set up audio context initialization on first user interaction
    const initAudio = async () => {
      try {
        console.log('🔊 Initializing audio context on user interaction...');

        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        console.log('✅ Audio context initialized:', audioContext.state);

        // Remove event listeners after first interaction
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
        document.removeEventListener('keydown', initAudio);

      } catch (error) {
        console.warn('❌ Failed to initialize audio context:', error);
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
  }

  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('📱 Wake lock acquired for mobile notification');

        // Release wake lock after 60 seconds to preserve battery
        setTimeout(() => {
          wakeLock.release();
          console.log('📱 Wake lock released');
        }, 60000);
      }
    } catch (error) {
      console.log('📱 Wake lock not supported or failed:', error);
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

  private triggerContinuousVibration() {
    if (!this.settings.vibrationEnabled) return;

    if ('vibrate' in navigator) {
      try {
        // Initial vibration pattern
        const vibratePattern = [500, 200, 500, 200, 500, 200, 500];
        navigator.vibrate(vibratePattern);

        // Continue vibrating every 3 seconds until ringing stops
        const vibrateInterval = setInterval(() => {
          if (this.isRinging && 'vibrate' in navigator) {
            navigator.vibrate(vibratePattern);
          } else {
            clearInterval(vibrateInterval);
          }
        }, 3000);
      } catch (error) {
        console.warn('Failed to trigger continuous vibration:', error);
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
    console.log('🚨 NOTIFICATION SERVICE CALLED:', { orderNumber, customerName, enabled: this.settings.enabled });

    if (!this.settings.enabled) {
      console.log('❌ Notification service is DISABLED');
      return;
    }

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
    console.log('🎵 Starting audio notification...');

    // Request wake lock to keep screen active on mobile
    await this.requestWakeLock();

    // Send SMS notification (don't block audio if this fails)
    try {
      await this.sendSMSNotification(orderNumber, customerName);
    } catch (error) {
      console.warn('SMS notification failed, continuing with audio:', error);
    }

    // Show browser notification (don't block audio if this fails)
    try {
      this.showBrowserNotification(orderNumber, customerName);
    } catch (error) {
      console.warn('Browser notification failed, continuing with audio:', error);
    }

    // Trigger mobile vibration (enhanced for continuous notification)
    this.triggerContinuousVibration();

    // Start phone ringing (will continue until manually stopped)
    console.log('🔔 Calling startRinging()...');
    this.startRinging();
    console.log('🎶 startRinging() completed, isRinging:', this.isRinging);
  }

  private startRinging() {
    console.log('🔔 startRinging() called, current isRinging:', this.isRinging);

    if (this.isRinging) {
      console.log('⚠️ Already ringing, skipping...');
      return;
    }

    console.log('🎵 Starting new ringing session...');
    this.isRinging = true;
    this.ringCount = 0;
    this.initializeAudioContext();

    const ring = () => {
      console.log(`🔊 Ring #${this.ringCount + 1}, isRinging: ${this.isRinging}`);

      // Continue ringing indefinitely until manually stopped (removed maxRings limit)
      if (!this.isRinging) {
        console.log('🔇 Ringing stopped, exiting ring loop');
        return;
      }

      this.createPhoneRingTone();
      this.ringCount++;

      // Schedule next ring - continue until manually stopped
      this.ringTimeout = setTimeout(() => {
        if (this.isRinging) {
          ring();
        }
      }, (this.settings.ringDuration + this.settings.ringInterval) * 1000);
    };

    console.log('🎶 Starting first ring...');
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

    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0); // Stop any ongoing vibration
    }

    console.log('🔇 Notification ringing and vibration stopped');
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
