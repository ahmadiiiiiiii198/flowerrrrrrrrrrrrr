import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function updateCategoriesToNaturaleAndFinti() {
  console.log('🔧 UPDATING CATEGORIES TO NATURALE AND FINTI');
  console.log('=============================================');
  
  try {
    // Get current categories
    const { data: currentCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (fetchError) {
      console.log('❌ Error fetching categories:', fetchError.message);
      return;
    }
    
    console.log('📋 Current categories:');
    currentCategories?.forEach(cat => {
      console.log('- ID:', cat.id, '| Name:', cat.name, '| Slug:', cat.slug);
    });
    
    // Find categories that can be converted to Naturale and Finti
    let naturaleId = null;
    let fintiId = null;
    
    // Look for existing natural/plant categories
    const naturalCategory = currentCategories?.find(cat => 
      cat.name.toLowerCase().includes('fiori') && cat.name.toLowerCase().includes('piante') ||
      cat.name.toLowerCase().includes('naturale')
    );
    
    // Look for existing artificial/fake categories  
    const artificialCategory = currentCategories?.find(cat => 
      cat.name.toLowerCase().includes('finti') || 
      cat.name.toLowerCase().includes('artificiali')
    );
    
    console.log('');
    console.log('🔍 Category mapping:');
    console.log('- Natural category found:', naturalCategory?.name || 'None');
    console.log('- Artificial category found:', artificialCategory?.name || 'None');
    
    // Update or create Naturale category
    if (naturalCategory) {
      console.log('');
      console.log('🔄 Updating existing category to Naturale...');
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: 'Naturale',
          slug: 'naturale',
          description: 'Fiori e piante naturali freschi di qualità premium',
          image_url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          is_active: true,
          sort_order: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', naturalCategory.id);
      
      if (updateError) {
        console.log('❌ Error updating Naturale category:', updateError.message);
      } else {
        console.log('✅ Updated category to Naturale (ID:', naturalCategory.id + ')');
        naturaleId = naturalCategory.id;
      }
    }
    
    // Update or create Finti category
    if (artificialCategory) {
      console.log('');
      console.log('🔄 Updating existing category to Finti...');
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: 'Finti',
          slug: 'finti',
          description: 'Eleganti composizioni artificiali di alta qualità',
          image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          is_active: true,
          sort_order: 2,
          updated_at: new Date().toISOString()
        })
        .eq('id', artificialCategory.id);
      
      if (updateError) {
        console.log('❌ Error updating Finti category:', updateError.message);
      } else {
        console.log('✅ Updated category to Finti (ID:', artificialCategory.id + ')');
        fintiId = artificialCategory.id;
      }
    }
    
    // Deactivate other categories
    console.log('');
    console.log('🔇 Deactivating other categories...');
    const otherCategories = currentCategories?.filter(cat => 
      cat.id !== naturaleId && cat.id !== fintiId
    );
    
    for (const category of otherCategories || []) {
      const { error: deactivateError } = await supabase
        .from('categories')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', category.id);
      
      if (deactivateError) {
        console.log('❌ Error deactivating category:', category.name, deactivateError.message);
      } else {
        console.log('✅ Deactivated category:', category.name);
      }
    }
    
    // If we don't have both categories, create missing ones
    if (!naturaleId) {
      console.log('');
      console.log('➕ Creating Naturale category...');
      const { data: newNaturale, error: createError } = await supabase
        .from('categories')
        .insert({
          name: 'Naturale',
          slug: 'naturale',
          description: 'Fiori e piante naturali freschi di qualità premium',
          image_url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          is_active: true,
          sort_order: 1
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Error creating Naturale category:', createError.message);
      } else {
        console.log('✅ Created Naturale category (ID:', newNaturale.id + ')');
        naturaleId = newNaturale.id;
      }
    }
    
    if (!fintiId) {
      console.log('');
      console.log('➕ Creating Finti category...');
      const { data: newFinti, error: createError } = await supabase
        .from('categories')
        .insert({
          name: 'Finti',
          slug: 'finti',
          description: 'Eleganti composizioni artificiali di alta qualità',
          image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          is_active: true,
          sort_order: 2
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Error creating Finti category:', createError.message);
      } else {
        console.log('✅ Created Finti category (ID:', newFinti.id + ')');
        fintiId = newFinti.id;
      }
    }
    
    console.log('');
    console.log('🎯 CATEGORIES UPDATE COMPLETE');
    console.log('Active categories:');
    console.log('- Naturale (ID:', naturaleId + ')');
    console.log('- Finti (ID:', fintiId + ')');
    
  } catch (error) {
    console.error('❌ Failed to update categories:', error);
  }
}

updateCategoriesToNaturaleAndFinti();
