import React, { useState, useEffect } from 'react';
import { settingsService } from '@/services/settingsService';

const LogoLoadingTest = () => {
  const [logoSettings, setLogoSettings] = useState<any>(null);
  const [heroContent, setHeroContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [imageLoadStatus, setImageLoadStatus] = useState<{
    headerLogo: 'loading' | 'loaded' | 'error';
    heroLogo: 'loading' | 'loaded' | 'error';
    heroImage: 'loading' | 'loaded' | 'error';
  }>({
    headerLogo: 'loading',
    heroLogo: 'loading',
    heroImage: 'loading'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading logo and hero settings...');
      
      // Load logo settings
      const logoData = await settingsService.getSetting('logoSettings', {
        logoUrl: "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png",
        altText: "Francesco Fiori & Piante Logo"
      });
      
      // Load hero content
      const heroData = await settingsService.getSetting('heroContent', {
        heading: 'Francesco Fiori & Piante',
        subheading: 'Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿',
        backgroundImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
      });
      
      console.log('✅ Logo settings loaded:', logoData);
      console.log('✅ Hero content loaded:', heroData);
      
      setLogoSettings(logoData);
      setHeroContent(heroData);
      
    } catch (err) {
      console.error('❌ Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (type: keyof typeof imageLoadStatus) => {
    setImageLoadStatus(prev => ({ ...prev, [type]: 'loaded' }));
    console.log(`✅ ${type} loaded successfully`);
  };

  const handleImageError = (type: keyof typeof imageLoadStatus, src: string) => {
    setImageLoadStatus(prev => ({ ...prev, [type]: 'error' }));
    console.error(`❌ ${type} failed to load:`, src);
  };

  if (loading) {
    return (
      <div className="fixed top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border max-w-md">
        <h3 className="font-bold text-sm mb-2">Logo Loading Test</h3>
        <div className="text-sm text-blue-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border max-w-md">
      <h3 className="font-bold text-sm mb-2">Logo Loading Test</h3>
      
      {error && (
        <div className="text-red-600 bg-red-50 p-2 rounded mb-2 text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="space-y-3 text-xs">
        {/* Logo Settings Info */}
        <div className="bg-blue-50 p-2 rounded">
          <strong>Logo Settings:</strong>
          <div className="mt-1">
            URL: {logoSettings?.logoUrl ? '✅' : '❌'}<br/>
            Alt: {logoSettings?.altText || 'N/A'}
          </div>
        </div>

        {/* Hero Content Info */}
        <div className="bg-green-50 p-2 rounded">
          <strong>Hero Content:</strong>
          <div className="mt-1">
            Heading: {heroContent?.heading ? '✅' : '❌'}<br/>
            Background: {heroContent?.backgroundImage ? '✅' : '❌'}
          </div>
        </div>

        {/* Image Loading Status */}
        <div className="bg-yellow-50 p-2 rounded">
          <strong>Image Loading Status:</strong>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <span>Header Logo:</span>
              <span className={`px-1 py-0.5 rounded text-white text-xs ${
                imageLoadStatus.headerLogo === 'loading' ? 'bg-yellow-500' :
                imageLoadStatus.headerLogo === 'loaded' ? 'bg-green-500' :
                'bg-red-500'
              }`}>
                {imageLoadStatus.headerLogo.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Hero Logo:</span>
              <span className={`px-1 py-0.5 rounded text-white text-xs ${
                imageLoadStatus.heroLogo === 'loading' ? 'bg-yellow-500' :
                imageLoadStatus.heroLogo === 'loaded' ? 'bg-green-500' :
                'bg-red-500'
              }`}>
                {imageLoadStatus.heroLogo.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Hero Image:</span>
              <span className={`px-1 py-0.5 rounded text-white text-xs ${
                imageLoadStatus.heroImage === 'loading' ? 'bg-yellow-500' :
                imageLoadStatus.heroImage === 'loaded' ? 'bg-green-500' :
                'bg-red-500'
              }`}>
                {imageLoadStatus.heroImage.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Test Images */}
        <div className="bg-gray-50 p-2 rounded">
          <strong>Test Images:</strong>
          <div className="mt-2 space-y-2">
            {/* Header Logo Test */}
            {logoSettings?.logoUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={logoSettings.logoUrl}
                  alt="Header Logo Test"
                  className="h-8 w-auto"
                  onLoad={() => handleImageLoad('headerLogo')}
                  onError={() => handleImageError('headerLogo', logoSettings.logoUrl)}
                />
                <span className="text-xs">Header Logo</span>
              </div>
            )}

            {/* Hero Logo Test */}
            {logoSettings?.logoUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={logoSettings.logoUrl}
                  alt="Hero Logo Test"
                  className="h-12 w-auto"
                  onLoad={() => handleImageLoad('heroLogo')}
                  onError={() => handleImageError('heroLogo', logoSettings.logoUrl)}
                />
                <span className="text-xs">Hero Logo</span>
              </div>
            )}

            {/* Hero Background Test */}
            {heroContent?.backgroundImage && (
              <div className="flex items-center gap-2">
                <img
                  src={heroContent.backgroundImage}
                  alt="Hero Background Test"
                  className="h-8 w-12 object-cover rounded"
                  onLoad={() => handleImageLoad('heroImage')}
                  onError={() => handleImageError('heroImage', heroContent.backgroundImage)}
                />
                <span className="text-xs">Hero Background</span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={loadSettings}
          className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
        >
          Reload Settings
        </button>
      </div>
    </div>
  );
};

export default LogoLoadingTest;
