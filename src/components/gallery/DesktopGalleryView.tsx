
import React, { useEffect, useState, useMemo } from "react";
import { GalleryImage as GalleryImageType } from "@/types/gallery";
import GalleryImage from "./GalleryImage";

interface DesktopGalleryViewProps {
  images: GalleryImageType[];
  lastUpdated: number;
}

const DesktopGalleryView: React.FC<DesktopGalleryViewProps> = ({ 
  images,
  lastUpdated
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  
  // Log images for debugging
  useEffect(() => {
    console.log("DesktopGalleryView - Images received:", images?.length || 0);
    if (images?.length > 0) {
      console.log("DesktopGalleryView - First image:", images[0].id, 
        images[0].src ? images[0].src.substring(0, 50) + "..." : "No src");
    }
    
    // Reset loading state when images change
    setIsLoading(true);
    setLoadedCount(0);
  }, [images]);
  
  // Generate a unique key for forcing re-renders when needed
  const gridKey = useMemo(() => `desktop-gallery-${lastUpdated}-${Date.now()}`, [lastUpdated]);
  
  // Ensure we always have valid images to display
  const safeImages = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) {
      return [
        { id: "default1", src: "/placeholder.svg", alt: "Gallery Image 1", featured: false },
        { id: "default2", src: "/placeholder.svg", alt: "Gallery Image 2", featured: false },
        { id: "default3", src: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07", alt: "Gallery Image 3", featured: false }
      ];
    }
    
    return images.filter(img => img && typeof img.src === 'string');
  }, [images]);
  
  // Handle image load events
  const handleImageLoad = () => {
    setLoadedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= safeImages.length) {
        setIsLoading(false);
      }
      return newCount;
    });
  };
  
  return (
    <div className="hidden md:block relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50/80 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-persian-gold mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading gallery...</p>
          </div>
        </div>
      )}
    
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" key={gridKey}>
        {safeImages.map((image, index) => (
          <div 
            key={`${image.id}-${index}-${gridKey}`} 
            className="transform transition-transform duration-300 hover:scale-[1.02]"
          >
            <GalleryImage 
              src={image.src} 
              alt={image.alt || "Gallery Image"} 
              onLoad={handleImageLoad}
              onError={handleImageLoad} // Count errors as loaded to avoid infinite loading state
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(DesktopGalleryView);
