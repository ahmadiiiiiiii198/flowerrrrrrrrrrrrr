
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

type Language = "it" | "en" | "fr" | "ar" | "fa";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Default translations for common phrases
const translations: Record<Language, Record<string, string>> = {
  it: {
    "home": "Home",
    "specialties": "Categorie",
    "about": "Chi Siamo",
    "menu": "Prodotti",
    "gallery": "Galleria",
    "reviews": "Recensioni",
    "contact": "Contatti",
    "discover": "Scopri",
    "ourSpecialties": "Le Nostre Categorie",
    "reservations": "Ordini",
    "contactUs": "Contattaci",
    "makeReservation": "Fai un Ordine",
    "yourName": "Il Tuo Nome",
    "phoneNumber": "Numero di Telefono",
    "date": "Data",
    "time": "Ora",
    "numberOfGuests": "Quantità",
    "specialRequests": "Richieste Speciali",
    "requestReservation": "Invia Ordine",
    "processingRequest": "Elaborazione...",
    "findUs": "Trovaci",
    "address": "Indirizzo",
    "phoneContact": "Telefono",
    "emailContact": "Email",
    "hours": "Orari",
    "ourMenu": "I Nostri Prodotti",
    "menuDescription": "Esplora la nostra varietà di composizioni floreali e servizi",
    "downloadMenu": "Scarica Catalogo",
    "menuUnavailable": "Il catalogo PDF non è ancora disponibile",
    "menuComingSoon": "Il nostro catalogo completo sarà presto disponibile",
    "freshFlowers": "Fiori freschi per ogni occasione",
    "indoorOutdoorPlants": "Piante da interno ed esterno per decorare con la natura",
    "highQualityFakeFlowers": "Fiori finti di alta qualità, ideali per decorazioni durature",
    "tailorMadeServices": "Servizi floreali su misura per cerimonie, eventi e ambienti",
    "yearsExperience": "Anni di Esperienza",
    "happyCustomers": "Clienti Felici",
    "flowerVarieties": "Varietà di Fiori",
    // Admin Panel Translations
    "adminPanel": "Pannello Amministrativo",
    "phoneNumberUpdate": "Aggiornamento Numero di Telefono",
    "heroSectionContent": "Contenuto Sezione Hero",
    "logoSettings": "Impostazioni Logo",
    "categoriesContent": "Contenuto Categorie",
    "pictures": "Immagini",
    "products": "Prodotti",
    "orders": "Ordini",
    "shipping": "Spedizioni",
    "stripe": "Stripe",
    "music": "Musica",
    "saveChanges": "Salva Modifiche",
    "resetToDefault": "Ripristina Predefinito",
    "alternativeText": "Testo Alternativo",
    "describeLogoForScreenReaders": "Descrivi il tuo logo per i lettori di schermo",
    "accessibilityAndSeoHelp": "Questo testo aiuta con l'accessibilità e la SEO",
    "languageAndAuthentication": "Lingua e Autenticazione",
    "defaultLanguage": "Lingua Predefinita",
    "selectLanguage": "Seleziona lingua",
    "italian": "Italiano",
    "english": "Inglese",
    "french": "Francese",
    "arabic": "Arabo",
    "farsi": "Farsi",
    "updatingCredentials": "Aggiornamento...",
    "updateCredentials": "Aggiorna Credenziali",
    "defaultCredentialsNote": "Nota: Le credenziali predefinite sono username: \"admin\", password: \"persian123\"",
    "logoUpdated": "Logo aggiornato",
    "logoUpdatedDescription": "Il logo del tuo sito web è stato modificato",
    "logoUpdatedLocally": "Logo aggiornato localmente",
    "logoUpdatedLocallyDescription": "Impostazioni salvate localmente e sincronizzate quando la connessione sarà ripristinata",
    "dedicatedOrderDashboard": "Dashboard Ordini Dedicata",
    "orderManagementMoved": "La gestione degli ordini è stata spostata in una dashboard dedicata con funzionalità avanzate:",
    "realTimeNotifications": "Notifiche in tempo reale anche quando lo schermo è spento",
    "backgroundProcessing": "Elaborazione e sincronizzazione in background",
    "comprehensiveSystemTesting": "Test completi del sistema",
    "enhancedMobileExperience": "Esperienza mobile migliorata",
    "persistentNotifications": "Notifiche persistenti",
    "openOrderDashboard": "Apri Dashboard Ordini",
    "allContentSections": "Tutte le Sezioni di Contenuto",
    // Order Dashboard Translations
    "orderDashboard": "Dashboard Ordini",
    "realTimeOrderManagement": "Gestione ordini in tempo reale e notifiche",
    "online": "Online",
    "offline": "Offline",
    "soundOn": "Audio Attivo",
    "soundOff": "Audio Disattivo",
    "testSound": "Test Audio",
    "stopRinging": "Ferma Suoneria",
    "refresh": "Aggiorna",
    "lastUpdatedDashboard": "Ultimo aggiornamento",
    "totalOrders": "Ordini Totali",
    "pending": "In Attesa",
    "accepted": "Accettati",
    "completed": "Completati",
    "today": "Oggi",
    "revenue": "Ricavi",
    "loadingOrderDashboard": "Caricamento Dashboard Ordini...",
    "dashboard": "Dashboard",
    "systemTesting": "Test di Sistema",
    "recentOrders": "Ordini Recenti",
    "allOrders": "Tutti gli Ordini",
    "orderDetails": "Dettagli Ordine",
    "selectOrderToView": "Seleziona un ordine per visualizzare i dettagli",
    "noOrdersFound": "Nessun ordine trovato",
    "createFirstOrder": "Crea il tuo primo ordine dal sito web",
    "newOrderReceived": "NUOVO ORDINE RICEVUTO!",
    "orderPaymentCompleted": "PAGAMENTO ORDINE COMPLETATO!",
    "backOnline": "Torna Online",
    "connectionRestored": "Connessione ripristinata. Sincronizzazione dati...",
    "connectionLost": "Connessione Persa",
    "workingOffline": "Lavoro offline. Sincronizzerà quando la connessione sarà ripristinata.",
    "notificationsEnabled": "Notifiche Abilitate",
    "browserNotificationsEnabled": "Riceverai notifiche del browser per i nuovi ordini",
    "backgroundServiceStarted": "Servizio in Background Avviato",
    "backgroundMonitoringActive": "Monitoraggio in background attivo (notifiche gestite dalla dashboard)",
    "backgroundServiceWarning": "Avviso Servizio in Background",
    "notificationFeaturesMayNotWork": "Alcune funzionalità di notifica potrebbero non funzionare correttamente",
    "soundDisabled": "Audio Disabilitato",
    "soundEnabled": "Audio Abilitato",
    "orderNotificationsSilent": "Le notifiche degli ordini saranno silenziose",
    "orderNotificationsSound": "Le notifiche degli ordini riprodurranno un suono",
    "testingNotificationSound": "Test Audio Notifica",
    "playingTestNotification": "Riproduzione notifica di test per l'ordine TEST-001",
    // Order Details Translations
    "customerInformation": "Informazioni Cliente",
    "name": "Nome",
    "email": "Email",
    "phone": "Telefono",
    "orderInformation": "Informazioni Ordine",
    "totalAmount": "Importo Totale",
    "created": "Creato",
    "lastUpdated": "Ultimo Aggiornamento",
    "trackingNumber": "Numero di Tracciamento",
    "shipped": "Spedito",
    "delivered": "Consegnato",
    "updateOrderStatus": "Aggiorna Stato Ordine",
    "status": "Stato",
    "selectStatus": "Seleziona stato",
    "processing": "In Elaborazione",
    "cancelled": "Annullato",
    "rejected": "Rifiutato",
    "addTrackingNumber": "Aggiungi Numero di Tracciamento",
    "trackingNumberOptional": "Numero di tracciamento (opzionale)",
    "addNotes": "Aggiungi Note",
    "notesOptional": "Note aggiuntive (opzionale)",
    "updateOrder": "Aggiorna Ordine",
    "updating": "Aggiornamento...",
    "orderUpdated": "Ordine Aggiornato",
    "orderUpdatedSuccessfully": "L'ordine è stato aggiornato con successo",
    "updateFailed": "Aggiornamento Fallito",
    "failedToUpdateOrder": "Impossibile aggiornare l'ordine",
    "deleteOrder": "Elimina Ordine",
    "confirmDeleteOrder": "Sei sicuro di voler eliminare questo ordine? Questa azione non può essere annullata.",
    "orderDeleted": "Ordine Eliminato",
    "orderDeletedSuccessfully": "L'ordine è stato eliminato con successo",
    "deleteFailed": "Eliminazione Fallita",
    "failedToDeleteOrder": "Impossibile eliminare l'ordine"
  },
  en: {
    "home": "Home",
    "specialties": "Categories",
    "about": "About",
    "menu": "Products",
    "gallery": "Gallery",
    "reviews": "Reviews",
    "contact": "Contact",
    "discover": "Discover",
    "ourSpecialties": "Our Categories",
    "reservations": "Orders",
    "contactUs": "Contact Us",
    "makeReservation": "Place an Order",
    "yourName": "Your Name",
    "phoneNumber": "Phone Number",
    "date": "Date",
    "time": "Time",
    "numberOfGuests": "Quantity",
    "specialRequests": "Special Requests",
    "requestReservation": "Submit Order",
    "processingRequest": "Processing...",
    "findUs": "Find Us",
    "address": "Address",
    "phone": "Phone",
    "email": "Email",
    "hours": "Hours",
    "ourMenu": "Our Products",
    "menuDescription": "Explore our diverse selection of floral arrangements and services",
    "downloadMenu": "Download Catalog",
    "menuUnavailable": "Product catalog PDF is not available yet",
    "menuComingSoon": "Our complete catalog will be available soon",
  },
  fr: {
    "home": "Accueil",
    "specialties": "Catégories",
    "about": "À Propos",
    "menu": "Produits",
    "gallery": "Galerie",
    "reviews": "Avis",
    "contact": "Contact",
    "discover": "Découvrir",
    "ourSpecialties": "Nos Catégories",
    "reservations": "Commandes",
    "contactUs": "Nous Contacter",
    "makeReservation": "Passer Commande",
    "yourName": "Votre Nom",
    "phoneNumber": "Numéro de Téléphone",
    "date": "Date",
    "time": "Heure",
    "numberOfGuests": "Quantité",
    "specialRequests": "Demandes Spéciales",
    "requestReservation": "Envoyer Commande",
    "processingRequest": "Traitement...",
    "findUs": "Nous Trouver",
    "address": "Adresse",
    "phone": "Téléphone",
    "email": "Email",
    "hours": "Horaires",
    "ourMenu": "Nos Produits",
    "menuDescription": "Explorez notre sélection variée d'arrangements floraux et services",
    "downloadMenu": "Télécharger Catalogue",
    "menuUnavailable": "Le catalogue PDF n'est pas encore disponible",
    "menuComingSoon": "Notre catalogue complet sera bientôt disponible",
  },
  ar: {
    "home": "الرئيسية",
    "specialties": "الفئات",
    "about": "من نحن",
    "menu": "المنتجات",
    "gallery": "المعرض",
    "reviews": "التقييمات",
    "contact": "اتصل بنا",
    "discover": "اكتشف",
    "ourSpecialties": "فئاتنا",
    "reservations": "الطلبات",
    "contactUs": "اتصل بنا",
    "makeReservation": "اطلب الآن",
    "yourName": "اسمك",
    "phoneNumber": "رقم الهاتف",
    "date": "التاريخ",
    "time": "الوقت",
    "numberOfGuests": "الكمية",
    "specialRequests": "طلبات خاصة",
    "requestReservation": "إرسال الطلب",
    "processingRequest": "جاري المعالجة...",
    "findUs": "جدنا",
    "address": "العنوان",
    "phone": "الهاتف",
    "email": "البريد الإلكتروني",
    "hours": "ساعات العمل",
    "ourMenu": "منتجاتنا",
    "menuDescription": "استكشف مجموعتنا المتنوعة من التنسيقات الزهرية والخدمات",
    "downloadMenu": "تحميل الكتالوج",
    "menuUnavailable": "كتالوج المنتجات PDF غير متوفر بعد",
    "menuComingSoon": "سيكون كتالوجنا الكامل متاحًا قريبًا",
  },
  fa: {
    "home": "خانه",
    "specialties": "دسته‌بندی‌ها",
    "about": "درباره ما",
    "menu": "محصولات",
    "gallery": "گالری",
    "reviews": "نظرات",
    "contact": "تماس با ما",
    "discover": "کشف کنید",
    "ourSpecialties": "دسته‌بندی‌های ما",
    "reservations": "سفارشات",
    "contactUs": "با ما تماس بگیرید",
    "makeReservation": "ثبت سفارش",
    "yourName": "نام شما",
    "phoneNumber": "شماره تلفن",
    "date": "تاریخ",
    "time": "زمان",
    "numberOfGuests": "تعداد",
    "specialRequests": "درخواست های خاص",
    "requestReservation": "ارسال سفارش",
    "processingRequest": "در حال پردازش...",
    "findUs": "ما را پیدا کنید",
    "address": "آدرس",
    "phone": "تلفن",
    "email": "ایمیل",
    "hours": "ساعات کاری",
    "ourMenu": "محصولات ما",
    "menuDescription": "مجموعه متنوعی از تنظیمات گل و خدمات ما را کاوش کنید",
    "downloadMenu": "دانلود کاتالوگ",
    "menuUnavailable": "کاتالوگ محصولات PDF هنوز در دسترس نیست",
    "menuComingSoon": "کاتالوگ کامل ما به زودی در دسترس خواهد بود",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("it"); // Default to Italian
  
  useEffect(() => {
    // Initialize default language settings if they don't exist
    const savedSettings = localStorage.getItem('flowerShopSettings');
    if (!savedSettings) {
      const defaultSettings = {
        totalSeats: 50,
        reservationDuration: 120,
        openingTime: "08:00",
        closingTime: "19:00",
        languages: ["it", "en", "fr", "ar", "fa"],
        defaultLanguage: "it"
      };
      localStorage.setItem('flowerShopSettings', JSON.stringify(defaultSettings));
    } else {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.defaultLanguage) {
          setLanguageState(parsedSettings.defaultLanguage as Language);
        }
      } catch (e) {
        console.error('Failed to parse settings for language');
      }
    }
    
    // Set the html lang attribute
    document.documentElement.lang = language;
    
    // Set RTL for Arabic and Persian
    if (language === "ar" || language === "fa") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Update settings in localStorage
    const savedSettings = localStorage.getItem('flowerShopSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.defaultLanguage = lang;
        localStorage.setItem('flowerShopSettings', JSON.stringify(parsedSettings));
      } catch (e) {
        console.error('Failed to update language setting');
      }
    }
  };

  const t = (key: string) => {
    return translations[language][key] || translations.en[key] || key;
  };

  const value = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
