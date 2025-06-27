import { supabase } from '@/integrations/supabase/client';
import { Product, ProductsByCategory, ProductsContent } from '@/types/category';

// Default products removed to prevent automatic recreation after deletion
const defaultProducts: Product[] = [
  // No default products - they were causing automatic recreation after deletion
];
  // All default products removed to prevent automatic recreation after deletion
];

const defaultContent: ProductsContent = {
  products: {},
  heading: "I Nostri Prodotti",
  subheading: "Scopri la nostra selezione di fiori e composizioni per ogni occasione"
};

class ProductService {
  private cachedContent: ProductsContent | null = null;
  private isFetching = false;

  // Organize products by category
  private organizeProductsByCategory(products: Product[]): ProductsByCategory {
    const organized: ProductsByCategory = {};

    products.forEach(product => {
      const categorySlug = product.category_slug || 'unknown';
      if (!organized[categorySlug]) {
        organized[categorySlug] = [];
      }
      organized[categorySlug].push(product);
    });

    return organized;
  }

  // Fetch products from database
  async fetchProducts(): Promise<Product[]> {
    try {
      console.log('[ProductService] Fetching products from Supabase...');

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('is_featured', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('[ProductService] Error fetching products:', error);
        console.log('[ProductService] Returning empty array due to error');
        return [];
      }

      if (!data || data.length === 0) {
        console.log('[ProductService] No products found in database, returning empty array');
        return [];
      }

      console.log('[ProductService] Successfully fetched products from database:', data);

      // Transform database products to match frontend interface
      const transformedProducts: Product[] = data.map(product => ({
        ...product,
        // Add computed fields for frontend compatibility
        category: (product as any).categories?.name || 'Unknown',
        category_slug: (product as any).categories?.slug || 'unknown',
        is_available: product.is_active,
        images: product.image_url ? [product.image_url] : [],
        // Ensure required fields have defaults
        description: product.description || '',
        image_url: product.image_url || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        stock_quantity: product.stock_quantity ?? 0,
        compare_price: product.compare_price ?? 0,
        sort_order: product.sort_order ?? 0,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        labels: Array.isArray(product.labels) ? product.labels : []
      }));

      return transformedProducts;
    } catch (error) {
      console.error('[ProductService] Error in fetchProducts:', error);
      return [];
    }
  }

  // Fetch content including products organized by category
  async fetchContent(): Promise<ProductsContent> {
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
      // Fetch products
      const products = await this.fetchProducts();
      const organizedProducts = this.organizeProductsByCategory(products);
      
      // Fetch content settings from site_content table
      const { data: contentData, error: contentError } = await supabase
        .from('site_content')
        .select('title, subtitle')
        .eq('section', 'products')
        .single();

      let heading = defaultContent.heading;
      let subheading = defaultContent.subheading;

      if (!contentError && contentData) {
        heading = contentData.title || heading;
        subheading = contentData.subtitle || subheading;
      }

      this.cachedContent = {
        products: organizedProducts,
        heading,
        subheading
      };

      return this.cachedContent;
    } catch (error) {
      console.error('[ProductService] Error fetching content:', error);
      return {
        ...defaultContent,
        products: {}
      };
    } finally {
      this.isFetching = false;
    }
  }

  // Get featured products across all categories
  async getFeaturedProducts(): Promise<Product[]> {
    const products = await this.fetchProducts();
    return products.filter(product => product.is_featured);
  }

  // Get products by category
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const products = await this.fetchProducts();
    return products.filter(product => product.category_slug === categorySlug);
  }

  // Clear cache
  clearCache(): void {
    console.log('[ProductService] Clearing cache');
    this.cachedContent = null;
  }

  // Delete product (for admin use)
  async deleteProduct(id: string): Promise<boolean> {
    try {
      console.log('[ProductService] Deleting product:', id);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ProductService] Error deleting product:', error);
        throw error;
      }

      // Clear cache to force refresh
      this.clearCache();

      console.log('[ProductService] Product deleted successfully');
      return true;
    } catch (error) {
      console.error('[ProductService] Error in deleteProduct:', error);
      return false;
    }
  }
}

export const productService = new ProductService();
export default productService;
