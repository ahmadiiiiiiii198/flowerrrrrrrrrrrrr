import { supabase } from '@/integrations/supabase/client';

/**
 * Direct Supabase Access - No caching or middleware
 * This is a completely fresh implementation that bypasses all existing code
 */

export async function fetchDirectSpecialties() {
  console.log("[DIRECT_SUPABASE] Starting direct Supabase fetch...");
  
  try {
    // Direct query to Supabase with no caching
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'specialtiesContent')
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error("[DIRECT_SUPABASE] Supabase query error:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error("[DIRECT_SUPABASE] No data returned from Supabase");
      throw new Error("No specialties data found");
    }
    
    console.log("[DIRECT_SUPABASE] Raw data from Supabase:", data[0]);
    return data[0];
  } catch (err) {
    console.error("[DIRECT_SUPABASE] Error in fetchDirectSpecialties:", err);
    throw err;
  }
}

export async function saveDirectSpecialties(content: any) {
  console.log("[DIRECT_SUPABASE] Saving specialties directly to Supabase...");
  
  try {
    // Convert complex objects to plain JSON
    const safeContent = JSON.parse(JSON.stringify(content));
    
    // Direct insert to Supabase with no caching
    const { data, error } = await supabase
      .from('settings')
      .insert({
        key: 'specialtiesContent',
        value: safeContent,
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("[DIRECT_SUPABASE] Error saving to Supabase:", error);
      throw error;
    }
    
    console.log("[DIRECT_SUPABASE] Successfully saved to Supabase");
    return true;
  } catch (err) {
    console.error("[DIRECT_SUPABASE] Error in saveDirectSpecialties:", err);
    throw err;
  }
}

// Default specialty content if needed
export const defaultSpecialties = {
  heading: "Our Specialties",
  subheading: "Discover authentic Central Asian flavors crafted with centuries-old recipes",
  specialties: [
    {
      id: "1",
      title: "Plov (Uzbek Rice Pilaf)",
      description: "Our signature dish featuring fragrant rice cooked with tender lamb, carrots, and a blend of traditional spices.",
      image: "/lovable-uploads/73eb78dc-53a2-4ec9-b660-6ffec6bff8bb.png",
      price: "€14.90",
    },
    {
      id: "2",
      title: "Shashlik (Central Asian Skewers)",
      description: "Marinated meat skewers grilled to perfection over an open flame. Served with tangy yogurt sauce and fresh herbs.",
      image: "/lovable-uploads/05335902-cb3d-4760-aab2-46a1292ac614.png",
      price: "€13.90",
    },
    {
      id: "3",
      title: "Shurpa (Lamb Soup)",
      description: "Hearty lamb soup with vegetables and herbs, slow-cooked to extract rich flavors. Perfect for starting your Central Asian feast.",
      image: "/lovable-uploads/bbf20df5-b0f5-4add-bf53-5675c1993c9b.png",
      price: "€12.90",
    }
  ]
};
