import React, { useEffect, useState } from 'react';

const BackgroundInitializer: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      if (isInitialized || isInitializing) return;

      setIsInitializing(true);

      try {
        console.log('🚀 [BackgroundInitializer] Starting initialization...');

        // Dynamically import to avoid blocking the app if modules fail
        const { settingsService } = await import('@/services/settingsService');
        const { initializeDatabase } = await import('@/utils/initializeDatabase');

        // First, try to initialize the database structure with timeout
        const dbPromise = initializeDatabase();
        const dbTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database initialization timeout')), 15000);
        });

        try {
          const dbInitialized = await Promise.race([dbPromise, dbTimeout]);
          if (!dbInitialized) {
            console.warn('⚠️ [BackgroundInitializer] Database initialization returned false, but continuing...');
          }
        } catch (dbError) {
          console.warn('⚠️ [BackgroundInitializer] Database initialization failed, but continuing:', dbError);
        }

        // Then initialize the settings service with timeout
        const settingsPromise = settingsService.initialize();
        const settingsTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Settings initialization timeout')), 10000);
        });

        try {
          await Promise.race([settingsPromise, settingsTimeout]);
          console.log('✅ [BackgroundInitializer] Settings initialized successfully');
        } catch (settingsError) {
          console.warn('⚠️ [BackgroundInitializer] Settings initialization failed, but continuing:', settingsError);
        }

        console.log('✅ [BackgroundInitializer] Initialization completed');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ [BackgroundInitializer] Initialization failed:', error);

        // Don't block the app - let it continue with defaults
        setIsInitialized(true);
      } finally {
        setIsInitializing(false);
      }
    };

    // Add a small delay to let the app render first
    const timer = setTimeout(initializeApp, 100);

    return () => clearTimeout(timer);
  }, [isInitialized, isInitializing]);

  // This component doesn't render anything visible
  // It just handles initialization in the background
  return null;
};

export default BackgroundInitializer;
