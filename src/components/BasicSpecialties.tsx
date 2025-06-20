import React, { useState, useEffect } from "react";
import PatternDivider from "./PatternDivider";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// Define interfaces
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

// Default content as fallback
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

// Individual specialty component
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
            onError={() => setImageError(true)}
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

const BasicSpecialties: React.FC = () => {
  const [content, setContent] = useState<SpecialtiesContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  // Direct fetch from Supabase
  const fetchLatestSpecialties = async () => {
    try {
      setLoading(true);
      
      // Log the fetch attempt with a timestamp
      const now = new Date();
      console.log(`[BasicSpecialties] Fetching at ${now.toISOString()}`);
      
      // Direct query to Supabase settings table - most recent specialtiesContent
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("[BasicSpecialties] Supabase error:", error);
        setError(`Database error: ${error.message}`);
        return;
      }
      
      console.log("[BasicSpecialties] Raw data from Supabase:", data);
      
      if (data && data.length > 0) {
        // Extract and parse the value field
        try {
          const rawContent = data[0].value;
          console.log("[BasicSpecialties] Raw content value:", rawContent);
          
          // Parse if string, or use directly if already an object
          const parsedContent = typeof rawContent === 'string' 
            ? JSON.parse(rawContent) 
            : rawContent;
          
          console.log("[BasicSpecialties] Parsed content:", parsedContent);
          
          if (parsedContent && 
              parsedContent.heading && 
              parsedContent.subheading && 
              Array.isArray(parsedContent.specialties)) {
            setContent(parsedContent);
            setLastUpdate(now.toLocaleTimeString());
            console.log("[BasicSpecialties] Successfully updated content");
          } else {
            console.warn("[BasicSpecialties] Invalid content structure:", parsedContent);
            setError("Data format error: Missing required fields");
          }
        } catch (parseError) {
          console.error("[BasicSpecialties] Parse error:", parseError);
          setError(`Data parse error: ${parseError.message}`);
        }
      } else {
        console.warn("[BasicSpecialties] No data found");
        setError("No specialties data found");
      }
    } catch (err) {
      console.error("[BasicSpecialties] Fetch error:", err);
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and set up auto-refresh
  useEffect(() => {
    fetchLatestSpecialties();
    
    // Auto-refresh every 5 seconds
    const intervalId = setInterval(fetchLatestSpecialties, 5000);
    
    // Refresh on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[BasicSpecialties] Tab visible, refreshing data");
        fetchLatestSpecialties();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (loading && !content) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-persian-gold border-t-transparent"></div>
          <span className="ml-3">Loading specialties...</span>
        </div>
      </section>
    );
  }

  const sectionStyle = content.backgroundImage 
    ? { backgroundImage: `url(${content.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  // Debug panel styles
  const debugPanelStyle = {
    position: 'fixed' as const,
    bottom: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    zIndex: 9999
  };

  return (
    <section id="specialties" className="py-24 relative" style={sectionStyle}>
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 relative z-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button 
              onClick={fetchLatestSpecialties}
              className="ml-3 bg-red-600 text-white px-2 py-1 rounded text-xs"
            >
              Retry
            </button>
          </div>
        )}
        
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
        
        {/* Debug Panel */}
        <div style={debugPanelStyle}>
          <div>Last Updated: {lastUpdate}</div>
          <button 
            onClick={fetchLatestSpecialties}
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-xs w-full"
          >
            Force Refresh
          </button>
        </div>
      </div>
    </section>
  );
};

export default BasicSpecialties;
