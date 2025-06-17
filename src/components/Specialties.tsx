
import React from "react";
import PatternDivider from "./PatternDivider";
import { motion } from "framer-motion";
import { specialtiesService, type SpecialtiesContent, defaultContent } from "@/services/specialtiesService";

interface DishProps {
  image: string;
  title: string;
  description: string;
  index: number;
  price: string;
}

const Dish = ({ image, title, description, price, index }: DishProps) => {
  const [imageError, setImageError] = React.useState(false);
  
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="relative h-64 overflow-hidden">
        {!imageError ? (
          <img 
            src={image || '/placeholder.svg'} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              console.error("Failed to load image:", image);
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
        <h3 className="text-xl font-playfair font-bold text-persian-navy mb-2">{title}</h3>
        <p className="text-gray-600 mb-2">{description}</p>
        <p className="text-persian-gold font-semibold">{price}</p> 
      </div>
    </motion.div>
  );
};

// Dish component is defined above

const Specialties = () => {
  const [loading, setLoading] = React.useState(true);
  const [specialtiesContent, setSpecialtiesContent] = React.useState<SpecialtiesContent>(defaultContent);

  // Always fetch fresh data directly from Supabase on every render
  React.useEffect(() => {
    console.log("[HOMEPAGE] Forcing fresh data from Supabase");
    setLoading(true);
    
    // Clear any cached data first
    try {
      localStorage.removeItem('specialtiesContent');
      console.log("[HOMEPAGE] Cleared any local storage cache");
    } catch (e) {
      console.warn("[HOMEPAGE] Failed to clear localStorage", e);
    }
    
    // Force a direct fetch from Supabase with no caching
    const fetchDirectlyFromSupabase = async () => {
      try {
        console.log("[HOMEPAGE] Fetching fresh data directly from Supabase...");
        await specialtiesService.refreshContent();
        const freshContent = await specialtiesService.fetchContent(true); // true = force refresh
        console.log("[HOMEPAGE] Got fresh data:", freshContent);
        setSpecialtiesContent(freshContent);
        setLoading(false);
      } catch (err) {
        console.error("[HOMEPAGE] Error fetching content directly:", err);
        setLoading(false);
      }
    };
    
    fetchDirectlyFromSupabase();
    
    // No cleanup needed - we're not using subscriptions anymore
  }, []);
  
  // Set up refresh on visibility change
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[HOMEPAGE] Page became visible, refreshing data");
        specialtiesService.refreshContent().catch(err => {
          console.error("[HOMEPAGE] Error refreshing on visibility change:", err);
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 flex-col">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-persian-gold mb-2"></div>
        <p>Loading specialties...</p>
      </div>
    );
  }

  const sectionStyle = specialtiesContent.backgroundImage 
    ? { backgroundImage: `url(${specialtiesContent.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <section id="specialties" className="py-24 relative" style={sectionStyle}>
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl text-center font-playfair font-bold mb-2 text-persian-navy">
          {specialtiesContent.heading.split(' ').map((word, i, arr) => 
            i === arr.length - 1 ? 
              <span key={i} className="text-persian-gold">{word}</span> : 
              <span key={i}>{word} </span>
          )}
        </h2>
        <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto">
          {specialtiesContent.subheading}
        </p>
        
        <PatternDivider />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {specialtiesContent.specialties.map((dish, index) => (
            <Dish 
              key={dish.id}
              image={dish.image || ''}
              title={dish.title}
              description={dish.description}
              price={dish.price} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Specialties;
