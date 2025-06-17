import { supabase } from '@/integrations/supabase/client';

/**
 * A direct settings manager for consistent database operations
 * This bypasses intermediate services and handles settings directly
 */
export class SettingsManager {
  /**
   * Get a setting value by key, always returning the most recent version
   * with cache prevention measures
   */
  static async getSetting<T>(key: string): Promise<T | null> {
    try {
      // Include a cache-busting timestamp in the log
      const timestamp = new Date().getTime();
      console.log(`[SettingsManager] Getting setting: ${key} at ${timestamp}`);
      
      // Always get the most recent entry for this key, with cache prevention
      const { data, error, status } = await supabase
        .from('settings')
        .select('value, updated_at, id')
        .eq('key', key)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      console.log(`[SettingsManager] Supabase response status: ${status}`);
        
      if (error) {
        console.error(`[SettingsManager] Error fetching ${key}:`, error);
        throw error;
      }
      
      // No data found
      if (!data || data.length === 0) {
        console.log(`[SettingsManager] No data found for ${key}`);
        return null;
      }
      
      // Log details about found records
      console.log(`[SettingsManager] Found data for ${key}:`, {
        id: data[0].id,
        updated: data[0].updated_at,
        valuePreview: JSON.stringify(data[0].value).substring(0, 100) + '...'
      });
      
      // Return the value from the most recent row
      return data[0].value as T;
    } catch (err) {
      console.error(`[SettingsManager] Error in getSetting(${key}):`, err);
      throw err;
    }
  }
  
  /**
   * Save a setting value by key
   */
  static async saveSetting<T>(key: string, value: T): Promise<void> {
    try {
      console.log(`[SettingsManager] Saving setting: ${key}`);
      
      // Ensure the value is serializable
      const jsonValue = JSON.parse(JSON.stringify(value));
      
      // Insert a new row for this setting
      const { error } = await supabase
        .from('settings')
        .insert({
          key,
          value: jsonValue,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error(`[SettingsManager] Error saving ${key}:`, error);
        throw error;
      }
      
      console.log(`[SettingsManager] Successfully saved ${key}`);
    } catch (err) {
      console.error(`[SettingsManager] Error in saveSetting(${key}):`, err);
      throw err;
    }
  }
  
  /**
   * Get all rows for a specific key
   */
  static async getAllVersions(key: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error(`[SettingsManager] Error fetching all versions of ${key}:`, error);
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error(`[SettingsManager] Error in getAllVersions(${key}):`, err);
      throw err;
    }
  }
  
  /**
   * Delete old versions of a setting, keeping only the most recent ones
   */
  static async cleanupOldVersions(key: string, keepCount: number = 3): Promise<void> {
    try {
      console.log(`[SettingsManager] Cleaning up old versions of ${key}, keeping ${keepCount} most recent`);
      
      // Get all versions ordered by updated_at
      const versions = await this.getAllVersions(key);
      
      // If we have more versions than we want to keep
      if (versions.length > keepCount) {
        // Get the IDs of versions to delete (all but the keepCount most recent)
        const idsToDelete = versions
          .slice(keepCount)
          .map(version => version.id);
          
        if (idsToDelete.length > 0) {
          // Delete the old versions
          const { error } = await supabase
            .from('settings')
            .delete()
            .in('id', idsToDelete);
            
          if (error) {
            console.error(`[SettingsManager] Error deleting old versions of ${key}:`, error);
            throw error;
          }
          
          console.log(`[SettingsManager] Deleted ${idsToDelete.length} old versions of ${key}`);
        }
      }
    } catch (err) {
      console.error(`[SettingsManager] Error in cleanupOldVersions(${key}):`, err);
      throw err;
    }
  }
}
