import { supabase } from '@/integrations/supabase/client';

export interface CategorySection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  section_type: 'categories' | 'products';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategorySectionInput {
  name: string;
  slug: string;
  description?: string;
  section_type: 'categories' | 'products';
  is_active?: boolean;
  sort_order?: number;
}

class CategorySectionService {
  private cachedSections: CategorySection[] | null = null;
  private isFetching = false;

  // Fetch all category sections
  async fetchSections(): Promise<CategorySection[]> {
    if (this.isFetching) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isFetching && this.cachedSections) {
            clearInterval(checkInterval);
            resolve(this.cachedSections);
          }
        }, 100);
      });
    }

    this.isFetching = true;

    try {
      console.log('[CategorySectionService] Fetching sections from Supabase...');

      const { data, error } = await supabase
        .from('category_sections')
        .select('*')
        .order('section_type', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('[CategorySectionService] Error fetching sections:', error);
        throw error;
      }

      this.cachedSections = data || [];
      console.log(`[CategorySectionService] Fetched ${this.cachedSections.length} sections`);
      
      return this.cachedSections;
    } catch (error) {
      console.error('[CategorySectionService] Error in fetchSections:', error);
      return [];
    } finally {
      this.isFetching = false;
    }
  }

  // Fetch sections by type
  async fetchSectionsByType(type: 'categories' | 'products'): Promise<CategorySection[]> {
    try {
      const { data, error } = await supabase
        .from('category_sections')
        .select('*')
        .eq('section_type', type)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error(`[CategorySectionService] Error fetching ${type} sections:`, error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`[CategorySectionService] Error in fetchSectionsByType(${type}):`, error);
      return [];
    }
  }

  // Create a new section
  async createSection(sectionData: CategorySectionInput): Promise<CategorySection | null> {
    try {
      console.log('[CategorySectionService] Creating section:', sectionData);

      const { data, error } = await supabase
        .from('category_sections')
        .insert({
          ...sectionData,
          is_active: sectionData.is_active ?? true,
          sort_order: sectionData.sort_order ?? 0
        })
        .select()
        .single();

      if (error) {
        console.error('[CategorySectionService] Error creating section:', error);
        throw error;
      }

      // Clear cache
      this.clearCache();
      
      console.log('[CategorySectionService] Section created successfully:', data);
      return data;
    } catch (error) {
      console.error('[CategorySectionService] Error in createSection:', error);
      return null;
    }
  }

  // Update an existing section
  async updateSection(id: string, sectionData: Partial<CategorySectionInput>): Promise<CategorySection | null> {
    try {
      console.log('[CategorySectionService] Updating section:', id, sectionData);

      const { data, error } = await supabase
        .from('category_sections')
        .update(sectionData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CategorySectionService] Error updating section:', error);
        throw error;
      }

      // Clear cache
      this.clearCache();
      
      console.log('[CategorySectionService] Section updated successfully:', data);
      return data;
    } catch (error) {
      console.error('[CategorySectionService] Error in updateSection:', error);
      return null;
    }
  }

  // Delete a section
  async deleteSection(id: string): Promise<boolean> {
    try {
      console.log('[CategorySectionService] Deleting section:', id);

      const { error } = await supabase
        .from('category_sections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[CategorySectionService] Error deleting section:', error);
        throw error;
      }

      // Clear cache
      this.clearCache();
      
      console.log('[CategorySectionService] Section deleted successfully');
      return true;
    } catch (error) {
      console.error('[CategorySectionService] Error in deleteSection:', error);
      return false;
    }
  }

  // Toggle section active status
  async toggleActive(id: string): Promise<CategorySection | null> {
    try {
      // First get the current section
      const { data: currentSection, error: fetchError } = await supabase
        .from('category_sections')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('[CategorySectionService] Error fetching section for toggle:', fetchError);
        throw fetchError;
      }

      // Toggle the active status
      const { data, error } = await supabase
        .from('category_sections')
        .update({ is_active: !currentSection.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CategorySectionService] Error toggling section active status:', error);
        throw error;
      }

      // Clear cache
      this.clearCache();
      
      console.log('[CategorySectionService] Section active status toggled successfully:', data);
      return data;
    } catch (error) {
      console.error('[CategorySectionService] Error in toggleActive:', error);
      return null;
    }
  }

  // Generate slug from name
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Check if slug is unique
  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('category_sections')
        .select('id')
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[CategorySectionService] Error checking slug uniqueness:', error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('[CategorySectionService] Error in isSlugUnique:', error);
      return false;
    }
  }

  // Clear cache
  clearCache(): void {
    console.log('[CategorySectionService] Clearing cache');
    this.cachedSections = null;
  }

  // Get sections for frontend display
  async getActiveSections(): Promise<{
    categories: CategorySection[];
    products: CategorySection[];
  }> {
    try {
      const sections = await this.fetchSections();
      const activeSections = sections.filter(section => section.is_active);

      return {
        categories: activeSections.filter(section => section.section_type === 'categories'),
        products: activeSections.filter(section => section.section_type === 'products')
      };
    } catch (error) {
      console.error('[CategorySectionService] Error in getActiveSections:', error);
      return {
        categories: [],
        products: []
      };
    }
  }
}

// Export singleton instance
export const categorySectionService = new CategorySectionService();
