
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Use the correct project configuration matching the main client
const SUPABASE_URL = 'https://despodpgvkszyexvcbft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3BvZHBndmtzenlleHZjYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTcyMTAsImV4cCI6MjA2MzkzMzIxMH0.zyjFQA-Kr317M5l_6qjV_a-6ED2iU4wraRuYaa0iGEg';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    fetch: fetch
  }
});

// Export a function to check connection status with proper error handling
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('settings').select('key').limit(1);
    return !error;
  } catch (err) {
    console.error("Supabase connection error:", err);
    return false;
  }
};

// Enhanced connection check with timeout and more diagnostic info
export const checkSupabaseConnection = async (maxRetries = 2): Promise<boolean> => {
  let retryCount = 0;
  
  const attemptConnection = async (): Promise<boolean> => {
    try {
      console.log(`Checking Supabase connection... (attempt ${retryCount + 1}/${maxRetries + 1})`);
      const start = Date.now();
      
      // Set a timeout of 5 seconds for the connection check
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection check timed out after 5 seconds')), 5000);
      });
      
      // Try a simple query first
      const checkPromise = supabase
        .from('settings')
        .select('key')
        .limit(1)
        .single();
      
      const { error } = await Promise.race([checkPromise, timeoutPromise]);
      
      const elapsed = Date.now() - start;
      
      if (error) {
        console.error(`Supabase connection check failed (${elapsed}ms):`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          return attemptConnection();
        }
        
        return false;
      }
      
      console.log(`Supabase connection successful (${elapsed}ms)`);
      return true;
    } catch (error) {
      console.error('Supabase connection check error:', error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        return attemptConnection();
      }
      
      return false;
    }
  };
  
  return attemptConnection();
};

// Get a setting from the database with proper typing
export const getSetting = async <T = any>(key: string): Promise<T | null> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      console.warn(`Error getting setting ${key}:`, error);
      // Try to get from localStorage as fallback
      const localData = localStorage.getItem(key);
      if (localData) {
        try {
          return JSON.parse(localData) as T;
        } catch (e) {
          console.warn(`Error parsing ${key} from localStorage:`, e);
        }
      }
      return null;
    }
    
    // Also cache in localStorage for offline access
    try {
      localStorage.setItem(key, JSON.stringify(data?.value));
    } catch (e) {
      console.warn(`Error caching ${key} to localStorage:`, e);
    }
    
    return (data?.value as T) || null;
  } catch (err) {
    console.error(`Error getting setting ${key}:`, err);
    return null;
  }
};

// Upsert (insert or update) a setting in the database
export const upsertSetting = async (key: string, value: any) => {
  // Always save to localStorage first for immediate access
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
  
  // Then try to save to Supabase
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value })
      .select();
    
    if (error) {
      console.warn(`Error upserting setting ${key} to Supabase:`, error);
      return true; // Still return true since we saved to localStorage
    }
    
    return true;
  } catch (err) {
    console.error(`Error upserting setting ${key}:`, err);
    return false;
  }
};

// Get all settings at once
export const getAllSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');
    
    if (error) throw error;
    
    // Convert to a more usable format
    const settings: Record<string, any> = {};
    data?.forEach(item => {
      settings[item.key] = item.value;
      // Also cache in localStorage
      try {
        localStorage.setItem(item.key, JSON.stringify(item.value));
      } catch (e) {
        console.warn(`Error caching ${item.key} to localStorage:`, e);
      }
    });
    
    return settings;
  } catch (err) {
    console.error('Error getting all settings:', err);
    return null;
  }
};
