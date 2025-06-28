
import React, { useState, useEffect } from "react";
import { Menu, X, Utensils, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/hooks/use-language";
import BackgroundMusic from "@/components/BackgroundMusic";
import { useLogoSettings } from "@/hooks/use-settings";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  const [logoSettings, , isLogoLoading] = useLogoSettings();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const scrollToSection = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-persian-navy bg-opacity-95 text-white py-2 shadow-md" : "bg-persian-navy/80 backdrop-blur-sm py-4"}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <div className="relative logo-container">
            <img
              src={logoSettings.logoUrl}
              alt={logoSettings.altText}
              className="h-10 w-10 sm:h-14 sm:w-14 rounded-full shadow-md border-2 border-persian-gold/30 logo-smooth-load"
              onLoad={(e) => {
                e.currentTarget.classList.add('loaded');
              }}
            />
            <div className="absolute -inset-1 rounded-full bg-persian-gold/20 blur-sm -z-10"></div>
          </div>
          {/* Only hide the text on mobile, show on desktop */}
          <span className="hidden sm:block text-xl sm:text-2xl font-playfair font-bold text-persian-gold">
            Francesco Fiori & Piante
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <a href="/" className="hover:text-persian-gold transition-colors">
            {t('home')}
          </a>
          <a
            href="/#categories"
            className="hover:text-persian-gold transition-colors"
            onClick={(e) => scrollToSection('categories', e)}
          >
            {t('categories')}
          </a>
          <a
            href="/#products"
            className="hover:text-persian-gold transition-colors"
            onClick={(e) => scrollToSection('products', e)}
          >
            {t('products')}
          </a>
          <a
            href="/#about"
            className="hover:text-persian-gold transition-colors"
            onClick={(e) => scrollToSection('about', e)}
          >
            {t('about')}
          </a>
          <a
            href="/#contact"
            className="hover:text-persian-gold transition-colors"
            onClick={(e) => scrollToSection('contact', e)}
          >
            {t('contact')}
          </a>
          <div className="flex items-center gap-2">
            <Button
              className="bg-persian-gold text-persian-navy hover:bg-persian-gold/90 flex items-center gap-2"
              onClick={(e) => scrollToSection('contact', e)}
            >
              <Utensils size={16} />
              {t('makeReservation')}
            </Button>
          </div>
          <BackgroundMusic />
          <LanguageSelector />
        </div>

        {/* Mobile Menu Button - adjusted spacing */}
        <div className="md:hidden flex items-center gap-1">
          <BackgroundMusic />
          <LanguageSelector />
          <button className="text-persian-gold p-1" onClick={toggleMenu}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-persian-navy bg-opacity-95 py-4">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <a href="/" className="text-white hover:text-persian-gold transition-colors" onClick={toggleMenu}>
              {t('home')}
            </a>
            <a
              href="/#categories"
              className="text-white hover:text-persian-gold transition-colors"
              onClick={(e) => scrollToSection('categories', e)}
            >
              {t('categories')}
            </a>
            <a
              href="/#products"
              className="text-white hover:text-persian-gold transition-colors"
              onClick={(e) => scrollToSection('products', e)}
            >
              {t('products')}
            </a>
            <a
              href="/#about"
              className="text-white hover:text-persian-gold transition-colors"
              onClick={(e) => scrollToSection('about', e)}
            >
              {t('about')}
            </a>
            <a
              href="/#contact"
              className="text-white hover:text-persian-gold transition-colors"
              onClick={(e) => scrollToSection('contact', e)}
            >
              {t('contact')}
            </a>
            <Button
              className="bg-persian-gold text-persian-navy hover:bg-persian-gold/90 w-full flex items-center justify-center gap-2"
              onClick={(e) => scrollToSection('contact', e)}
            >
              <Utensils size={16} />
              {t('makeReservation')}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
