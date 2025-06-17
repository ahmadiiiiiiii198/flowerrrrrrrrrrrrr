import React from "react";
import PatternDivider from "./PatternDivider";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { defaultContent } from "@/services/specialtiesService";
import type { SpecialtiesContent, Specialty } from "@/services/specialtiesService";

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

const DirectSpecialties = () => {
  const [loading, setLoading] = React.useState(true);
  const [specialtiesContent, setSpecialtiesContent] = React.useState<SpecialtiesContent>(defaultContent);
  const [error, setError] = React.useState<string | null>(null);

  // Direct fetch from Supabase without any service layer or local storage
  React.useEffect(() => {
    const fetchDirectlyFromSupabase = async () => {
      console.log("DIRECT FETCH: Starting direct fetch from Supabase...");
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'specialtiesContent')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (error) {
          throw error;
        }
        
        console.log("DIRECT FETCH: Data from Supabase:", data);
        
        if (data && data.length > 0) {
          // Cast value to any first to access properties safely
          const value = data[0].value as any;
          
          if (value && typeof value === 'object' && value.heading && value.subheading && Array.isArray(value.specialties)) {
            console.log("DIRECT FETCH: Valid data found with", value.specialties.length, "specialties");
            // Now we can safely cast to SpecialtiesContent
            const typedContent: SpecialtiesContent = {
              heading: value.heading,
              subheading: value.subheading,
              specialties: value.specialties,
              backgroundImage: value.backgroundImage
            };
            setSpecialtiesContent(typedContent);
          } else {
            console.error("DIRECT FETCH: Invalid data structure:", value);
            setError("Invalid data structure received from database");
          }
        } else {
          console.log("DIRECT FETCH: No data found, using defaults");
        }
      } catch (err: any) {
        console.error("DIRECT FETCH: Error fetching from Supabase:", err);
        setError(`Error loading specialties: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDirectlyFromSupabase();
    
    // Also set up a refresh when the document becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("DIRECT FETCH: Page visible again, refreshing data");
        fetchDirectlyFromSupabase();
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
  
  if (error) {
    return (
      <div className="py-24">
        <div className="container mx-auto px-4">
          <div className="p-6 bg-red-50 border border-red-200 rounded-md">
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

export default DirectSpecialties;
