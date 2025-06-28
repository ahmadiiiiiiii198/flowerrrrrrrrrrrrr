
import React from 'react';
import { Flower } from 'lucide-react';
import { useBusinessHours } from '@/hooks/useBusinessHours';

const Footer = () => {
  const { formattedHours } = useBusinessHours();

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/c329c8f3-84d0-4928-bcae-d840d21eb631.png" 
                alt="Francesco Fiori & Piante" 
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Creating beautiful floral arrangements and providing premium plants
              for over 20 years. Your trusted partner for life's special moments.
            </p>
            <div className="text-sm text-gray-400">
              <p>Piazza della Repubblica, 10100 Torino TO</p>
              <p>Tel: +393498851455</p>
              <p>Email: Dbrfnc56m31@gmail.com</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#home" className="hover:text-yellow-400 transition-colors">Home</a></li>
              <li><a href="#flowers" className="hover:text-yellow-400 transition-colors">Flowers</a></li>
              <li><a href="#plants" className="hover:text-yellow-400 transition-colors">Plants</a></li>
              <li><a href="#bouquets" className="hover:text-yellow-400 transition-colors">Bouquets</a></li>
              <li><a href="#about" className="hover:text-yellow-400 transition-colors">About</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Wedding Arrangements</li>
              <li>Corporate Events</li>
              <li>Funeral Flowers</li>
              <li>Plant Care Services</li>
              <li>Custom Bouquets</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Orari di Apertura</h3>
            <div className="text-gray-300 text-sm leading-relaxed">
              {formattedHours || 'Lun-Dom: 08:00 - 19:00'}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Francesco Fiori & Piante. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
