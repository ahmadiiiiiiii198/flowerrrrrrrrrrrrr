
import React from "react";
import PatternDivider from "./PatternDivider";
import { Images, RefreshCw } from "lucide-react";
import MobileGalleryView from "./gallery/MobileGalleryView";
import DesktopGalleryView from "./gallery/DesktopGalleryView";
import { useGalleryData } from "@/hooks/use-gallery-data";
import { Button } from "@/components/ui/button";

const Gallery = () => {
  // Use the improved gallery data hook
  const { 
    galleryContent,
    images, 
    isLoading, 
    error, 
    lastUpdated,
    refreshGalleryData
  } = useGalleryData();

  // Convert lastUpdated to a timestamp for props
  const lastUpdatedTimestamp = lastUpdated instanceof Date ? lastUpdated.getTime() : 0;

  return (
    <section id="gallery" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-persian-gold/3 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-persian-gold/3 blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl text-center font-playfair font-bold mb-2 text-persian-navy animate-on-scroll" data-animation-id="gallery-heading">
          Our <span className="text-persian-gold">{galleryContent.heading}</span>
        </h2>
        <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto animate-on-scroll" data-animation-id="gallery-subheading">
          {galleryContent.subheading}
        </p>
        
        <PatternDivider />
        
        <div className="flex items-center justify-center mb-10">
          <div className="bg-persian-navy text-white px-5 py-3 rounded-full flex items-center shadow-md animate-on-scroll" data-animation-id="gallery-label">
            <Images className="text-persian-gold mr-2" size={20} />
            <span className="font-spectral">Experience the Atmosphere</span>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-persian-gold"></div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8 px-4 bg-red-50 rounded-lg mb-8">
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={refreshGalleryData}
              variant="outline" 
              className="mt-4 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry loading
            </Button>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            {/* Mobile gallery view */}
            <MobileGalleryView 
              images={images} 
              lastUpdated={lastUpdatedTimestamp}
              onRefresh={refreshGalleryData}
            />
            
            {/* Desktop gallery view */}
            <DesktopGalleryView 
              images={images} 
              lastUpdated={lastUpdatedTimestamp}
            />
            
            <div className="hidden md:flex mt-6 justify-center">
              <Button 
                onClick={refreshGalleryData}
                variant="outline"
                className="bg-transparent hover:bg-persian-gold/5 text-persian-navy hover:text-persian-gold border-persian-gold/20 hover:border-persian-gold/40 transition-all animate-on-scroll flex items-center gap-2"
                data-animation-id="gallery-refresh"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh gallery images
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Gallery;
