
import React, { useState, useEffect, useMemo } from "react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryImage as GalleryImageType } from "@/types/gallery";
import GalleryImage from "./GalleryImage";

interface MobileGalleryViewProps {
  images: GalleryImageType[];
  lastUpdated: number;
  onRefresh?: () => void;
}

const MobileGalleryView: React.FC<MobileGalleryViewProps> = ({ 
  images, 
  lastUpdated,
  onRefresh 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [key, setKey] = useState(`mobile-gallery-${lastUpdated}`);

  // Log incoming data for debugging
  useEffect(() => {
    console.log("MobileGalleryView - Images received:", images?.length || 0);
    if (images?.length > 0) {
      console.log("MobileGalleryView - First image:", images[0].id, 
        images[0].src ? images[0].src.substring(0, 50) + "..." : "No src");
    }
    
    // When images change, reset loading state
    setIsLoading(true);
    
    // Reset key when images or lastUpdated changes
    setKey(`mobile-gallery-${lastUpdated}-${Date.now()}`);
    
    // Consider images loaded after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [images, lastUpdated]);
  
  // Ensure we always have validated images to display
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
  
  const handleRefresh = () => {
    if (onRefresh) {
      console.log("MobileGalleryView - Refresh requested");
      setIsLoading(true);
      setLoadError(null);
      setKey(`mobile-gallery-refresh-${Date.now()}`);
      
      try {
        onRefresh();
      } catch (error) {
        console.error("Error refreshing gallery:", error);
        setLoadError("Failed to refresh gallery");
      }
    }
  };
  
  const handleImageLoadingComplete = () => {
    setIsLoading(false);
  };
  
  return (
    <div className="md:hidden mb-10 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50/80 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-persian-gold mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading gallery...</p>
          </div>
        </div>
      )}
      
      {loadError && (
        <div className="text-center py-4 px-3 bg-red-50 rounded-lg mb-4">
          <p className="text-red-500">{loadError}</p>
        </div>
      )}
      
      <Carousel className="w-full" key={key}>
        <CarouselContent>
          {safeImages.map((image, index) => (
            <CarouselItem key={`${image.id}-${index}-${key}`}>
              <GalleryImage 
                src={image.src} 
                alt={image.alt || "Gallery Image"} 
                onLoad={handleImageLoadingComplete}
                onError={() => {
                  console.error("Failed to load image:", image.src);
                  setIsLoading(false);
                }}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-4 mt-4">
          <CarouselPrevious className="static transform-none bg-persian-gold/10 hover:bg-persian-gold/20 border-persian-gold/30" />
          <CarouselNext className="static transform-none bg-persian-gold/10 hover:bg-persian-gold/20 border-persian-gold/30" />
        </div>
      </Carousel>
      
      <div className="mt-4 text-center">
        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2 border-persian-gold/20 text-persian-navy hover:bg-persian-gold/5 hover:text-persian-gold"
          disabled={isLoading}
        >
          {isLoading ? 
            <div className="h-4 w-4 border-t-2 border-b-2 border-current rounded-full animate-spin"></div> : 
            <RefreshCw className="h-4 w-4" />
          }
          Refresh Gallery
        </Button>
      </div>
    </div>
  );
};

export default React.memo(MobileGalleryView);
