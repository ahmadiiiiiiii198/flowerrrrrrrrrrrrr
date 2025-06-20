import React, { useState, useEffect } from "react";
import PatternDivider from "./PatternDivider";
import { motion } from "framer-motion";
import { fetchDirectSpecialties, defaultSpecialties } from "@/lib/direct-supabase";

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

// Separated Dish component
const Dish = ({ dish, index }: { dish: Specialty; index: number }) => {
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
        {dish.image && !imageError ? (
          <img 
            src={dish.image} 
            alt={dish.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => {
              console.error("[FRESH] Failed to load image:", dish.image);
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
        <h3 className="text-xl font-playfair font-bold text-persian-navy mb-2">{dish.title}</h3>
        <p className="text-gray-600 mb-2">{dish.description}</p>
        <p className="text-persian-gold font-semibold">{dish.price}</p> 
      </div>
    </motion.div>
  );
};

// Main component with direct Supabase connection
const FreshSpecialties = () => {
  const [data, setData] = useState<SpecialtiesContent>(defaultSpecialties);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");
  
  // Function to fetch fresh data
  const loadFreshData = async () => {
    try {
      setLoading(true);
      const fetchedData = await fetchDirectSpecialties();
      
      // Create timestamp for debugging
      const now = new Date();
      setLastFetchTime(now.toLocaleTimeString());
      
      if (fetchedData && fetchedData.value) {
        console.log("[FRESH] Successfully fetched data at", now.toLocaleTimeString());
        
        // Cast the value to our type
        const content = fetchedData.value as any;
        if (content && content.heading && content.subheading && Array.isArray(content.specialties)) {
          const typedContent: SpecialtiesContent = {
            heading: content.heading,
            subheading: content.subheading,
            specialties: content.specialties,
            backgroundImage: content.backgroundImage
          };
          
          console.log("[FRESH] Parsed specialties:", typedContent.specialties.length, "items");
          setData(typedContent);
        } else {
          console.error("[FRESH] Invalid data structure:", content);
          setError("Data structure invalid");
        }
      } else {
        console.error("[FRESH] Missing value in fetched data");
        setError("No specialties data found");
      }
    } catch (err: any) {
      console.error("[FRESH] Error loading specialties:", err);
      setError(err.message || "Failed to load specialties");
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on mount
  useEffect(() => {
    console.log("[FRESH] Component mounted, fetching fresh data");
    loadFreshData();
    
    // Also refresh when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[FRESH] Page visible again, refreshing data");
        loadFreshData();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <section className="py-24">
        <div className="container mx-auto flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-persian-gold border-t-transparent"></div>
          <span className="ml-3 text-lg">Loading specialties...</span>
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
            <div className="flex gap-4">
              <button 
                onClick={() => loadFreshData()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.href = "/cachedebugger"}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Open Debugger
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // Debug info - will help track when data was last fetched
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
  
  const sectionStyle = data.backgroundImage 
    ? { backgroundImage: `url(${data.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <section id="specialties" className="py-24 relative" style={sectionStyle}>
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 relative z-10">
        {/* Debug timestamp - visible but unobtrusive */}
        <div style={debugStyle}>Last updated: {lastFetchTime}</div>
        
        <h2 className="text-3xl md:text-4xl text-center font-playfair font-bold mb-2 text-persian-navy">
          {data.heading.split(' ').map((word, i, arr) => 
            i === arr.length - 1 ? 
              <span key={i} className="text-persian-gold">{word}</span> : 
              <span key={i}>{word} </span>
          )}
        </h2>
        <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto">
          {data.subheading}
        </p>
        
        <PatternDivider />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {data.specialties.map((dish, index) => (
            <Dish 
              key={dish.id} 
              dish={dish} 
              index={index} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FreshSpecialties;
