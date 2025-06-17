
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Products from "@/components/Products";
import { useLanguage } from "@/hooks/use-language";

// Create a wrapper component that uses the hooks inside the LanguageProvider
const MenuPageContent = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-peach-50/30 via-white to-amber-50/30">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-emerald-500/10 to-peach-500/10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-4 text-gray-800">
              {t('ourMenu')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t('menuDescription')}
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mx-auto rounded-full"></div>
          </div>
        </section>

        {/* Products Section */}
        <Products />
      </main>
      <Footer />
    </div>
  );
};

// Main component - LanguageProvider is now in App.tsx
const MenuPage = () => {
  return <MenuPageContent />;
};

export default MenuPage;
