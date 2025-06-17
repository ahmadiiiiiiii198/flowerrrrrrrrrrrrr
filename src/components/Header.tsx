import React, { useState } from 'react';
import { ShoppingCart, Flower2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSelector from '@/components/LanguageSelector';

const Header = () => {
  // Use static logo settings to avoid hook issues
  const logoSettings = {
    logoUrl: "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png",
    altText: "Francesco Fiori & Piante Logo",
  };

  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Static translations to avoid hook errors
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'home': 'Home',
      'specialties': 'Categorie',
      'menu': 'Prodotti',
      'gallery': 'Galleria',
      'about': 'Chi Siamo',
      'makeReservation': 'Fai un Ordine'
    };
    return translations[key] || key;
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-peach-100 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 animate-fade-in-left">
            <div className="flex items-center space-x-3 logo-container hover-scale">
              {/* Logo loading placeholder */}
              {(!logoLoaded && !logoError) && (
                <div className="h-12 w-12 bg-gradient-to-br from-peach-100 to-coral-100 rounded animate-pulse flex items-center justify-center">
                  <Flower2 className="text-peach-400 animate-bounce" size={20} />
                </div>
              )}

              {/* Actual logo */}
              {!logoError && (
                <img
                  src={logoSettings.logoUrl}
                  alt={logoSettings.altText}
                  className={`h-12 w-auto logo-smooth-load animate-scale-in hover-glow transition-opacity duration-300 ${
                    logoLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={(e) => {
                    console.log('✅ [Header] Logo loaded successfully');
                    e.currentTarget.classList.add('loaded');
                    setLogoLoaded(true);
                  }}
                  onError={(e) => {
                    console.error('❌ [Header] Logo failed to load:', logoSettings.logoUrl);
                    setLogoError(true);
                  }}
                />
              )}

              {/* Fallback text logo */}
              {logoError && (
                <div className="h-12 flex items-center px-3 bg-gradient-to-r from-peach-500 to-coral-500 text-white rounded-lg font-bold text-sm">
                  Francesco Fiori
                </div>
              )}
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-peach-500 transition-colors font-medium font-inter relative group animate-fade-in-up animate-stagger-1 hover-scale">
                {t('home')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-peach-500 to-coral-500 transition-all duration-300 group-hover:w-full animate-shimmer"></span>
              </a>
              <a href="/#categories" className="text-gray-700 hover:text-coral-500 transition-colors font-medium font-inter relative group animate-fade-in-up animate-stagger-2 hover-scale">
                {t('specialties')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-coral-500 to-peach-500 transition-all duration-300 group-hover:w-full animate-shimmer"></span>
              </a>
              <Link to="/menu" className="text-gray-700 hover:text-emerald-500 transition-colors font-medium font-inter relative group animate-fade-in-up animate-stagger-3 hover-scale">
                {t('menu')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300 group-hover:w-full animate-shimmer"></span>
              </Link>
              <a href="/#gallery" className="text-gray-700 hover:text-amber-500 transition-colors font-medium font-inter relative group animate-fade-in-up animate-stagger-4 hover-scale">
                {t('gallery')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 group-hover:w-full animate-shimmer"></span>
              </a>
              <a href="/#about" className="text-gray-700 hover:text-peach-500 transition-colors font-medium font-inter relative group animate-fade-in-up animate-stagger-5 hover-scale">
                {t('about')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-peach-500 to-coral-500 transition-all duration-300 group-hover:w-full animate-shimmer"></span>
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4 animate-fade-in-right">
            <div className="animate-scale-in animate-stagger-1">
              <LanguageSelector />
            </div>
            <Link
              to="/order"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peach-500 to-coral-500 text-white rounded-full hover:from-peach-600 hover:to-coral-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium hover-lift animate-pulse-glow animate-scale-in animate-stagger-2"
            >
              <Plus size={16} className="animate-wiggle" />
              {t('makeReservation')}
            </Link>
            <button className="relative p-3 text-gray-700 hover:text-peach-600 transition-colors bg-gradient-to-br from-peach-50 to-amber-50 hover:from-peach-100 hover:to-amber-100 rounded-full group shadow-md hover:shadow-lg hover-lift animate-bounce-gentle animate-scale-in animate-stagger-3">
              <ShoppingCart size={20} className="group-hover:animate-wiggle" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-coral-500 to-peach-500 text-white text-xs rounded-full flex items-center justify-center font-inter font-semibold shadow-md animate-heartbeat">0</span>
              <Flower2 className="absolute -bottom-1 -right-1 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce animate-float" size={12} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
