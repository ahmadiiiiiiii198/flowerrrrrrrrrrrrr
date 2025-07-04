import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testCategoryService() {
  console.log('🧪 TESTING CATEGORY SERVICE FALLBACK');
  console.log('====================================');
  
  try {
    // Test what happens when categoryService tries to fetch categories
    console.log('1. Testing database categories fetch...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.log('❌ Database error:', error.message);
      console.log('🔄 CategoryService will fall back to defaultCategories');
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No categories found in database');
      console.log('🔄 CategoryService will fall back to defaultCategories');
      console.log('');
      console.log('🚨 THIS IS THE PROBLEM!');
      console.log('The database has no active categories, so categoryService returns hardcoded defaults');
      return;
    }
    
    console.log('✅ Database categories found:');
    data.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (slug: ${cat.slug})`);
    });
    
    console.log('');
    console.log('✅ CategoryService should return these categories, not defaults');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCategoryService().catch(console.error);
