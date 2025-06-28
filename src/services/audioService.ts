let audio: HTMLAudioElement | null = null;
let initialized = false;
let settings = {
  enabled: true,
  songUrl: "/background-music.mp3",
  songTitle: "Default Music",
  autoplay: true,
  volume: 1.0, // MAXIMUM VOLUME
  customSong: false,
};

const initializeAudio = () => {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.volume = settings.volume;
    audio.src = settings.songUrl;
    audio.preload = "auto";
  }
};

/**
 * Audio service for managing background music
 */
const audioService = {
  /**
   * Initialize the audio service
   */
  initialize: async () => {
    if (initialized) return settings;
    
    try {
      // Try to get settings from Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'musicSettings')
        .single();
      
      if (!error && data && data.value) {
        // Type assertion for safety when accessing properties
        const loadedSettings = data.value as Record<string, unknown>;
        // Use type-safe spreading with properly typed settings
        settings = { 
          enabled: typeof loadedSettings.enabled === 'boolean' ? loadedSettings.enabled : settings.enabled,
          songUrl: typeof loadedSettings.songUrl === 'string' ? loadedSettings.songUrl : settings.songUrl,
          songTitle: typeof loadedSettings.songTitle === 'string' ? loadedSettings.songTitle : settings.songTitle,
          autoplay: typeof loadedSettings.autoplay === 'boolean' ? loadedSettings.autoplay : settings.autoplay,
          volume: typeof loadedSettings.volume === 'number' ? loadedSettings.volume : settings.volume,
          customSong: typeof loadedSettings.customSong === 'boolean' ? loadedSettings.customSong : settings.customSong
        };
        console.log("Loaded music settings from Supabase:", settings);
      } else {
        // Fall back to localStorage
        const savedSettings = localStorage.getItem('musicSettings');
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings) as Record<string, unknown>;
            // Use type-safe spreading with properly typed settings
            settings = { 
              enabled: typeof parsedSettings.enabled === 'boolean' ? parsedSettings.enabled : settings.enabled,
              songUrl: typeof parsedSettings.songUrl === 'string' ? parsedSettings.songUrl : settings.songUrl,
              songTitle: typeof parsedSettings.songTitle === 'string' ? parsedSettings.songTitle : settings.songTitle,
              autoplay: typeof parsedSettings.autoplay === 'boolean' ? parsedSettings.autoplay : settings.autoplay,
              volume: typeof parsedSettings.volume === 'number' ? parsedSettings.volume : settings.volume,
              customSong: typeof parsedSettings.customSong === 'boolean' ? parsedSettings.customSong : settings.customSong
            };
          } catch (e) {
            console.error("Error parsing saved music settings:", e);
          }
        }
      }
    } catch (e) {
      // Fall back to localStorage
      console.warn("Error loading settings from Supabase, using localStorage:", e);
      const savedSettings = localStorage.getItem('musicSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings) as Record<string, unknown>;
          // Use type-safe spreading with properly typed settings
          settings = { 
            enabled: typeof parsedSettings.enabled === 'boolean' ? parsedSettings.enabled : settings.enabled,
            songUrl: typeof parsedSettings.songUrl === 'string' ? parsedSettings.songUrl : settings.songUrl,
            songTitle: typeof parsedSettings.songTitle === 'string' ? parsedSettings.songTitle : settings.songTitle,
            autoplay: typeof parsedSettings.autoplay === 'boolean' ? parsedSettings.autoplay : settings.autoplay,
            volume: typeof parsedSettings.volume === 'number' ? parsedSettings.volume : settings.volume,
            customSong: typeof parsedSettings.customSong === 'boolean' ? parsedSettings.customSong : settings.customSong
          };
        } catch (e) {
          console.error("Error parsing saved music settings:", e);
        }
      }
    }
    
    initializeAudio();
    initialized = true;
    return settings;
  },
  
  /**
   * Get the current settings
   */
  getSettings: async () => {
    // If not initialized, initialize first
    if (!initialized) {
      await audioService.initialize();
    }
    return settings;
  },
  
  /**
   * Update settings
   */
  updateSettings: async (newSettings: Record<string, unknown>) => {
    // Type-safe update of settings
    const updatedSettings = {
      enabled: typeof newSettings.enabled === 'boolean' ? newSettings.enabled : settings.enabled,
      songUrl: typeof newSettings.songUrl === 'string' ? newSettings.songUrl : settings.songUrl,
      songTitle: typeof newSettings.songTitle === 'string' ? newSettings.songTitle : settings.songTitle,
      autoplay: typeof newSettings.autoplay === 'boolean' ? newSettings.autoplay : settings.autoplay,
      volume: typeof newSettings.volume === 'number' ? newSettings.volume : settings.volume,
      customSong: typeof newSettings.customSong === 'boolean' ? newSettings.customSong : settings.customSong
    };
    
    settings = updatedSettings;
    
    // Initialize audio if not already
    if (!audio) {
      initializeAudio();
    }
    
    // Apply new settings
    if (audio) {
      audio.volume = settings.volume;
      audio.src = settings.songUrl;
      audio.load();
    }
    
    try {
      // Save to Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'musicSettings', value: settings })
        .select();
      
      if (error) throw error;
      
      console.log("Saved music settings to Supabase:", settings);
    } catch (e) {
      console.warn("Error saving to Supabase, falling back to localStorage:", e);
      // Fall back to localStorage
      localStorage.setItem('musicSettings', JSON.stringify(settings));
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new Event('localStorageUpdated'));
    
    return settings;
  },
  
  /**
   * Play the audio
   */
  play: async () => {
    if (!audio) {
      await audioService.initialize();
    }
    
    if (audio) {
      return audio.play();
    }
    
    return Promise.reject(new Error("Audio not initialized"));
  },
  
  /**
   * Pause the audio
   */
  pause: () => {
    if (audio) {
      audio.pause();
    }
  },
  
  /**
   * Set the volume
   */
  setVolume: (volume: number) => {
    if (audio) {
      audio.volume = volume;
      settings.volume = volume;
    }
  },
  
  /**
   * Set muted state
   */
  setMuted: (muted: boolean) => {
    if (audio) {
      audio.muted = muted;
    }
  },
  
  /**
   * Check if audio is playing
   */
  isPlaying: () => {
    return audio ? !audio.paused : false;
  }
};

export default audioService;
