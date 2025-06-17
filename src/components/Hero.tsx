import React, { useState, useEffect } from 'react';
import { Flower2 } from 'lucide-react';

const Hero = () => {
  const [heroContent, setHeroContent] = useState({
    heading: "Francesco Fiori & Piante",
    subheading: "Creazioni floreali uniche per ogni occasione speciale",
    backgroundImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
  });

  const [logoSettings, setLogoSettings] = useState({
    logoUrl: "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png",
    altText: "Francesco Fiori & Piante Logo",
  });

  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [logoImageLoaded, setLogoImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Try to load content from settings service with timeout
        const { settingsService } = await import('@/services/settingsService');

        // Initialize with timeout
        const initPromise = settingsService.initialize();
        const initTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Settings init timeout')), 5000);
        });

        await Promise.race([initPromise, initTimeout]);

        // Load hero content with timeout
        const heroPromise = settingsService.getSetting('heroContent', heroContent);
        const heroTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Hero content timeout')), 3000);
        });

        const loadedHeroContent = await Promise.race([heroPromise, heroTimeout]);
        setHeroContent(loadedHeroContent);

        // Load logo settings with timeout
        const logoPromise = settingsService.getSetting('logoSettings', logoSettings);
        const logoTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Logo settings timeout')), 3000);
        });

        const loadedLogoSettings = await Promise.race([logoPromise, logoTimeout]);
        setLogoSettings(loadedLogoSettings);

        console.log('✅ [Hero] Content loaded successfully');
      } catch (error) {
        console.warn('⚠️ [Hero] Failed to load content, using defaults:', error);
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to let the app initialize
    const timer = setTimeout(loadContent, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-peach-50 via-white to-amber-50 overflow-hidden">
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

          {/* Left Column - Logo and Text */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in-left">
            <div className="flex justify-center lg:justify-start mb-8">
              <div className="relative">
                {/* Logo loading placeholder */}
                {!logoImageLoaded && (
                  <div className="h-96 md:h-[480px] w-96 bg-gradient-to-br from-peach-100 to-coral-100 rounded-3xl animate-pulse flex items-center justify-center">
                    <Flower2 className="text-peach-300 animate-float" size={64} />
                  </div>
                )}

                {/* Main logo image */}
                {logoSettings.logoUrl && (
                  <img
                    src={logoSettings.logoUrl}
                    alt={logoSettings.altText}
                    className={`h-96 md:h-[480px] w-auto object-contain drop-shadow-2xl transition-all duration-700 hover-scale animate-scale-in ${
                      logoImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => {
                      console.log('✅ [Hero] Large logo loaded successfully');
                      setLogoImageLoaded(true);
                    }}
                    onError={(e) => {
                      console.error('❌ [Hero] Large logo failed to load:', logoSettings.logoUrl);
                      setLogoImageLoaded(true);
                    }}
                  />
                )}

                {/* Fallback text if logo fails */}
                <div className="hidden text-center">
                  <Flower2 className="h-24 w-24 text-peach-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 font-playfair">Francesco Fiori & Piante</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative animate-fade-in-right animate-stagger-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white via-peach-50 to-amber-50 p-8 hover-lift">
              {/* Hero image loading placeholder */}
              {!heroImageLoaded && (
                <div className="absolute inset-8 rounded-2xl bg-gradient-to-br from-peach-100 to-coral-100 animate-pulse flex items-center justify-center">
                  <Flower2 className="text-peach-300 animate-float" size={64} />
                </div>
              )}
              <img
                src={heroContent.backgroundImage}
                alt="Beautiful flower arrangement"
                className={`w-full h-96 md:h-[500px] object-cover rounded-2xl transition-opacity duration-700 hover-scale ${
                  heroImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => {
                  setHeroImageLoaded(true);
                }}
                onError={(e) => {
                  console.error(`❌ Hero image failed to load: ${e.currentTarget.src}`);
                  // Try fallback image
                  const fallbackImage = 'https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
                  if (e.currentTarget.src !== fallbackImage) {
                    e.currentTarget.src = fallbackImage;
                  } else {
                    setHeroImageLoaded(false);
                  }
                }}
              />
              <div className="absolute inset-8 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Text and Buttons */}
        <div className="text-center space-y-8 animate-fade-in-up animate-stagger-2 mt-12">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-gray-800 leading-tight animate-scale-in">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-peach-500 via-coral-500 to-peach-600 animate-shimmer">
                {heroContent.heading}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-inter font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-1">
              {heroContent.subheading}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4 animate-fade-in-up animate-stagger-2">
            <button className="group bg-gradient-to-r from-peach-500 via-coral-500 to-peach-600 text-white px-10 py-4 rounded-full font-semibold font-inter hover:from-peach-600 hover:via-coral-600 hover:to-peach-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover-lift animate-pulse-glow">
              <span className="flex items-center justify-center space-x-2">
                <span>Shop Flowers</span>
                <Flower2 className="group-hover:animate-bloom" size={18} />
              </span>
            </button>
            <button className="group bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-10 py-4 rounded-full font-semibold font-inter hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover-lift animate-bounce-gentle">
              <span className="flex items-center justify-center space-x-2">
                <span>Browse Plants</span>
                <Flower2 className="group-hover:animate-bloom" size={18} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
