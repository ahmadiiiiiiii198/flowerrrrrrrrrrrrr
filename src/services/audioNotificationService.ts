// Audio Notification Service
// Handles all audio-related notifications including sounds, vibrations, and patterns

import {
  NotificationData,
  NotificationType,
  AudioNotificationConfig,
  AUDIO_PATTERNS,
} from '@/types/notifications';
import notificationService from './notificationService';

export class AudioNotificationService {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentRingCount: number = 0;
  private ringInterval: NodeJS.Timeout | null = null;
  private stopCallback: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for new notifications
    window.addEventListener('newNotification', this.handleNewNotification.bind(this));
    
    // Initialize audio context on user interaction
    this.initializeAudioOnUserInteraction();
  }

  private initializeAudioOnUserInteraction(): void {
    const initAudio = () => {
      this.initializeAudioContext();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    document.addEventListener('keydown', initAudio);
  }

  private initializeAudioContext(): void {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(error => {
            console.warn('Failed to resume audio context:', error);
          });
        }
        
        console.log('🎵 Audio context initialized');
      } catch (error) {
        console.error('Failed to create audio context:', error);
      }
    }
  }

  private handleNewNotification(event: CustomEvent): void {
    const notification = event.detail as NotificationData;
    const settings = notificationService.getSettings();
    
    if (!settings.soundEnabled) {
      console.log('🔇 Audio notifications disabled');
      return;
    }

    const typeConfig = settings.notificationTypes[notification.notification_type];
    if (!typeConfig.soundEnabled) {
      console.log(`🔇 Audio disabled for ${notification.notification_type}`);
      return;
    }

    this.playNotificationSound(notification.notification_type);
  }

  public playNotificationSound(type: NotificationType): void {
    if (!this.audioContext) {
      console.warn('Audio context not initialized');
      return;
    }

    if (this.isPlaying) {
      console.log('Audio already playing, stopping current...');
      this.stopNotificationSound();
    }

    const config = AUDIO_PATTERNS[type];
    const settings = notificationService.getSettings();
    
    console.log(`🎵 Playing ${config.pattern} notification for ${type}`);
    
    this.isPlaying = true;
    this.currentRingCount = 0;
    
    this.playPattern(config, settings.maxRings);
  }

  private playPattern(config: AudioNotificationConfig, maxRings: number): void {
    if (!this.audioContext || this.currentRingCount >= maxRings) {
      this.stopNotificationSound();
      return;
    }

    const settings = notificationService.getSettings();
    
    switch (config.pattern) {
      case 'single':
        this.playSingleTone(config);
        break;
      case 'double':
        this.playDoubleTone(config);
        break;
      case 'triple':
        this.playTripleTone(config);
        break;
      case 'continuous':
        this.playContinuousTone(config);
        break;
    }

    this.currentRingCount++;
    
    // Schedule next ring if not continuous
    if (config.pattern !== 'continuous' && this.currentRingCount < maxRings) {
      this.ringInterval = setTimeout(() => {
        this.playPattern(config, maxRings);
      }, settings.ringInterval * 1000);
    }
  }

  private playSingleTone(config: AudioNotificationConfig): void {
    this.createTone(config.frequency, config.duration, config.volume);
  }

  private playDoubleTone(config: AudioNotificationConfig): void {
    this.createTone(config.frequency, config.duration * 0.4, config.volume);
    setTimeout(() => {
      this.createTone(config.frequency, config.duration * 0.4, config.volume);
    }, config.duration * 600);
  }

  private playTripleTone(config: AudioNotificationConfig): void {
    this.createTone(config.frequency, config.duration * 0.3, config.volume);
    setTimeout(() => {
      this.createTone(config.frequency, config.duration * 0.3, config.volume);
    }, config.duration * 400);
    setTimeout(() => {
      this.createTone(config.frequency, config.duration * 0.3, config.volume);
    }, config.duration * 800);
  }

  private playContinuousTone(config: AudioNotificationConfig): void {
    // Play a tone and immediately schedule the next one for TRUE continuous ringing
    this.createTone(config.frequency, config.duration, config.volume);

    // Schedule next tone immediately after this one ends
    this.ringInterval = setTimeout(() => {
      if (this.isPlaying) {
        this.playContinuousTone(config); // Recursive call for continuous ringing
      }
    }, config.duration * 1000 + 100); // Small gap between tones
  }

  private createTone(frequency: number, duration: number, volume: number): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      // Trigger vibration if supported and enabled
      this.triggerVibration();
      
    } catch (error) {
      console.error('Failed to create audio tone:', error);
    }
  }

  private triggerVibration(): void {
    const settings = notificationService.getSettings();
    
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (error) {
        console.warn('Vibration not supported:', error);
      }
    }
  }

  public stopNotificationSound(): void {
    console.log('🔇 Stopping notification sound');
    
    this.isPlaying = false;
    this.currentRingCount = 0;
    
    if (this.ringInterval) {
      clearTimeout(this.ringInterval);
      this.ringInterval = null;
    }

    if (this.stopCallback) {
      this.stopCallback();
      this.stopCallback = null;
    }

    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public getRingCount(): number {
    return this.currentRingCount;
  }

  public setStopCallback(callback: () => void): void {
    this.stopCallback = callback;
  }

  // Test methods
  public testNotificationSound(type: NotificationType): void {
    console.log(`🧪 Testing ${type} notification sound`);
    this.playNotificationSound(type);
  }

  public testAllSounds(): void {
    const types: NotificationType[] = [
      'order_created',
      'order_paid',
      'order_updated',
      'order_cancelled',
      'payment_failed',
      'payment_completed'
    ];

    let index = 0;
    const playNext = () => {
      if (index < types.length) {
        console.log(`🧪 Testing ${types[index]} sound`);
        this.playNotificationSound(types[index]);
        index++;
        setTimeout(playNext, 3000); // Wait 3 seconds between tests
      }
    };

    playNext();
  }

  // Custom sound support
  public async playCustomSound(url: string): Promise<void> {
    try {
      const audio = new Audio(url);
      audio.volume = 0.7;
      await audio.play();
      console.log('🎵 Custom sound played');
    } catch (error) {
      console.error('Failed to play custom sound:', error);
      // Fallback to default tone
      this.playNotificationSound('order_created');
    }
  }

  public destroy(): void {
    this.stopNotificationSound();
    window.removeEventListener('newNotification', this.handleNewNotification.bind(this));
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const audioNotificationService = new AudioNotificationService();
export default audioNotificationService;
