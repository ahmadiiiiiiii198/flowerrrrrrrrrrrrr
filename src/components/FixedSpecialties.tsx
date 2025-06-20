import React, { useState, useEffect } from "react";
import PatternDivider from "./PatternDivider";
import { motion } from "framer-motion";
import { SettingsManager } from "@/lib/settings-manager";

// Define types for specialties data
interface Specialty {
  id: string;
  title: string;
  description: string;
  image?: string;
  price: string;
}

interface SpecialtiesContent {
  heading: string;
  subheading: string;
  specialties: Specialty[];
  backgroundImage?: string;
}

// Default content if database fetch fails
const defaultContent: SpecialtiesContent = {
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
    },
  ]
};

// Individual dish component
const Dish = ({ specialty, index }: { specialty: Specialty; index: number }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="relative h-64 overflow-hidden">
        {specialty.image && !imageError ? (
          <img 
            src={specialty.image} 
            alt={specialty.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => {
              console.error("Failed to load image:", specialty.image);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Image not available</p>
          </div>
        )}
      </div>
      <div className="p-6 border-t-2 border-persian-gold/20">
        <h3 className="text-xl font-playfair font-bold text-persian-navy mb-2">{specialty.title}</h3>
        <p className="text-gray-600 mb-2">{specialty.description}</p>
        <p className="text-persian-gold font-semibold">{specialty.price}</p> 
      </div>
    </motion.div>
  );
};

// Main specialties component
const FixedSpecialties: React.FC = () => {
  const [content, setContent] = useState<SpecialtiesContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  // Function to load specialties data with cache-busting parameter
  const loadSpecialties = async (bypassCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const timestamp = new Date().getTime();
      console.log(`[FixedSpecialties] Fetching from SettingsManager at ${timestamp}`);
      
      // Add explicit logging about what's happening
      console.log('[FixedSpecialties] Requesting data directly from Supabase settings table');
      
      const data = await SettingsManager.getSetting<SpecialtiesContent>("specialtiesContent");
      console.log('[FixedSpecialties] Raw data received:', JSON.stringify(data, null, 2));
      
      if (data && data.heading && data.subheading && Array.isArray(data.specialties)) {
        console.log(`[FixedSpecialties] Successfully loaded ${data.specialties.length} specialties at ${timestamp}`);
        console.log('[FixedSpecialties] First specialty title:', data.specialties[0]?.title);
        
        setContent(data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        console.warn("[FixedSpecialties] Invalid or missing data structure:", data);
        setContent(defaultContent);
      }
    } catch (err: any) {
      console.error("[FixedSpecialties] Error loading specialties:", err);
      setError(err.message || "Failed to load specialties data");
    } finally {
      setLoading(false);
    }
  };
  
  // Manual refresh function that can be exposed to user
  const refreshData = () => {
    console.log("[FixedSpecialties] Manual refresh triggered");
    loadSpecialties(true);
  };
  
  useEffect(() => {
    // Initial load on mount
    loadSpecialties();
    
    // Set up a timer to frequently check for updates (every 10 seconds)
    const intervalId = setInterval(() => {
      console.log("[FixedSpecialties] Auto-refresh check");
      loadSpecialties(true);
    }, 10000);
    
    // Refresh data when page becomes visible again
    const refreshOnVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[FixedSpecialties] Page became visible, forcing reload");
        loadSpecialties(true);
      }
    };
    
    document.addEventListener("visibilitychange", refreshOnVisibilityChange);
    
    // Clean up listeners
    return () => {
      document.removeEventListener("visibilitychange", refreshOnVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-persian-gold border-t-transparent"></div>
          <span className="ml-3">Loading specialties...</span>
        </div>
      </section>
    );
  }
  
  // Error state
  if (error) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Specialties</h2>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }
  
  // Debug info to show when data was last fetched
  const debugStyle = {
    position: 'absolute' as const,
    bottom: '5px',
    right: '5px',
    fontSize: '10px',
    color: '#666',
    background: 'rgba(255,255,255,0.7)',
    padding: '2px 5px',
    borderRadius: '3px',
    zIndex: 100
  };

  const sectionStyle = content.backgroundImage 
    ? { backgroundImage: `url(${content.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <section id="specialties" className="py-24 relative" style={sectionStyle}>
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 relative z-10">
        {/* Debug timestamp - visible but unobtrusive */}
        <div style={debugStyle}>
          Last updated: {lastUpdated}
          <button 
            onClick={refreshData}
            className="ml-2 px-2 py-0.5 bg-persian-navy text-white text-xs rounded hover:bg-persian-navy/80"
          >
            Refresh
          </button>
        </div>
        
        <h2 className="text-3xl md:text-4xl text-center font-playfair font-bold mb-2 text-persian-navy">
          {content.heading.split(' ').map((word, i, arr) => 
            i === arr.length - 1 ? 
              <span key={i} className="text-persian-gold">{word}</span> : 
              <span key={i}>{word} </span>
          )}
        </h2>
        <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto">
          {content.subheading}
        </p>
        
        <PatternDivider />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {content.specialties.map((specialty, index) => (
            <Dish key={specialty.id} specialty={specialty} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FixedSpecialties;
