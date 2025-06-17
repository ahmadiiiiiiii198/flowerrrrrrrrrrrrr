import { supabase } from '@/integrations/supabase/client';

// We define the types here to ensure consistency
export interface Specialty {
  id: string;
  title: string;
  description: string;
  image?: string;
  price: string;
}

export interface SpecialtiesContent {
  heading: string;
  subheading: string;
  specialties: Specialty[];
  backgroundImage?: string;
}

const defaultContent: SpecialtiesContent = {
  heading: "Le Nostre Specialità",
  subheading: "Scopri le nostre creazioni floreali uniche realizzate con passione e maestria",
  specialties: [
    {
      id: "1",
      title: "Bouquet da Sposa",
      description: "Eleganti bouquet per il giorno più importante, realizzati con fiori freschi e di alta qualità.",
      image: "/lovable-uploads/73eb78dc-53a2-4ec9-b660-6ffec6bff8bb.png",
      price: "€85.00",
    },
    {
      id: "2",
      title: "Composizioni Funebri",
      description: "Sobrie ed eleganti composizioni per rendere omaggio ai propri cari con rispetto e delicatezza.",
      image: "/lovable-uploads/05335902-cb3d-4760-aab2-46a1292ac614.png",
      price: "€65.00",
    },
    {
      id: "3",
      title: "Shurpa (Lamb Soup)",
      description: "Hearty lamb soup with vegetables and herbs, slow-cooked to extract rich flavors. Perfect for starting your Central Asian feast.",
      image: "/lovable-uploads/bbf20df5-b0f5-4add-bf53-5675c1993c9b.png",
      price: "€12.90",
    },
  ]
};

// Singleton implementation for specialties service
class SpecialtiesService {
  private subscribers: ((content: SpecialtiesContent) => void)[] = [];
  private cachedContent: SpecialtiesContent | null = null;
  private lastFetchTime: number = 0;
  private isFetching: boolean = false;
  
  // Subscribe to changes
  subscribe(callback: (content: SpecialtiesContent) => void): () => void {
    this.subscribers.push(callback);
    
    // If we have cached content, notify immediately
    if (this.cachedContent) {
      callback(this.cachedContent);
    } else {
      // Otherwise fetch
      this.fetchContent();
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  // Notify all subscribers
  private notifySubscribers(content: SpecialtiesContent) {
    console.log('[SpecialtiesService] Notifying', this.subscribers.length, 'subscribers with new content');
    this.subscribers.forEach(callback => {
      try {
        callback(content);
      } catch (error) {
        console.error('[SpecialtiesService] Error in subscriber callback:', error);
      }
    });
  }
  
  // Fetch the most recent content
  async fetchContent(force: boolean = false): Promise<SpecialtiesContent> {
    // ALWAYS force a fresh fetch - no caching between admin panel and homepage
    force = true;
    
    // Prevent multiple simultaneous fetches
    if (this.isFetching) {
      console.log('[SpecialtiesService] Already fetching, waiting...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isFetching && this.cachedContent) {
            clearInterval(checkInterval);
            resolve(this.cachedContent);
          }
        }, 100);
      });
    }
    
    // Log fetch attempt
    console.log('[SpecialtiesService] Force fetching fresh content from database...');
    
    this.isFetching = true;
    console.log('[SpecialtiesService] Fetching specialties content from Supabase...');
    
    try {
      // Get the most recent entry
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('[SpecialtiesService] Error fetching content:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('[SpecialtiesService] Found data:', data[0]);
        
        // Parse the value field which contains our content - use proper type casting
        const value = data[0].value as Record<string, any>;
        
        // Ensure it has the correct structure
        if (value && typeof value === 'object' && value.heading && value.subheading && Array.isArray(value.specialties)) {
          const content = value as unknown as SpecialtiesContent;
          this.cachedContent = content;
          this.lastFetchTime = Date.now();
          
          // Notify subscribers
          this.notifySubscribers(content);
          
          console.log('[SpecialtiesService] Successfully fetched and cached content with', 
            content.specialties.length, 'specialties');
          
          return content;
        } else {
          console.error('[SpecialtiesService] Invalid content structure:', value);
          throw new Error('Invalid content structure');
        }
      } else {
        console.log('[SpecialtiesService] No content found, using default');
        this.cachedContent = defaultContent;
        this.lastFetchTime = Date.now();
        
        // Notify subscribers with default content
        this.notifySubscribers(defaultContent);
        
        return defaultContent;
      }
    } catch (error) {
      console.error('[SpecialtiesService] Error in fetchContent:', error);
      
      // If we have cached content, return it as fallback
      if (this.cachedContent) {
        return this.cachedContent;
      }
      
      return defaultContent;
    } finally {
      this.isFetching = false;
    }
  }
  
  // Save new content
  async saveContent(content: SpecialtiesContent): Promise<boolean> {
    console.log('[SpecialtiesService] Saving specialties content:', content);
    
    try {
      // Convert to JSON-compatible format before sending to Supabase
      const jsonContent = JSON.parse(JSON.stringify(content));
      
      // Clear local storage versions to avoid stale data
      try {
        localStorage.removeItem('specialtiesContent');
        console.log('[SpecialtiesService] Cleared local storage cache');
      } catch (e) {
        console.warn('[SpecialtiesService] Failed to clear localStorage');
      }
      
      // Always insert a new row with the updated content (addressing the multiple rows issue)
      const { data, error } = await supabase
        .from('settings')
        .insert({
          key: 'specialtiesContent',
          value: jsonContent,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('[SpecialtiesService] Error saving content:', error);
        return false;
      }
      
      console.log('[SpecialtiesService] Content saved successfully:', data);
      
      // Wait a moment for Supabase to process the insert
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a fresh fetch from database instead of using cache
      await this.fetchContent(true);
      
      return true;
    } catch (error) {
      console.error('[SpecialtiesService] Error in saveContent:', error);
      return false;
    }
  }
  
  // Get the current content synchronously (from cache or default)
  getContent(): SpecialtiesContent {
    if (this.cachedContent) {
      return this.cachedContent;
    }
    
    // If no cache, trigger a fetch and return default for now
    this.fetchContent();
    return defaultContent;
  }
  
  // Force refresh from server
  async refreshContent(): Promise<SpecialtiesContent> {
    console.log('[SpecialtiesService] Forcing content refresh...');
    // Clear any cached data first
    this.cachedContent = null;
    this.lastFetchTime = 0;
    
    // Clear local storage cache if it exists
    try {
      localStorage.removeItem('specialtiesContent');
      console.log('[SpecialtiesService] Cleared local storage cache');
    } catch (e) {
      console.warn('[SpecialtiesService] Failed to clear localStorage');
    }
    
    return this.fetchContent(true);
  }
}

// Export a singleton instance
export const specialtiesService = new SpecialtiesService();

// Export default content for components that need it
export { defaultContent };
