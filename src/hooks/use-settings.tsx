import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '@/services/settingsService';
import { supabase } from '@/integrations/supabase/client';

// Generic hook to use any setting with type safety
export function useSetting<T>(key: string, defaultValue: T): [T, (value: T) => Promise<boolean>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refresh data when coming back online
      loadSetting();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Set up a Supabase realtime subscription for this setting
  useEffect(() => {
    // Subscribe to settings table changes for this key
    const channel = supabase
      .channel(`public:settings:${key}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'settings',
          filter: `key=eq.${key}`
        },
        (payload) => {
          console.log(`Settings: Received realtime update for ${key}:`, payload);
          if (payload.new && (payload.new as any)?.value !== undefined) {
            try {
              const newValue = (payload.new as any).value;
              setValue(newValue as T);
              console.log(`Settings: Updated ${key} via Supabase realtime`);
              
              // Update localStorage to keep in sync
              localStorage.setItem(key, JSON.stringify(newValue));
            } catch (e) {
              console.warn(`Settings: Error processing realtime update for ${key}:`, e);
            }
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [key]);

  // Load setting function that can be called to refresh data
  const loadSetting = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`[useSetting] Loading setting: ${key}`);

      // Add timeout to prevent hanging
      const settingPromise = settingsService.getSetting<T>(key, defaultValue);
      const timeoutPromise = new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout loading setting ${key}`)), 10000);
      });

      const setting = await Promise.race([settingPromise, timeoutPromise]);
      console.log(`[useSetting] Loaded setting ${key}:`, setting);
      setValue(setting);
    } catch (error) {
      console.error(`[useSetting] Error loading setting ${key}:`, error);
      // Use default value on error - no localStorage fallback
      console.log(`[useSetting] Using default value for ${key}:`, defaultValue);
      setValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  useEffect(() => {
    const initializeAndLoad = async () => {
      try {
        console.log(`[useSetting] Initializing settings service for ${key}`);
        // Initialize the settings service if needed
        await settingsService.initialize();

        // Load initial value
        await loadSetting();

        // Subscribe to changes
        const unsubscribe = settingsService.subscribe(key, (newValue) => {
          console.log(`[useSetting] Received subscription update for ${key}:`, newValue);
          setValue(newValue as T);
        });

        // Also listen for storage events
        const handleStorageEvent = (e: StorageEvent | CustomEvent) => {
          const storageEvent = e as StorageEvent;
          const customEvent = e as CustomEvent<{key: string}>;

          if (
            (storageEvent?.key === key) ||
            (customEvent?.detail?.key === key)
          ) {
            console.log(`[useSetting] Storage event detected for ${key}, reloading...`);
            loadSetting();
          }
        };

        window.addEventListener('storage', handleStorageEvent as EventListener);
        window.addEventListener('localStorageUpdated', handleStorageEvent as EventListener);

        return () => {
          unsubscribe();
          window.removeEventListener('storage', handleStorageEvent as EventListener);
          window.removeEventListener('localStorageUpdated', handleStorageEvent as EventListener);
        };
      } catch (error) {
        console.error(`[useSetting] Error initializing settings for ${key}:`, error);
        // Set default value and stop loading
        setValue(defaultValue);
        setIsLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    const cleanup = initializeAndLoad();

    return () => {
      cleanup.then(cleanupFn => {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      }).catch(error => {
        console.warn(`[useSetting] Error during cleanup for ${key}:`, error);
      });
    };
  }, [key, loadSetting, defaultValue]);

  // Function to update the setting - database only
  const updateValue = async (newValue: T): Promise<boolean> => {
    const success = await settingsService.updateSetting(key, newValue);

    // Update local state immediately for UI responsiveness
    if (success) {
      setValue(newValue);
    }

    return success;
  };

  return [value, updateValue, isLoading];
}

// Type-specific hooks for common settings
export function useLogoSettings() {
  const defaultSettings = {
    logoUrl: "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png",
    altText: "Francesco Fiori & Piante Logo",
  };

  return useSetting('logoSettings', defaultSettings);
}

export function useHeroContent() {
  const defaultContent = {
    heading: "Francesco Fiori & Piante",
    subheading: "Creazioni floreali uniche per ogni occasione speciale",
    backgroundImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
  };

  return useSetting('heroContent', defaultContent);
}

export function useAboutContent() {
  const defaultContent = {
    heading: "La Nostra Storia",
    subheading: "Passione per la bellezza naturale e l'arte floreale",
    backgroundImage: "",
    backgroundColor: "#FEF7CD",
    paragraphs: [
      "Francesco Fiori & Piante nasce dalla passione per la bellezza naturale e dall'esperienza artigianale tramandata nel tempo.",
      "Dai momenti più delicati come i funerali, ai giorni più belli come i matrimoni, offriamo composizioni floreali create con amore e cura.",
      "Le nostre creazioni nascono da una profonda passione per la bellezza naturale. Solo fiori selezionati, solo eleganza made in Torino."
    ]
  };

  return useSetting('aboutContent', defaultContent);
}

export function useRestaurantSettings() {
  const defaultSettings = {
    totalSeats: 50,
    reservationDuration: 120,
    openingTime: "11:30",
    closingTime: "22:00",
    languages: ["it", "en", "ar", "fa"],
    defaultLanguage: "it"
  };
  
  return useSetting('restaurantSettings', defaultSettings);
}
