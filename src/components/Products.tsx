import React, { useState, useEffect } from 'react';
import { Flower, Sparkles, Heart, Users, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import ProductOrderModal from './ProductOrderModal';
import { Product, ProductsByCategory } from '@/types/category';

const Products = () => {
  const [products, setProducts] = useState<ProductsByCategory>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [heading, setHeading] = useState("I Nostri Prodotti");
  const [subheading, setSubheading] = useState("Scopri la nostra selezione di fiori e composizioni per ogni occasione");

  useEffect(() => {
    loadProducts();
    loadContent();
  }, []);

  const loadProducts = async () => {
    try {
      // Fetch products with their categories
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!productsError && productsData) {
        // Group products by category slug
        const groupedProducts: ProductsByCategory = {};

        productsData.forEach((product) => {
          const categorySlug = product.categories?.slug || 'uncategorized';
          if (!groupedProducts[categorySlug]) {
            groupedProducts[categorySlug] = [];
          }

          // Transform database product to frontend format
          const transformedProduct: Product = {
            ...product,
            category: product.categories?.name || 'Uncategorized',
            category_slug: categorySlug,
            is_available: (product.stock_quantity || 0) > 0,
            images: product.gallery ? (Array.isArray(product.gallery) ? product.gallery : [product.image_url].filter(Boolean)) : [product.image_url].filter(Boolean)
          };

          groupedProducts[categorySlug].push(transformedProduct);
        });

        setProducts(groupedProducts);
      }
    } catch (error) {
      console.log('Could not load products:', error);
      // Fail silently - component will show empty state
    } finally {
      setIsLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content_sections')
        .select('section_key, content_value')
        .in('section_key', ['products_heading', 'products_subheading']);

      if (!error && data) {
        data.forEach((item) => {
          if (item.section_key === 'products_heading' && item.content_value) {
            setHeading(item.content_value);
          }
          if (item.section_key === 'products_subheading' && item.content_value) {
            setSubheading(item.content_value);
          }
        });
      }
    } catch (error) {
      console.log('Could not load content:', error);
      // Fail silently - use default content
    }
  };

  const handleOrderProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedProduct(null);
  };

  // Icon mapping for categories
  const getIconForCategory = (categorySlug: string) => {
    switch (categorySlug) {
      case 'fiori-piante':
        return <Flower className="text-emerald-500" size={28} />;
      case 'fiori-finti':
        return <Sparkles className="text-amber-500" size={28} />;
      case 'matrimoni':
        return <Heart className="text-rose-500" size={28} />;
      case 'funerali':
        return <Users className="text-sage-500" size={28} />;
      default:
        return <Flower className="text-emerald-500" size={28} />;
    }
  };

  // Color mapping for categories
  const getColorForCategory = (categorySlug: string) => {
    switch (categorySlug) {
      case 'fiori-piante':
        return 'from-peach-400 to-coral-500';
      case 'fiori-finti':
        return 'from-amber-400 to-peach-500';
      case 'matrimoni':
        return 'from-rose-400 to-pink-500';
      case 'funerali':
        return 'from-sage-400 to-emerald-500';
      default:
        return 'from-peach-400 to-coral-500';
    }
  };

  // Category display names
  const getCategoryDisplayName = (categorySlug: string) => {
    switch (categorySlug) {
      case 'fiori-piante':
        return 'Fiori & Piante';
      case 'fiori-finti':
        return 'Fiori Finti';
      case 'matrimoni':
        return 'Matrimoni';
      case 'funerali':
        return 'Funerali';
      default:
        return categorySlug;
    }
  };

  if (isLoading) {
    return (
      <section id="products" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center animate-fade-in-up">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto animate-pulse-glow"></div>
            <p className="mt-4 text-gray-600 animate-bounce-gentle">Caricamento prodotti...</p>
          </div>
        </div>
      </section>
    );
  }

  const categoryOrder = ['matrimoni', 'fiori-piante', 'fiori-finti', 'funerali'];
  const sortedCategories = categoryOrder.filter(slug => products[slug] && products[slug].length > 0);

  return (
    <>
      <section id="products" className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-800 mb-4 font-playfair animate-scale-in">
              {heading}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-inter animate-fade-in-up animate-stagger-1">
              {subheading}
            </p>
          </div>

          {/* Category Sections */}
          <div className="space-y-16">
            {sortedCategories.map((categorySlug, categoryIndex) => {
              const categoryProducts = products[categorySlug] || [];
              const displayName = getCategoryDisplayName(categorySlug);
              const icon = getIconForCategory(categorySlug);
              const colorClass = getColorForCategory(categorySlug);

              return (
                <div
                  key={categorySlug}
                  className={`space-y-8 animate-slide-in-up animate-stagger-${Math.min(categoryIndex + 2, 5)}`}
                >
                  {/* Category Header */}
                  <div className="text-center animate-fade-in-down">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`p-4 rounded-full bg-gradient-to-r ${colorClass} shadow-lg hover-lift animate-bounce-gentle`}>
                        <div className="bg-white p-2 rounded-full animate-heartbeat">
                          {icon}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-2 font-playfair animate-fade-in-up">
                      {displayName}
                    </h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mx-auto rounded-full animate-shimmer"></div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {categoryProducts.slice(0, 4).map((product, productIndex) => (
                      <div
                        key={product.id}
                        className={`animate-scale-in animate-stagger-${Math.min(productIndex + 1, 5)} hover-lift`}
                      >
                        <ProductCard
                          product={product}
                          onOrder={handleOrderProduct}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Show more button if there are more than 4 products */}
                  {categoryProducts.length > 4 && (
                    <div className="text-center animate-fade-in-up animate-stagger-5">
                      <button className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover-glow animate-pulse-glow">
                        <ShoppingBag size={20} className="animate-wiggle" />
                        Vedi tutti i prodotti {displayName}
                        <span className="bg-white/20 px-2 py-1 rounded-full text-sm animate-bounce-gentle">
                          +{categoryProducts.length - 4}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center animate-slide-in-up animate-stagger-5">
            <div className="bg-gradient-to-br from-peach-50/50 via-white to-amber-50/50 rounded-2xl p-8 border border-peach-100/50 hover-lift animate-pulse-glow">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 font-playfair animate-fade-in-up">
                Non trovi quello che cerchi?
              </h3>
              <p className="text-gray-600 mb-6 font-inter animate-fade-in-up animate-stagger-1">
                Contattaci per composizioni personalizzate e consulenze su misura per le tue esigenze
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-stagger-2">
                <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-3 rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover-glow animate-heartbeat">
                  Richiedi Preventivo Personalizzato
                </button>
                <button className="border-2 border-emerald-500 text-emerald-600 px-8 py-3 rounded-full hover:bg-emerald-50 transition-all duration-300 hover-lift animate-bounce-gentle">
                  Contattaci
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Order Modal */}
      <ProductOrderModal
        product={selectedProduct}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />
    </>
  );
};

export default Products;
