import { supabase } from '@/integrations/supabase/client';
import { Product, ProductsByCategory, ProductsContent } from '@/types/category';

// Default products for each category
const defaultProducts: Product[] = [
  // Matrimoni
  {
    id: "1",
    name: "Bouquet Sposa Elegante",
    description: "Bouquet raffinato con rose bianche e peonie per il giorno più importante",
    price: 85.00,
    category: "Matrimoni",
    category_slug: "matrimoni",
    image_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: true,
    is_available: true,
    stock_quantity: 10
  },
  {
    id: "2", 
    name: "Centrotavola Matrimonio",
    description: "Elegante centrotavola con fiori misti e candele per ricevimento",
    price: 45.00,
    category: "Matrimoni",
    category_slug: "matrimoni",
    image_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 15
  },
  {
    id: "3",
    name: "Addobbo Chiesa",
    description: "Composizione floreale per altare con fiori bianchi e verdi",
    price: 120.00,
    category: "Matrimoni", 
    category_slug: "matrimoni",
    image_url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 5
  },
  {
    id: "4",
    name: "Bouquet Damigelle",
    description: "Piccoli bouquet coordinati per le damigelle d'onore",
    price: 35.00,
    category: "Matrimoni",
    category_slug: "matrimoni", 
    image_url: "https://images.unsplash.com/photo-1521543298264-785fba19d562?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 20
  },

  // Fiori & Piante
  {
    id: "5",
    name: "Bouquet Rose Rosse",
    description: "Classico bouquet di rose rosse fresche, simbolo di amore eterno",
    price: 55.00,
    category: "Fiori & Piante",
    category_slug: "fiori-piante",
    image_url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: true,
    is_available: true,
    stock_quantity: 25
  },
  {
    id: "6",
    name: "Pianta Monstera",
    description: "Elegante pianta da interno, perfetta per decorare casa o ufficio",
    price: 35.00,
    category: "Fiori & Piante",
    category_slug: "fiori-piante", 
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 12
  },
  {
    id: "7",
    name: "Gigli Bianchi",
    description: "Freschi gigli bianchi dal profumo delicato e raffinato",
    price: 40.00,
    category: "Fiori & Piante",
    category_slug: "fiori-piante",
    image_url: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 18
  },
  {
    id: "8",
    name: "Composizione Mista",
    description: "Colorata composizione con fiori di stagione in vaso decorativo",
    price: 65.00,
    category: "Fiori & Piante",
    category_slug: "fiori-piante",
    image_url: "https://images.unsplash.com/photo-1518335935020-cfd6580c1ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: true,
    is_available: true,
    stock_quantity: 8
  },

  // Fiori Finti
  {
    id: "9",
    name: "Orchidea Artificiale",
    description: "Elegante orchidea artificiale di alta qualità, indistinguibile dal vero",
    price: 45.00,
    category: "Fiori Finti",
    category_slug: "fiori-finti",
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: true,
    is_available: true,
    stock_quantity: 15
  },
  {
    id: "10",
    name: "Bouquet Peonie Finte",
    description: "Splendido bouquet di peonie artificiali per decorazioni durature",
    price: 38.00,
    category: "Fiori Finti",
    category_slug: "fiori-finti",
    image_url: "https://images.unsplash.com/photo-1502780402662-acc01917738e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 20
  },
  {
    id: "11",
    name: "Centro Tavola Artificiale",
    description: "Composizione artificiale per tavolo con fiori misti colorati",
    price: 52.00,
    category: "Fiori Finti",
    category_slug: "fiori-finti",
    image_url: "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 10
  },
  {
    id: "12",
    name: "Pianta Grassa Artificiale",
    description: "Set di piante grasse artificiali in vasi decorativi moderni",
    price: 28.00,
    category: "Fiori Finti",
    category_slug: "fiori-finti",
    image_url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 25
  },

  // Funerali
  {
    id: "13",
    name: "Corona Funebre Classica",
    description: "Elegante corona funebre con fiori bianchi e verdi per ultimo saluto",
    price: 75.00,
    category: "Funerali",
    category_slug: "funerali",
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: true,
    is_available: true,
    stock_quantity: 8
  },
  {
    id: "14",
    name: "Cuscino Floreale",
    description: "Cuscino floreale di cordoglio con fiori freschi e nastro personalizzato",
    price: 65.00,
    category: "Funerali",
    category_slug: "funerali",
    image_url: "https://images.unsplash.com/photo-1595207759571-3a4df3c49230?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 12
  },
  {
    id: "15",
    name: "Mazzo di Cordoglio",
    description: "Sobrio mazzo di fiori bianchi per esprimere vicinanza nel dolore",
    price: 45.00,
    category: "Funerali",
    category_slug: "funerali",
    image_url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 15
  },
  {
    id: "16",
    name: "Composizione Commemorativa",
    description: "Composizione floreale per commemorazione con fiori di stagione",
    price: 55.00,
    category: "Funerali",
    category_slug: "funerali",
    image_url: "https://images.unsplash.com/photo-1583160247711-2191776b4b91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    is_featured: false,
    is_available: true,
    stock_quantity: 10
  }
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
