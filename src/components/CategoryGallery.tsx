
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Flower, Heart, Users, Sparkles, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoryGalleryProps {
  category: {
    title: string;
    description: string;
    images: string[];
    explanation: string;
    features: string[];
    labels?: string[];
    icon: React.ReactNode;
  };
}

const CategoryGallery: React.FC<CategoryGalleryProps> = ({ category }) => {
  return (
    <div className="bg-gradient-to-br from-white to-peach-50/30 rounded-2xl p-8 shadow-lg border border-peach-100/50">
      <div className="flex items-center gap-3 mb-6">
        {category.icon}
        <h3 className="text-2xl font-bold text-gray-800 font-playfair">{category.title}</h3>
      </div>
      
      <div className="mb-6">
        <Carousel className="w-full max-w-xs mx-auto">
          <CarouselContent>
            {category.images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="aspect-square overflow-hidden rounded-xl relative">
                  <img
                    src={image}
                    alt={`${category.title} ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />

                  {/* Labels overlay on images */}
                  {category.labels && category.labels.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {category.labels.map((label, labelIndex) => (
                        <Badge
                          key={labelIndex}
                          variant="outline"
                          className="bg-white/90 text-blue-700 border-blue-200 text-xs backdrop-blur-sm"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-white/80 hover:bg-white border-peach-200" />
          <CarouselNext className="bg-white/80 hover:bg-white border-peach-200" />
        </Carousel>
      </div>

      <div className="space-y-4">
        <p className="text-gray-700 font-inter leading-relaxed">{category.explanation}</p>



        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3 font-playfair">Caratteristiche:</h4>
          <ul className="space-y-2">
            {category.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-600 font-inter">
                <div className="w-2 h-2 bg-gradient-to-r from-peach-400 to-coral-500 rounded-full"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CategoryGallery;
