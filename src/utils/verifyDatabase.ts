import { supabase } from '@/integrations/supabase/client';

export interface DatabaseVerificationResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface DatabaseStatus {
  categories: DatabaseVerificationResult;
  products: DatabaseVerificationResult;
  overall: boolean;
}

// Verify that all required categories exist
export async function verifyCategoriesData(): Promise<DatabaseVerificationResult> {
  try {
    console.log('[VerifyDB] Checking categories data...');
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, is_active')
      .eq('is_active', true);

    if (error) {
      return {
        success: false,
        message: `Categories query error: ${error.message}`,
        details: error
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No active categories found in database'
      };
    }

    // Check for required category slugs
    const expectedSlugs = ['matrimoni', 'fiori-piante', 'fiori-finti', 'funerali'];
    const existingSlugs = data.map(cat => cat.slug);
    const missingCategories = expectedSlugs.filter(slug => !existingSlugs.includes(slug));

    if (missingCategories.length > 0) {
      return {
        success: false,
        message: `Missing required categories: ${missingCategories.join(', ')}`,
        details: { existing: existingSlugs, missing: missingCategories }
      };
    }

    return {
      success: true,
      message: `Found all ${data.length} required categories`,
      details: { categories: data.map(c => ({ name: c.name, slug: c.slug })) }
    };
  } catch (error) {
    return {
      success: false,
      message: `Categories verification error: ${error.message}`,
      details: error
    };
  }
}

// Verify that products exist and are properly linked to categories
export async function verifyProductsData(): Promise<DatabaseVerificationResult> {
  try {
    console.log('[VerifyDB] Checking products data...');
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        is_active,
        is_featured,
        category_id,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('is_active', true);

    if (error) {
      return {
        success: false,
        message: `Products query error: ${error.message}`,
        details: error
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No active products found in database'
      };
    }

    // Check products by category
    const productsByCategory = data.reduce((acc, product) => {
      const categorySlug = (product as any).categories?.slug || 'unknown';
      if (!acc[categorySlug]) {
        acc[categorySlug] = [];
      }
      acc[categorySlug].push(product);
      return acc;
    }, {} as Record<string, any[]>);

    const expectedCategories = ['matrimoni', 'fiori-piante', 'fiori-finti', 'funerali'];
    const categoriesWithProducts = Object.keys(productsByCategory);
    const categoriesWithoutProducts = expectedCategories.filter(cat => !categoriesWithProducts.includes(cat));

    // Check for products without proper category links
    const productsWithoutCategories = data.filter(product => !(product as any).categories);

    const warnings = [];
    if (categoriesWithoutProducts.length > 0) {
      warnings.push(`Categories without products: ${categoriesWithoutProducts.join(', ')}`);
    }
    if (productsWithoutCategories.length > 0) {
      warnings.push(`${productsWithoutCategories.length} products missing category links`);
    }

    return {
      success: warnings.length === 0,
      message: warnings.length === 0 
        ? `Found ${data.length} active products across ${categoriesWithProducts.length} categories`
        : `Found ${data.length} products but with issues: ${warnings.join('; ')}`,
      details: {
        totalProducts: data.length,
        productsByCategory: Object.keys(productsByCategory).map(slug => ({
          category: slug,
          count: productsByCategory[slug].length
        })),
        warnings
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Products verification error: ${error.message}`,
      details: error
    };
  }
}

// Comprehensive database verification
export async function verifyDatabaseState(): Promise<DatabaseStatus> {
  console.log('[VerifyDB] Starting comprehensive database verification...');
  
  const categories = await verifyCategoriesData();
  const products = await verifyProductsData();
  
  const overall = categories.success && products.success;
  
  console.log('[VerifyDB] Verification complete:', {
    categories: categories.success,
    products: products.success,
    overall
  });
  
  return {
    categories,
    products,
    overall
  };
}

// Test database connection
export async function testDatabaseConnection(): Promise<DatabaseVerificationResult> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (error) {
      return {
        success: false,
        message: `Database connection failed: ${error.message}`,
        details: error
      };
    }
    
    return {
      success: true,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: `Database connection error: ${error.message}`,
      details: error
    };
  }
}
