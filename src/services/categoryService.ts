import { supabase } from '@/integrations/supabase/client';
import { Category, CategoryContent } from '@/types/category';

// Default categories with fallback data
const defaultCategories: Category[] = [
  {
    id: "1",
    name: "Fiori & Piante",
    slug: "fiori-piante",
    description: "Fiori freschi e piante di qualità premium",
    image_url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1518335935020-cfd6580c1ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Da Francesco Fiori & Piante, troverai un'ampia scelta di fiori freschi di stagione e piante ornamentali per ogni ambiente.",
    features: [
      "Fiori freschi tagliati quotidianamente",
      "Piante da interno e esterno",
      "Composizioni personalizzate",
      "Garanzia di freschezza",
      "Cura e manutenzione inclusa"
    ],
    color: "from-peach-400 to-coral-500",
    is_active: true,
    sort_order: 1
  },
  {
    id: "2",
    name: "Fiori Finti",
    slug: "fiori-finti",
    description: "Eleganti composizioni artificiali",
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1502780402662-acc01917738e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Per chi desidera la bellezza dei fiori senza pensieri, proponiamo una collezione curata di fiori artificiali di alta qualità.",
    features: [
      "Materiali di alta qualità",
      "Aspetto realistico",
      "Nessuna manutenzione richiesta",
      "Durata illimitata",
      "Resistenti agli allergeni",
      "Perfetti per ogni ambiente"
    ],
    color: "from-amber-400 to-peach-500",
    is_active: true,
    sort_order: 2
  },
  {
    id: "3",
    name: "Matrimoni",
    slug: "matrimoni",
    description: "Allestimenti floreali per il giorno speciale",
    image_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1521543298264-785fba19d562?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Rendiamo unico il giorno più importante della tua vita con allestimenti floreali personalizzati per matrimoni.",
    features: [
      "Consulenza personalizzata",
      "Bouquet sposa e damigelle",
      "Allestimenti chiesa e location",
      "Centrotavola e decorazioni",
      "Addobbi floreali completi",
      "Servizio completo per matrimoni"
    ],
    color: "from-rose-400 to-pink-500",
    is_active: true,
    sort_order: 3
  },
  {
    id: "4",
    name: "Funerali",
    slug: "funerali",
    description: "Composizioni di cordoglio e commemorazione",
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1595207759571-3a4df3c49230?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1583160247711-2191776b4b91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ],
    explanation: "Nel momento del dolore, offriamo composizioni floreali sobrie ed eleganti per onorare la memoria dei tuoi cari.",
    features: [
      "Composizioni tradizionali e moderne",
      "Corone e cuscini floreali",
      "Mazzi di cordoglio",
      "Consegna tempestiva",
      "Servizio discreto e rispettoso",
      "Personalizzazione su richiesta"
    ],
    color: "from-sage-400 to-emerald-500",
    is_active: true,
    sort_order: 4
  }
];

const defaultContent: CategoryContent = {
  categories: defaultCategories,
  heading: "Esplora per Categoria",
  subheading: "Le nostre collezioni accuratamente curate"
};

class CategoryService {
  private cachedContent: CategoryContent | null = null;
  private isFetching = false;

  // Fetch categories from database
  async fetchCategories(): Promise<Category[]> {
    try {
      console.log('[CategoryService] Fetching categories from Supabase...');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[CategoryService] Error fetching categories:', error);
        console.error('[CategoryService] Error details:', error.message, error.details);
        return defaultCategories;
      }

      if (!data || data.length === 0) {
        console.log('[CategoryService] No categories found in database, using defaults');
        console.log('[CategoryService] This might mean the categories table is empty or the query failed');
        return defaultCategories;
      }

      console.log('[CategoryService] Successfully fetched categories from database:', data);
      const mappedCategories = data.map(cat => ({
        ...cat,
        images: cat.image_url ? [cat.image_url] : [],
        features: []
      }));
      console.log('[CategoryService] Mapped categories:', mappedCategories);
      return mappedCategories;
    } catch (error) {
      console.error('[CategoryService] Error in fetchCategories:', error);
      return defaultCategories;
    }
  }

  // Fetch category content (including heading/subheading)
  async fetchContent(): Promise<CategoryContent> {
    if (this.isFetching) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isFetching && this.cachedContent) {
            clearInterval(checkInterval);
            resolve(this.cachedContent);
          }
        }, 100);
      });
    }

    this.isFetching = true;
    
    try {
      // Fetch categories
      const categories = await this.fetchCategories();
      
      // Fetch content settings from site_content table
      const { data: contentData, error: contentError } = await supabase
        .from('site_content')
        .select('title, subtitle')
        .eq('section', 'categories')
        .single();

      let heading = defaultContent.heading;
      let subheading = defaultContent.subheading;

      if (!contentError && contentData) {
        heading = contentData.title || heading;
        subheading = contentData.subtitle || subheading;
      }

      this.cachedContent = {
        categories,
        heading,
        subheading
      };

      return this.cachedContent;
    } catch (error) {
      console.error('[CategoryService] Error fetching content:', error);
      return defaultContent;
    } finally {
      this.isFetching = false;
    }
  }

  // Save category
  async saveCategory(category: Partial<Category>): Promise<boolean> {
    try {
      console.log('[CategoryService] Saving category:', category);

      if (category.id && category.id !== 'new') {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: category.name,
            slug: category.slug,
            description: category.description,
            image_url: category.image_url,
            is_active: category.is_active,
            sort_order: category.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', category.id);

        if (error) throw error;
      } else {
        // Insert new category
        const { error } = await supabase
          .from('categories')
          .insert({
            name: category.name!,
            slug: category.slug!,
            description: category.description,
            image_url: category.image_url,
            is_active: category.is_active ?? true,
            sort_order: category.sort_order ?? 0
          });

        if (error) throw error;
      }

      // Clear cache to force refresh
      this.cachedContent = null;
      
      console.log('[CategoryService] Category saved successfully');
      return true;
    } catch (error) {
      console.error('[CategoryService] Error saving category:', error);
      return false;
    }
  }

  // Delete category
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.cachedContent = null;
      
      return true;
    } catch (error) {
      console.error('[CategoryService] Error deleting category:', error);
      return false;
    }
  }

  // Save content settings (heading/subheading)
  async saveContentSettings(heading: string, subheading: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({
          section: 'categories',
          title: heading,
          subtitle: subheading,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update cache
      if (this.cachedContent) {
        this.cachedContent.heading = heading;
        this.cachedContent.subheading = subheading;
      }

      return true;
    } catch (error) {
      console.error('[CategoryService] Error saving content settings:', error);
      return false;
    }
  }
}

export const categoryService = new CategoryService();
