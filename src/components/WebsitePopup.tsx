
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface PopupData {
  id: string;
  title: string;
  content: string;
  image?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

const WebsitePopup: React.FC = () => {
  const [activePopup, setActivePopup] = useState<PopupData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if we're on admin page to prevent popup
  useEffect(() => {
    const path = window.location.pathname;
    setIsAdmin(path.includes('/admin'));
    
    // Don't show popups on admin page
    if (path.includes('/admin')) {
      return;
    }
    
    // Load popup after a short delay to prioritize main content rendering
    const timer = setTimeout(() => {
      loadActivePopup();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const loadActivePopup = async () => {
    try {
      // Try to load popups from localStorage first for speed
      let allPopups: PopupData[] = [];
      const storedPopups = localStorage.getItem('popups');
      
      if (storedPopups) {
        try {
          allPopups = JSON.parse(storedPopups);
          console.log("Loaded popups from localStorage:", allPopups);
        } catch (e) {
          console.error('Error parsing popups:', e);
        }
      } 
      
      // If no popups in localStorage, try Supabase
      if (allPopups.length === 0) {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'popups')
          .maybeSingle();
          
        if (data && !error) {
          // Use proper type assertion to convert the JSON data to PopupData[]
          const popupsValue = data.value as unknown;
          allPopups = Array.isArray(popupsValue) ? popupsValue as PopupData[] : [];
          console.log("Loaded popups from Supabase:", allPopups);
          
          // Save to localStorage for faster access next time
          localStorage.setItem('popups', JSON.stringify(allPopups));
        }
      }
      
      if (allPopups.length === 0) {
        return;
      }
      
      // Filter active popups
      const today = new Date();
      const activePopups = allPopups.filter(popup => {
        if (!popup.isActive) return false;
        
        let isInDateRange = true;
        
        // Check start date if it exists
        if (popup.startDate) {
          const startDate = new Date(popup.startDate);
          if (startDate > today) isInDateRange = false;
        }
        
        // Check end date if it exists
        if (popup.endDate) {
          const endDate = new Date(popup.endDate);
          if (endDate < today) isInDateRange = false;
        }
        
        return isInDateRange;
      });
      
      // Show the first active popup if there is one
      if (activePopups.length > 0) {
        const popupToShow = activePopups[0];
        
        // Check if we've shown this popup already in this session
        const popupShown = sessionStorage.getItem(`popup-shown-${popupToShow.id}`);
        if (!popupShown) {
          setActivePopup(popupToShow);
          setTimeout(() => {
            setIsOpen(true);
            sessionStorage.setItem(`popup-shown-${popupToShow.id}`, 'true');
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error loading popups:", error);
    }
  };
  
  const closePopup = () => {
    setIsOpen(false);
  };
  
  if (!activePopup || !isOpen || isAdmin) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={closePopup}
          className="absolute top-2 right-2 z-10"
        >
          <X size={18} />
        </Button>
        
        {activePopup.image && (
          <div className="relative h-40">
            <img 
              src={activePopup.image} 
              alt={activePopup.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{activePopup.title}</h3>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {activePopup.content}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={closePopup}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsitePopup;
