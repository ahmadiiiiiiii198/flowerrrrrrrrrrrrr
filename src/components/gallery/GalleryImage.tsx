
import React, { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface GalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const GalleryImage = ({ src, alt, className = "", onLoad, onError }: GalleryImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Fallback images in case the original source fails to load
  const fallbackImages = [
    "/placeholder.svg",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
    "https://images.unsplash.com/photo-1486718448742-163732cd1544",
  ];
  
  // Handle URL transformation from blob URLs
  const processImageUrl = useCallback((url: string) => {
    // Check for blob URLs which won't persist across sessions or devices
    if (url.startsWith('blob:')) {
      console.log("GalleryImage - Found blob URL:", url.substring(0, 50) + "...");
      return fallbackImages[0];
    }
    return url;
  }, []);
  
  // Reset component state when source changes
  useEffect(() => {
    if (!src) {
      console.warn("GalleryImage - Empty source provided, using fallback");
      setHasError(true);
      setImageSrc(fallbackImages[0]);
      setIsLoading(false);
      if (onError) onError();
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setImageSrc(processImageUrl(src));
    
    // Preload image
    const img = new Image();
    img.src = processImageUrl(src);
    
    img.onload = () => {
      setIsLoading(false);
      if (onLoad) onLoad();
    };
    
    img.onerror = () => {
      console.error("GalleryImage - Failed to load image:", src);
      setHasError(true);
      setIsLoading(false);
      setImageSrc(fallbackImages[0]);
      if (onError) onError();
    };
    
    return () => {
      // Cleanup
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError, processImageUrl]);

  // Handle image load error
  const handleImageError = () => {
    console.error("GalleryImage - Error loading image:", imageSrc);
    setHasError(true);
    
    // If current source is already a fallback, try the next one
    if (imageSrc && fallbackImages.includes(imageSrc)) {
      const currentIndex = fallbackImages.indexOf(imageSrc);
      const nextIndex = (currentIndex + 1) % fallbackImages.length;
      setImageSrc(fallbackImages[nextIndex]);
    } else {
      // Otherwise, use the first fallback
      setImageSrc(fallbackImages[0]);
    }
    
    if (onError) onError();
  };
  
  const handleImageLoaded = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  return (
    <div className={`relative overflow-hidden rounded-lg shadow-md h-56 md:h-64 bg-gray-100 ${className}`}>
      {isLoading && (
        <Skeleton className="w-full h-full absolute inset-0" />
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt || "Gallery Image"}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          loading="eager"
          onError={handleImageError}
          onLoad={handleImageLoaded}
        />
      )}
      
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <p className="text-sm text-gray-500 text-center p-4">Image could not be loaded</p>
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(GalleryImage);
