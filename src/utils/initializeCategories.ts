import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/category';

// Default categories to initialize the database
const defaultCategories: Omit<Category, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: "Naturale",
    slug: "naturale",
    description: "Fiori e piante naturali freschi di qualità premium",
    image_url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_active: true,
    sort_order: 1
  },
  {
    name: "Finti",
    slug: "finti",
    description: "Eleganti composizioni artificiali di alta qualità",
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_active: true,
    sort_order: 2
  }
];

export async function initializeCategories(): Promise<boolean> {
  try {
    console.log('[InitCategories] Checking if categories need to be initialized...');

    // Check if categories already exist
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (fetchError) {
      console.error('[InitCategories] Error checking existing categories:', fetchError);
      console.error('[InitCategories] Error details:', fetchError.message, fetchError.details);
      console.log('[InitCategories] This might mean the categories table does not exist');
      return false;
    }

    if (existingCategories && existingCategories.length > 0) {
      console.log('[InitCategories] Categories already exist, skipping initialization');
      console.log('[InitCategories] Found', existingCategories.length, 'existing categories');
      return true;
    }

    console.log('[InitCategories] No categories found, initializing default categories...');
    console.log('[InitCategories] Default categories to insert:', defaultCategories);

    // Insert default categories
    const { data: insertData, error: insertError } = await supabase
      .from('categories')
      .insert(defaultCategories)
      .select();

    if (insertError) {
      console.error('[InitCategories] Error inserting default categories:', insertError);
      console.error('[InitCategories] Error details:', insertError.message, insertError.details);
      return false;
    }

    console.log('[InitCategories] Default categories initialized successfully');
    console.log('[InitCategories] Inserted categories:', insertData);
    return true;
  } catch (error) {
    console.error('[InitCategories] Error in initializeCategories:', error);
    return false;
  }
}

export async function initializeCategoriesContent(): Promise<boolean> {
  try {
    console.log('[InitCategories] Checking if categories content needs to be initialized...');

    // Check if content already exists
    const { data: existingContent, error: fetchError } = await supabase
      .from('site_content')
      .select('id')
      .eq('section', 'categories')
      .single();

    if (!fetchError && existingContent) {
      console.log('[InitCategories] Categories content already exists, skipping initialization');
      return true;
    }

    console.log('[InitCategories] Initializing default categories content...');

    // Insert default content
    const { error: insertError } = await supabase
      .from('site_content')
      .upsert({
        section: 'categories',
        title: "Esplora per Categoria",
        subtitle: "Le nostre collezioni accuratamente curate",
        is_active: true,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[InitCategories] Error inserting default categories content:', insertError);
      return false;
    }

    console.log('[InitCategories] Default categories content initialized successfully');
    return true;
  } catch (error) {
    console.error('[InitCategories] Error in initializeCategoriesContent:', error);
    return false;
  }
}

// Initialize both categories and content
export async function initializeAllCategories(): Promise<boolean> {
  const categoriesSuccess = await initializeCategories();
  const contentSuccess = await initializeCategoriesContent();
  
  return categoriesSuccess && contentSuccess;
}
