import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Loader2, Database, RefreshCw } from 'lucide-react';
// initializeDatabase import removed to prevent accidental initialization
import ContentEditor from '@/components/admin/ContentEditor';
import TextContentEditor from '@/components/admin/TextContentEditor';
// OrderManagement moved to dedicated OrderDashboard page
import CategoriesGalleryAdmin from '@/components/admin/CategoriesGalleryAdmin';
import ProductsAdmin from '@/components/admin/ProductsAdmin';
import LogoEditor from '@/components/admin/LogoEditor';
import ShippingZoneManager from '@/components/admin/ShippingZoneManager';
// CategoryPicturesManager removed - using CategoriesGalleryAdmin instead
import StripeSettings from '@/components/admin/StripeSettings';
import SoundManager from '@/components/SoundManager';

import HeroDebugger from '@/components/admin/HeroDebugger';
import HeroContentEditor from '@/components/admin/HeroContentEditor';
import ContactInfoEditor from '@/components/admin/ContactInfoEditor';
import HeroImageFixer from '@/components/admin/HeroImageFixer';

// import TestOrderButton from '@/components/TestOrderButton';
import { testDatabaseConnection } from '@/utils/initializeDatabase';


interface ContentSection {
  id: string;
  section_key: string;
  section_name: string;
  content_type: string;
  content_value: string | null;
  metadata: any;
  is_active: boolean;
}

const Admin = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState<string | null>(null);
  // isInitializing state removed since initialization buttons were removed
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { data: contentSections, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['content-sections'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('content_sections')
          .select('*')
          .order('section_key');

        if (error) {
          console.error('[Admin] Database error:', error);
          return [] as ContentSection[];
        }

        return data as ContentSection[] || [];
      } catch (error) {
        console.error('[Admin] Query error:', error);
        return [] as ContentSection[];
      }
    },
    retry: false,
    enabled: true,
    staleTime: 0,
    cacheTime: 0
  });


  const updateContent = async (id: string, value: string) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('content_sections')
        .update({ content_value: value })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isConnected = await testDatabaseConnection();
      if (isConnected) {
        toast({
          title: 'Connection Success! ✅',
          description: 'Database connection is working properly',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Unable to connect to database. Check console for details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[Admin] Connection test error:', error);
      toast({
        title: 'Connection Error',
        description: `Connection test failed: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Removed handleInitializeDatabase function to prevent accidental recreation of default content

  const initializeCategoryPictures = async () => {
    try {
      // No default pictures to prevent automatic recreation after deletion
      const defaultPictures = [];

      const { error } = await supabase
        .from('category_pictures')
        .upsert(defaultPictures, { onConflict: 'position' });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category pictures initialized with default images',
      });
    } catch (error) {
      console.error('Error initializing category pictures:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize category pictures',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento pannello amministrativo...</p>
        </div>
      </div>
    );
  }

  // Handle query errors gracefully
  if (queryError) {
    console.error('[Admin] Query error detected:', queryError);
  }

  const groupedSections = contentSections?.reduce((acc, section) => {
    const sectionGroup = section.metadata?.section || 'other';
    if (!acc[sectionGroup]) acc[sectionGroup] = [];
    acc[sectionGroup].push(section);
    return acc;
  }, {} as Record<string, ContentSection[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 animate-fade-in-up">
      {/* Mobile-first header with proper spacing */}
      <div className="pt-16 md:pt-20 pb-4 md:pb-8">
        <div className="container mx-auto px-3 md:px-4">
          <div className="mb-4 md:mb-8 animate-fade-in-down">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="text-center md:text-left animate-fade-in-left">
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('adminPanel')}
                </h1>
                <p className="text-xs md:text-base text-gray-600">Gestisci tutti i contenuti del sito web, testi, immagini e ordini</p>
              </div>

              {/* Mobile-optimized action buttons */}
              <div className="grid grid-cols-3 gap-2 md:flex md:flex-row md:gap-2 md:justify-center lg:justify-end animate-fade-in-right">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="flex flex-col md:flex-row items-center gap-1 md:gap-2 hover-lift text-xs p-2 md:p-3"
                  size="sm"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      <span className="text-xs">Test...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="text-xs md:text-sm">Test</span>
                    </>
                  )}
                </Button>
                {/* Initialize Database button removed to prevent accidental recreation of default content */}
                {/* Initialize Category Pictures button removed to prevent accidental recreation of default images */}
              </div>
            </div>
          </div>

        {/* Show warning if there are database issues */}
        {(queryError || !contentSections || contentSections.length === 0) && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6 animate-slide-in-up shadow-lg">
            <h3 className="text-yellow-800 font-medium mb-2 text-sm md:text-base">Avviso Database</h3>
            <p className="text-yellow-700 text-xs md:text-sm mb-3">
              {queryError
                ? `Problema di connessione al database: ${queryError.message}. Alcune funzionalità potrebbero non funzionare correttamente.`
                : 'Nessuna sezione di contenuto trovata. Potrebbe essere necessario inizializzare il database.'
              }
            </p>
            {/* Initialize Database button removed to prevent accidental recreation of default content */}
          </div>
        )}

        <Tabs defaultValue="phone" className="space-y-3 md:space-y-6 animate-scale-in">
          {/* Mobile-first Card-based Navigation */}
          <div className="block md:hidden">
            {/* Mobile Card Grid Navigation */}
            <TabsList className="grid grid-cols-2 gap-2 mb-4 h-auto bg-transparent p-0">
              <TabsTrigger value="phone" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 transition-all duration-200 hover-scale data-[state=active]:bg-blue-100">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📞</span>
                </div>
                <span className="text-xs font-medium text-gray-700">Telefono</span>
              </TabsTrigger>
              <TabsTrigger value="hero" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-purple-200 hover:bg-purple-50 transition-all duration-200 hover-scale data-[state=active]:bg-purple-100">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🏠</span>
                </div>
                <span className="text-xs font-medium text-gray-700">Hero</span>
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-green-200 hover:bg-green-50 transition-all duration-200 hover-scale data-[state=active]:bg-green-100">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🎨</span>
                </div>
                <span className="text-xs font-medium text-gray-700">Logo</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-orange-200 hover:bg-orange-50 transition-all duration-200 hover-scale data-[state=active]:bg-orange-100">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">📂</span>
                </div>
                <span className="text-xs font-medium text-gray-700">Categorie</span>
              </TabsTrigger>
              <TabsTrigger value="category-pics" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-pink-200 hover:bg-pink-50 transition-all duration-200 hover-scale data-[state=active]:bg-pink-100">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-pink-600 text-sm">🖼️</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('pictures')}</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 transition-all duration-200 hover-scale data-[state=active]:bg-indigo-100">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm">🌸</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('products')}</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-teal-200 hover:bg-teal-50 transition-all duration-200 hover-scale data-[state=active]:bg-teal-100">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-600 text-sm">🎭</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('gallery')}</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-cyan-200 hover:bg-cyan-50 transition-all duration-200 hover-scale data-[state=active]:bg-cyan-100">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <span className="text-cyan-600 text-sm">ℹ️</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('about')}</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-red-200 hover:bg-red-50 transition-all duration-200 hover-scale data-[state=active]:bg-red-100">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">📋</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('orders')}</span>
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-yellow-200 hover:bg-yellow-50 transition-all duration-200 hover-scale data-[state=active]:bg-yellow-100">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">🚚</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('shipping')}</span>
              </TabsTrigger>
              <TabsTrigger value="stripe" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-violet-200 hover:bg-violet-50 transition-all duration-200 hover-scale data-[state=active]:bg-violet-100">
                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 text-sm">💳</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('stripe')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex flex-col items-center gap-2 p-3 bg-white/90 rounded-lg shadow-sm border border-rose-200 hover:bg-rose-50 transition-all duration-200 hover-scale data-[state=active]:bg-rose-100">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                  <span className="text-rose-600 text-sm">🎵</span>
                </div>
                <span className="text-xs font-medium text-gray-700">{t('music')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Desktop Horizontal Tabs */}
          <div className="hidden md:block">
            <TabsList className="grid grid-cols-6 lg:grid-cols-12 w-full gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
              <TabsTrigger value="phone" className="text-sm px-3 py-2 hover-scale">Telefono</TabsTrigger>
              <TabsTrigger value="hero" className="text-sm px-3 py-2 hover-scale">Hero</TabsTrigger>
              <TabsTrigger value="logo" className="text-sm px-3 py-2 hover-scale">Logo</TabsTrigger>
              <TabsTrigger value="categories" className="text-sm px-3 py-2 hover-scale">Categorie</TabsTrigger>
              <TabsTrigger value="category-pics" className="text-sm px-3 py-2 hover-scale">{t('pictures')}</TabsTrigger>
              <TabsTrigger value="products" className="text-sm px-3 py-2 hover-scale">{t('products')}</TabsTrigger>
              <TabsTrigger value="gallery" className="text-sm px-3 py-2 hover-scale">{t('gallery')}</TabsTrigger>
              <TabsTrigger value="about" className="text-sm px-3 py-2 hover-scale">{t('about')}</TabsTrigger>
              <TabsTrigger value="orders" className="text-sm px-3 py-2 hover-scale">{t('orders')}</TabsTrigger>
              <TabsTrigger value="shipping" className="text-sm px-3 py-2 hover-scale">{t('shipping')}</TabsTrigger>
              <TabsTrigger value="stripe" className="text-sm px-3 py-2 hover-scale">{t('stripe')}</TabsTrigger>
              <TabsTrigger value="notifications" className="text-sm px-3 py-2 hover-scale">{t('music')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="phone" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="animate-fade-in-right animate-stagger-1">
              <ContactInfoEditor />
            </div>
          </TabsContent>

          <TabsContent value="hero" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-purple-100">
              <h2 className="text-base md:text-2xl font-semibold mb-2 md:mb-4 text-purple-800 animate-fade-in-left">{t('heroSectionContent')}</h2>
              <div className="space-y-3 md:space-y-4 animate-fade-in-right">
                <div className="animate-stagger-1"><HeroImageFixer /></div>
                <div className="animate-stagger-2"><HeroContentEditor /></div>
                <div className="animate-stagger-3"><HeroDebugger /></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logo" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-green-100">
              <h2 className="text-base md:text-2xl font-semibold mb-2 md:mb-4 text-green-800 animate-fade-in-left">{t('logoSettings')}</h2>
              <div className="animate-fade-in-right animate-stagger-1">
                <LogoEditor />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-orange-100">
              <h2 className="text-base md:text-2xl font-semibold mb-2 md:mb-4 text-orange-800 animate-fade-in-left">{t('categoriesContent')}</h2>
              <div className="space-y-3 md:space-y-4">
                {groupedSections?.categories?.map((section, index) => (
                  <div key={section.id} className={`animate-fade-in-right animate-stagger-${Math.min(index + 1, 5)}`}>
                    <ContentEditor
                      section={section}
                      onSave={updateContent}
                      saving={saving === section.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="category-pics" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-pink-100">
              <div className="animate-scale-in">
                <CategoriesGalleryAdmin />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-indigo-100">
              <div className="animate-slide-in-up">
                <ProductsAdmin />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-teal-100">
              <div className="animate-scale-in">
                <MainGalleryManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-cyan-100">
              <h2 className="text-base md:text-2xl font-semibold mb-2 md:mb-4 text-cyan-800 animate-fade-in-left">About Section Content</h2>
              <div className="space-y-3 md:space-y-4">
                {groupedSections?.about?.map((section, index) => (
                  <div key={section.id} className={`animate-fade-in-right animate-stagger-${Math.min(index + 1, 5)}`}>
                    <TextContentEditor
                      section={section}
                      onSave={updateContent}
                      saving={saving === section.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-red-100">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-4">📱 {t('dedicatedOrderDashboard')}</h2>
                <p className="text-gray-600 mb-6">
                  {t('orderManagementMoved')}
                </p>
                <ul className="text-left text-sm text-gray-600 mb-6 space-y-2 max-w-md mx-auto">
                  <li>✅ {t('realTimeNotifications')}</li>
                  <li>✅ {t('backgroundProcessing')}</li>
                  <li>✅ {t('comprehensiveSystemTesting')}</li>
                  <li>✅ {t('enhancedMobileExperience')}</li>
                  <li>✅ {t('persistentNotifications')}</li>
                </ul>
                <a
                  href="/orders"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🚀 {t('openOrderDashboard')}
                </a>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-yellow-100">
              <div className="animate-scale-in">
                <ShippingZoneManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stripe" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-violet-100">
              <div className="animate-fade-in-right">
                <StripeSettings />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-2 md:space-y-4 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-6 shadow-lg border border-rose-100">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-rose-800 animate-fade-in-left flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <span className="text-rose-600 text-xl">🔔</span>
                </div>
                Gestione Suoni di Notifica
              </h2>
              <SoundManager />
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">{t('allContentSections')}</h2>
            {contentSections?.map(section => (
              <ContentEditor
                key={section.id}
                section={section}
                onSave={updateContent}
                saving={saving === section.id}
              />
            ))}
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
