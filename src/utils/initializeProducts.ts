import { supabase } from '@/integrations/supabase/client';

// Initialize products in the database (DISABLED - no automatic initialization)
export const initializeProducts = async (force: boolean = false): Promise<boolean> => {
  try {
    console.log('[InitializeProducts] Product initialization is disabled to prevent automatic recreation of deleted products');

    // Always return true without doing anything unless explicitly forced
    if (!force) {
      console.log('[InitializeProducts] Automatic product initialization is disabled. Use force=true to override.');
      return true;
    }

    console.log('[InitializeProducts] Force initialization requested...');

    // Check if products already exist
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('[InitializeProducts] Error checking existing products:', checkError);
      return false;
    }

    if (existingProducts && existingProducts.length > 0) {
      console.log('[InitializeProducts] Products already exist, skipping initialization');
      return true;
    }

    // First, get the categories to map them correctly
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug');

    if (categoriesError) {
      console.error('[InitializeProducts] Error fetching categories:', categoriesError);
      return false;
    }

    if (!categories || categories.length === 0) {
      console.error('[InitializeProducts] No categories found. Please initialize categories first.');
      return false;
    }

    // Create a mapping of category slugs to IDs
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {} as Record<string, string>);

    console.log('[InitializeProducts] Category mapping:', categoryMap);

    // Default products to insert
    const defaultProducts = [
      // Matrimoni
      {
        name: "Bouquet Sposa Elegante",
        description: "Bouquet raffinato con rose bianche e peonie per il giorno più importante",
        price: 85.00,
        slug: "bouquet-sposa-elegante",
        category_id: categoryMap['matrimoni'],
        image_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: true,
        stock_quantity: 10,
        sort_order: 1
      },
      {
        name: "Centrotavola Matrimonio",
        description: "Elegante centrotavola con fiori misti e candele per ricevimento",
        price: 45.00,
        slug: "centrotavola-matrimonio",
        category_id: categoryMap['matrimoni'],
        image_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 15,
        sort_order: 2
      },
      {
        name: "Addobbo Chiesa",
        description: "Composizione floreale per altare con fiori bianchi e verdi",
        price: 120.00,
        slug: "addobbo-chiesa",
        category_id: categoryMap['matrimoni'],
        image_url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 5,
        sort_order: 3
      },
      {
        name: "Bouquet Damigelle",
        description: "Piccoli bouquet coordinati per le damigelle d'onore",
        price: 35.00,
        slug: "bouquet-damigelle",
        category_id: categoryMap['matrimoni'],
        image_url: "https://images.unsplash.com/photo-1521543298264-785fba19d562?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 20,
        sort_order: 4
      },

      // Fiori & Piante
      {
        name: "Bouquet Rose Rosse",
        description: "Classico bouquet di rose rosse fresche, simbolo di amore eterno",
        price: 55.00,
        slug: "bouquet-rose-rosse",
        category_id: categoryMap['fiori-piante'],
        image_url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: true,
        stock_quantity: 25,
        sort_order: 1
      },
      {
        name: "Pianta Monstera",
        description: "Elegante pianta da interno, perfetta per decorare casa o ufficio",
        price: 35.00,
        slug: "pianta-monstera",
        category_id: categoryMap['fiori-piante'],
        image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 12,
        sort_order: 2
      },
      {
        name: "Gigli Bianchi",
        description: "Freschi gigli bianchi dal profumo delicato e raffinato",
        price: 40.00,
        slug: "gigli-bianchi",
        category_id: categoryMap['fiori-piante'],
        image_url: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 18,
        sort_order: 3
      },
      {
        name: "Composizione Mista",
        description: "Colorata composizione con fiori di stagione in vaso decorativo",
        price: 65.00,
        slug: "composizione-mista",
        category_id: categoryMap['fiori-piante'],
        image_url: "https://images.unsplash.com/photo-1518335935020-cfd6580c1ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: true,
        stock_quantity: 8,
        sort_order: 4
      },

      // Fiori Finti
      {
        name: "Orchidea Artificiale",
        description: "Elegante orchidea artificiale di alta qualità, indistinguibile dal vero",
        price: 45.00,
        slug: "orchidea-artificiale",
        category_id: categoryMap['fiori-finti'],
        image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: true,
        stock_quantity: 15,
        sort_order: 1
      },
      {
        name: "Bouquet Peonie Finte",
        description: "Splendido bouquet di peonie artificiali per decorazioni durature",
        price: 38.00,
        slug: "bouquet-peonie-finte",
        category_id: categoryMap['fiori-finti'],
        image_url: "https://images.unsplash.com/photo-1502780402662-acc01917738e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 20,
        sort_order: 2
      },
      {
        name: "Centro Tavola Artificiale",
        description: "Composizione artificiale per tavolo con fiori misti colorati",
        price: 52.00,
        slug: "centro-tavola-artificiale",
        category_id: categoryMap['fiori-finti'],
        image_url: "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 10,
        sort_order: 3
      },
      {
        name: "Piante Grasse Artificiali",
        description: "Set di piante grasse artificiali in vasi decorativi moderni",
        price: 28.00,
        slug: "piante-grasse-artificiali",
        category_id: categoryMap['fiori-finti'],
        image_url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 25,
        sort_order: 4
      },

      // Funerali
      {
        name: "Corona Funebre Classica",
        description: "Elegante corona funebre con fiori bianchi e verdi per ultimo saluto",
        price: 75.00,
        slug: "corona-funebre-classica",
        category_id: categoryMap['funerali'],
        image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: true,
        stock_quantity: 8,
        sort_order: 1
      },
      {
        name: "Cuscino Floreale",
        description: "Cuscino floreale di cordoglio con fiori freschi e nastro personalizzato",
        price: 65.00,
        slug: "cuscino-floreale",
        category_id: categoryMap['funerali'],
        image_url: "https://images.unsplash.com/photo-1595207759571-3a4df3c49230?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 12,
        sort_order: 2
      },
      {
        name: "Mazzo di Cordoglio",
        description: "Sobrio mazzo di fiori bianchi per esprimere vicinanza nel dolore",
        price: 45.00,
        slug: "mazzo-di-cordoglio",
        category_id: categoryMap['funerali'],
        image_url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 15,
        sort_order: 3
      },
      {
        name: "Composizione Commemorativa",
        description: "Composizione floreale per commemorazione con fiori di stagione",
        price: 55.00,
        slug: "composizione-commemorativa",
        category_id: categoryMap['funerali'],
        image_url: "https://images.unsplash.com/photo-1583160247711-2191776b4b91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        is_active: true,
        is_featured: false,
        stock_quantity: 10,
        sort_order: 4
      }
    ];

    // Filter out products for categories that don't exist
    const validProducts = defaultProducts.filter(product => product.category_id);

    if (validProducts.length === 0) {
      console.error('[InitializeProducts] No valid products to insert (missing categories)');
      return false;
    }

    console.log(`[InitializeProducts] Inserting ${validProducts.length} products...`);

    // Check if products already exist by slug
    const { data: existingProductSlugs, error: slugCheckError } = await supabase
      .from('products')
      .select('slug');

    if (slugCheckError) {
      console.error('[InitializeProducts] Error checking existing products:', slugCheckError);
      return false;
    }

    const existingSlugs = new Set(existingProductSlugs?.map(p => p.slug) || []);
    const newProducts = validProducts.filter(product => !existingSlugs.has(product.slug));

    if (newProducts.length === 0) {
      console.log('[InitializeProducts] All products already exist');
      return true;
    }

    console.log(`[InitializeProducts] Inserting ${newProducts.length} new products...`);

    // Insert products
    const { error: insertError } = await supabase
      .from('products')
      .insert(newProducts);

    if (insertError) {
      console.error('[InitializeProducts] Error inserting products:', insertError);
      return false;
    }

    console.log('[InitializeProducts] Products initialized successfully');
    return true;

  } catch (error) {
    console.error('[InitializeProducts] Error during initialization:', error);
    return false;
  }
};
