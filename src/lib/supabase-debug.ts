import { supabase } from '@/integrations/supabase/client';

// Wrapper for Supabase operations with detailed logging
export const debugSupabase = {
  // Debug-enhanced query operations
  async saveSpecialties(content: any) {
    console.log('[SUPABASE DEBUG] Saving specialties:', content);
    
    try {
      // First test connection
      const connectionTest = await supabase.from('settings').select('count');
      console.log('[SUPABASE DEBUG] Connection test result:', connectionTest);
      
      if (connectionTest.error) {
        console.error('[SUPABASE DEBUG] Connection failed:', connectionTest.error);
        return { error: connectionTest.error, success: false };
      }
      
      // Convert content to pure JSON
      const jsonContent = JSON.parse(JSON.stringify(content));
      
      // IMPORTANT: First, check if there are existing rows with this key
      const existingRows = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'specialtiesContent');
        
      console.log('[SUPABASE DEBUG] Existing rows check:', existingRows);
      
      if (existingRows.data && existingRows.data.length > 0) {
        console.log(`[SUPABASE DEBUG] Found ${existingRows.data.length} existing rows with key 'specialtiesContent'`);
        
        // Insert a new row with the updated content
        const insertResult = await supabase
          .from('settings')
          .insert({
            key: 'specialtiesContent',
            value: jsonContent,
            updated_at: new Date().toISOString()
          })
          .select();
          
        console.log('[SUPABASE DEBUG] Insert new row result:', insertResult);
        
        if (insertResult.error) {
          return { error: insertResult.error, success: false };
        }
        
        return { data: insertResult.data?.[0], success: true };
      } else {
        // If no rows exist yet, use upsert
        const result = await supabase
          .from('settings')
          .upsert({
            key: 'specialtiesContent',
            value: jsonContent,
            updated_at: new Date().toISOString()
          })
          .select();
        
        console.log('[SUPABASE DEBUG] Upsert operation result:', result);
        
        if (result.error) {
          return { error: result.error, success: false };
        }
        
        return { data: result.data?.[0], success: true };
      }
    } catch (error) {
      console.error('[SUPABASE DEBUG] Unexpected error during save:', error);
      return { error, success: false };
    }
  },
  
  // Load specialties with debugging
  async loadSpecialties() {
    console.log('[SUPABASE DEBUG] Loading specialties');
    
    try {
      // Changed from single() to get all rows with this key and take the most recent
      const result = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      console.log('[SUPABASE DEBUG] Load result:', result);
      
      if (result.error) {
        return { error: result.error, data: null };
      }
      
      // Return the first (most recent) row or null if no rows
      const mostRecentRow = result.data && result.data.length > 0 ? result.data[0] : null;
      console.log('[SUPABASE DEBUG] Using most recent row:', mostRecentRow);
      
      return { data: mostRecentRow, error: null };
    } catch (error) {
      console.error('[SUPABASE DEBUG] Error loading specialties:', error);
      return { error, data: null };
    }
  }
};
