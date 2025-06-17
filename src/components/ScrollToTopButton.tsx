
import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const previousY = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  
  // Complete rewrite of the scroll detection logic
  useEffect(() => {
    const threshold = 300;
    
    const handleScroll = () => {
      // Cancel any pending animation frame to avoid multiple updates
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Schedule the visibility update in the next animation frame
      animationFrameId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Only update state if there's a significant change to avoid micro-updates
        if (Math.abs(currentScrollY - previousY.current) > 5) {
          setIsVisible(currentScrollY > threshold);
          previousY.current = currentScrollY;
        }
      });
    };
    
    // Initial check
    setIsVisible(window.scrollY > threshold);
    
    // Add passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    // Instant scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'instant' // Use 'instant' instead of 'smooth' to avoid triggering additional scroll events
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-50 bg-persian-gold text-persian-navy hover:bg-persian-gold/90 rounded-full shadow-lg p-2 transition-opacity duration-300"
          size="icon"
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </Button>
      )}
    </>
  );
};

export default ScrollToTopButton;
