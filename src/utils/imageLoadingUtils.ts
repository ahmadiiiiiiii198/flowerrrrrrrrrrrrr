/**
 * Utility functions for handling image loading with error handling and fallbacks
 */

export interface ImageLoadOptions {
  timeout?: number;
  retries?: number;
  fallbackUrls?: string[];
}

export interface ImageLoadResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Preload an image with timeout and retry logic
 */
export const preloadImage = (
  url: string, 
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult> => {
  const { timeout = 10000, retries = 2, fallbackUrls = [] } = options;
  
  return new Promise((resolve) => {
    let attemptCount = 0;
    const allUrls = [url, ...fallbackUrls];
    
    const attemptLoad = (currentUrl: string) => {
      const img = new Image();
      let timeoutId: NodeJS.Timeout;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        img.onload = null;
        img.onerror = null;
      };
      
      const tryNextUrl = () => {
        cleanup();
        attemptCount++;
        
        if (attemptCount < allUrls.length) {
          console.log(`🔄 Trying fallback image ${attemptCount + 1}/${allUrls.length}: ${allUrls[attemptCount]}`);
          attemptLoad(allUrls[attemptCount]);
        } else if (attemptCount < allUrls.length + retries) {
          // Retry with original URL
          console.log(`🔄 Retrying original image (attempt ${attemptCount - allUrls.length + 2}/${retries + 1})`);
          attemptLoad(url);
        } else {
          resolve({
            success: false,
            url: currentUrl,
            error: 'All attempts failed'
          });
        }
      };
      
      img.onload = () => {
        cleanup();
        console.log(`✅ Image loaded successfully: ${currentUrl}`);
        resolve({
          success: true,
          url: currentUrl
        });
      };
      
      img.onerror = () => {
        console.warn(`❌ Image failed to load: ${currentUrl}`);
        tryNextUrl();
      };
      
      // Set timeout
      timeoutId = setTimeout(() => {
        console.warn(`⏰ Image load timeout: ${currentUrl}`);
        tryNextUrl();
      }, timeout);
      
      // Start loading
      img.src = currentUrl;
    };
    
    attemptLoad(url);
  });
};

/**
 * Preload multiple images concurrently
 */
export const preloadImages = async (
  urls: string[], 
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult[]> => {
  const promises = urls.map(url => preloadImage(url, options));
  return Promise.all(promises);
};

/**
 * Create a fallback image URL based on the original URL
 */
export const generateFallbackUrls = (originalUrl: string): string[] => {
  const fallbacks: string[] = [];
  
  // If it's an Unsplash URL, try different sizes
  if (originalUrl.includes('unsplash.com')) {
    const baseUrl = originalUrl.split('?')[0];
    fallbacks.push(
      `${baseUrl}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`,
      `${baseUrl}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
      `${baseUrl}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`
    );
  }
  
  // Generic fallback images
  fallbacks.push(
    'https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  );
  
  return fallbacks;
};

/**
 * Enhanced image component with built-in error handling
 */
export interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackUrls?: string[];
  onLoad?: () => void;
  onError?: (error: string) => void;
  timeout?: number;
  showPlaceholder?: boolean;
  placeholderClassName?: string;
}

/**
 * Get optimized image URL based on device capabilities
 */
export const getOptimizedImageUrl = (url: string, width?: number, quality?: number): string => {
  if (!url) return url;
  
  // For Unsplash images, add optimization parameters
  if (url.includes('unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (quality) params.set('q', quality.toString());
    params.set('auto', 'format');
    params.set('fit', 'crop');
    
    return `${url}${separator}${params.toString()}`;
  }
  
  return url;
};

/**
 * Check if an image URL is accessible
 */
export const checkImageAccessibility = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return response.ok;
  } catch {
    // If CORS blocks the request, try loading as image
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
};

/**
 * Image cache for better performance
 */
class ImageCache {
  private cache = new Map<string, boolean>();
  
  isLoaded(url: string): boolean {
    return this.cache.get(url) || false;
  }
  
  markAsLoaded(url: string): void {
    this.cache.set(url, true);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const imageCache = new ImageCache();
