
import React, { useState, useEffect } from 'react';
import { Flower, Sparkles, Heart, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CategoryGallery from './CategoryGallery';

const Categories = () => {
  const [categoryPictures, setCategoryPictures] = useState([]);
  const [categoryGalleries, setCategoryGalleries] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategoryPictures();
    loadCategoryGalleries();
  }, []);

  const loadCategoryPictures = async () => {
    try {
      // Load from the same source as admin "Galleria" section
      const { data, error } = await supabase
        .from('settings')
        .select('value, updated_at')
        .eq('key', 'gallery_images')
        .single();

      if (!error && data?.value && Array.isArray(data.value)) {
        // Convert gallery images format to match expected format
        const galleryImages = data.value.map((img, index) => ({
          id: img.id || `gallery-${index}`,
          image_url: img.src,
          title: img.alt || 'Gallery Image',
          position: index,
          is_active: true
        }));
        setCategoryPictures(galleryImages);
      } else {
        setCategoryPictures([]);
      }
    } catch (error) {
      console.log('Could not load gallery pictures:', error);
      setCategoryPictures([]);
    }
  };

  const loadCategoryGalleries = async () => {
    try {
      console.log('[Categories] Loading category galleries from database...');

      // Load all category gallery data
      const categoryKeys = ['matrimoni', 'fiori_piante', 'fiori_finti', 'funerali'];
      const galleries = {};

      for (const categoryKey of categoryKeys) {
        const { data, error } = await supabase
          .from('content_sections')
          .select('content_value')
          .eq('section_key', `category_${categoryKey}_images`)
          .single();

        if (!error && data?.content_value) {
          try {
            const parsedData = JSON.parse(data.content_value);
            console.log(`[Categories] Loaded ${categoryKey} gallery:`, parsedData);

            // Handle both old format (array of strings) and new format (array of objects with url and label)
            let images = [];
            let labels = [];

            if (Array.isArray(parsedData)) {
              if (parsedData.length > 0 && typeof parsedData[0] === 'string') {
                // Old format: array of URL strings
                images = parsedData.filter(url => url && url.trim());
                labels = [];
              } else {
                // New format: array of objects with url and label
                images = parsedData
                  .filter(item => item && item.url && item.url.trim())
                  .map(item => item.url.trim());
                labels = parsedData
                  .filter(item => item && item.url && item.url.trim())
                  .map(item => item.label || '');
              }
            }

            galleries[categoryKey] = { images, labels };
          } catch (parseError) {
            console.error(`[Categories] Error parsing ${categoryKey} gallery:`, parseError);
          }
        } else {
          console.log(`[Categories] No gallery data found for ${categoryKey}`);
        }
      }

      setCategoryGalleries(galleries);
      console.log('[Categories] All category galleries loaded:', galleries);
    } catch (error) {
      console.error('[Categories] Error loading category galleries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create categories with database images or fallback to default images
  const getCategories = () => {
    const defaultImages = {
      fiori_piante: [
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1518335935020-cfd6580c1ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      fiori_finti: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1502780402662-acc01917738e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      matrimoni: [
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1521543298264-785fba19d562?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      funerali: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1595207759571-3a4df3c49230?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1583160247711-2191776b4b91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ]
    };

    return [
      {
        title: "Fiori & Piante",
        description: "Fiori freschi e piante di qualità premium",
        images: categoryGalleries.fiori_piante?.images || defaultImages.fiori_piante,
        explanation: "Da Francesco Fiori & Piante, troverai un'ampia scelta di fiori freschi di stagione e piante ornamentali per ogni ambiente. Che tu stia cercando una pianta verde per il tuo salotto o un mazzo colorato per sorprendere una persona cara, siamo qui per consigliarti con passione e competenza.",
        features: [
          "Fiori freschi tagliati quotidianamente",
          "Piante da interno e esterno",
          "Composizioni personalizzate",
          "Garanzia di freschezza",
          "Cura e manutenzione inclusa"
        ],
        labels: categoryGalleries.fiori_piante?.labels || [],
        icon: <Flower className="text-emerald-500" size={28} />
      },
      {
        title: "Fiori Finti",
        description: "Eleganti composizioni artificiali",
        images: categoryGalleries.fiori_finti?.images || defaultImages.fiori_finti,
        explanation: "Per chi desidera la bellezza dei fiori senza pensieri, proponiamo una collezione curata di fiori artificiali di alta qualità.",
        features: [
          "Materiali di alta qualità",
          "Aspetto realistico",
          "Nessuna manutenzione richiesta",
          "Durata illimitata",
          "Resistenti agli allergeni",
          "Perfetti per ogni ambiente"
        ],
        labels: categoryGalleries.fiori_finti?.labels || [],
        icon: <Sparkles className="text-amber-500" size={28} />
      },
      {
        title: "Matrimoni",
        description: "Allestimenti floreali per il giorno speciale",
        images: categoryGalleries.matrimoni?.images || defaultImages.matrimoni,
        explanation: "Rendiamo unico il giorno più importante della tua vita con allestimenti floreali personalizzati per matrimoni. Bouquet da sposa, centrotavola, archi floreali e decorazioni per chiesa e location: tutto viene progettato su misura per raccontare la vostra storia d'amore con i fiori.",
        features: [
          "Bouquet da sposa personalizzati",
          "Centrotavola eleganti",
          "Archi floreali per cerimonie",
          "Decorazioni per chiesa",
          "Allestimenti per location",
          "Progettazione su misura",
          "Consulenza personalizzata",
          "Servizio completo matrimoni"
        ],
        labels: categoryGalleries.matrimoni?.labels || [],
        icon: <Heart className="text-rose-500" size={28} />
      },
      {
        title: "Funerali",
        description: "Composizioni di cordoglio e commemorazione",
        images: categoryGalleries.funerali?.images || defaultImages.funerali,
        explanation: "Nel momento del dolore, offriamo composizioni floreali sobrie ed eleganti per onorare la memoria dei tuoi cari.",
        features: [
          "Composizioni tradizionali e moderne",
          "Corone e cuscini floreali",
          "Mazzi di cordoglio",
          "Consegna tempestiva",
          "Servizio discreto e rispettoso",
          "Personalizzazione su richiesta"
        ],
        labels: categoryGalleries.funerali?.labels || [],
        icon: <Users className="text-sage-500" size={28} />
      }
    ];
  };

  return (
    <section id="categories" className="py-20 bg-gradient-to-br from-peach-50/30 via-white to-amber-50/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-playfair animate-scale-in">
            Esplora per Categoria
          </h2>
          <p className="text-xl text-gray-600 font-inter animate-fade-in-up animate-stagger-1">
            Scopri l'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿
          </p>
        </div>

        {/* 3-Picture Gallery - WHERE YOU CAN UPLOAD YOUR DOG PICTURE! */}
        <div className="mb-16 animate-slide-in-up animate-stagger-2">
          <div className="text-center mb-8 animate-fade-in-down">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2 font-playfair animate-bounce-gentle">
              La Nostra Galleria
            </h3>
            <p className="text-gray-600 animate-fade-in-up animate-stagger-1">
              Scopri alcuni dei nostri lavori più belli (incluso il tuo cane! 🐕)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {!isLoading && categoryPictures && categoryPictures.length > 0 ? (
              categoryPictures.map((picture, index) => (
                <div
                  key={picture.id}
                  className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover-lift animate-scale-in animate-stagger-${Math.min(index + 1, 5)}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={picture.image_url}
                      alt={picture.title || `Gallery picture ${picture.position}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 hover-glow"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {picture.title && (
                    <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <p className="text-sm font-medium animate-fade-in-up">{picture.title}</p>
                    </div>
                  )}
                  {/* Floating animation elements */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Flower className="text-white animate-float" size={20} />
                  </div>
                </div>
              ))
            ) : (
              // Default placeholder images when no pictures are uploaded
              [1, 2, 3].map((position) => (
                <div
                  key={position}
                  className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover-lift animate-fade-in-up animate-stagger-${position}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500 animate-bounce-gentle">
                      <Flower size={48} className="mx-auto mb-2 text-gray-400 animate-float" />
                      <p className="text-sm animate-fade-in-up">Picture {position}</p>
                      <p className="text-xs animate-fade-in-up animate-stagger-1">Upload via Admin Panel</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories Grid - RESTORED TO ORIGINAL DETAILED VIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up animate-stagger-3">
          {getCategories().map((category, index) => (
            <div
              key={index}
              className={`animate-scale-in animate-stagger-${Math.min(index + 1, 5)} hover-lift`}
            >
              <CategoryGallery
                category={category}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Categories;
