import { supabase } from '@/integrations/supabase/client';

// Define the content sections needed for categories
const categoryContentSections = [
  {
    section_key: 'category_fiori_piante_explanation',
    section_name: 'Fiori & Piante - Explanation',
    content_type: 'textarea',
    content_value: "Da Francesco Fiori & Piante, troverai un'ampia scelta di fiori freschi di stagione e piante ornamentali per ogni ambiente. Che tu stia cercando una pianta verde per il tuo salotto o un mazzo colorato per sorprendere una persona cara, siamo qui per consigliarti con passione e competenza.",
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_fiori_piante_features',
    section_name: 'Fiori & Piante - Features',
    content_type: 'json',
    content_value: JSON.stringify([
      "Fiori freschi tagliati quotidianamente",
      "Piante da interno e esterno",
      "Composizioni personalizzate",
      "Garanzia di freschezza",
      "Cura e manutenzione inclusa"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_fiori_piante_images',
    section_name: 'Category Images: Fiori & Piante',
    content_type: 'json',
    content_value: JSON.stringify([
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1518335935020-cfd6580c1ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_fiori_finti_explanation',
    section_name: 'Fiori Finti - Explanation',
    content_type: 'textarea',
    content_value: "Per chi desidera la bellezza dei fiori senza pensieri, proponiamo una collezione curata di fiori artificiali di alta qualità. Realistici, eleganti e duraturi, i nostri fiori finti sono perfetti per decorazioni durature, uffici, ristoranti o spazi in cui la manutenzione è difficile.",
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_fiori_finti_features',
    section_name: 'Fiori Finti - Features',
    content_type: 'json',
    content_value: JSON.stringify([
      "Materiali di alta qualità",
      "Aspetto realistico",
      "Nessuna manutenzione richiesta",
      "Durata illimitata",
      "Resistenti agli allergeni",
      "Perfetti per ogni ambiente"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_fiori_finti_images',
    section_name: 'Category Images: Fiori Finti',
    content_type: 'json',
    content_value: JSON.stringify([
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1502780402662-acc01917738e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_matrimoni_explanation',
    section_name: 'Matrimoni - Explanation',
    content_type: 'textarea',
    content_value: "Rendiamo unico il giorno più importante della tua vita con allestimenti floreali personalizzati per matrimoni. Bouquet da sposa, centrotavola, archi floreali e decorazioni per chiesa e location: tutto viene progettato su misura per raccontare la vostra storia d'amore con i fiori.",
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_matrimoni_features',
    section_name: 'Matrimoni - Features',
    content_type: 'json',
    content_value: JSON.stringify([
      "Consulenza personalizzata",
      "Bouquet sposa e damigelle",
      "Allestimenti chiesa e location",
      "Centrotavola e decorazioni",
      "Addobbi floreali completi",
      "Servizio completo per matrimoni"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_matrimoni_images',
    section_name: 'Category Images: Matrimoni',
    content_type: 'json',
    content_value: JSON.stringify([
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1521543298264-785fba19d562?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_funerali_explanation',
    section_name: 'Funerali - Explanation',
    content_type: 'textarea',
    content_value: "Nel momento del dolore, offriamo composizioni floreali sobrie ed eleganti per onorare la memoria dei tuoi cari. Corone, cuscini e copribara vengono realizzati con rispetto, delicatezza e attenzione ai desideri della famiglia.",
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_funerali_features',
    section_name: 'Funerali - Features',
    content_type: 'json',
    content_value: JSON.stringify([
      "Composizioni tradizionali e moderne",
      "Corone e cuscini floreali",
      "Mazzi di cordoglio",
      "Consegna tempestiva",
      "Servizio discreto e rispettoso",
      "Personalizzazione su richiesta"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  },
  {
    section_key: 'category_funerali_images',
    section_name: 'Category Images: Funerali',
    content_type: 'json',
    content_value: JSON.stringify([
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1595207759571-3a4df3c49230?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1583160247711-2191776b4b91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    ]),
    metadata: { section: 'categories' },
    is_active: true
  }
];

export async function initializeCategoryContentSections(): Promise<boolean> {
  try {
    console.log('[InitContentSections] Initializing category content sections...');

    // Check if content sections already exist
    const { data: existingSections, error: fetchError } = await supabase
      .from('content_sections')
      .select('section_key')
      .contains('metadata', { section: 'categories' });

    if (fetchError) {
      console.error('[InitContentSections] Error checking existing sections:', fetchError);
      return false;
    }

    const existingKeys = existingSections?.map(s => s.section_key) || [];
    const sectionsToInsert = categoryContentSections.filter(
      section => !existingKeys.includes(section.section_key)
    );

    if (sectionsToInsert.length === 0) {
      console.log('[InitContentSections] All category content sections already exist');
      return true;
    }

    console.log(`[InitContentSections] Inserting ${sectionsToInsert.length} new content sections...`);

    // Insert new content sections
    const { error: insertError } = await supabase
      .from('content_sections')
      .insert(sectionsToInsert);

    if (insertError) {
      console.error('[InitContentSections] Error inserting content sections:', insertError);
      return false;
    }

    console.log('[InitContentSections] Category content sections initialized successfully');
    return true;
  } catch (error) {
    console.error('[InitContentSections] Error in initializeCategoryContentSections:', error);
    return false;
  }
}
