
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash, Image } from "lucide-react";
import { GalleryImage } from "@/types/gallery";

interface GalleryImageCardProps {
  image: GalleryImage;
  index?: number; // Added index as an optional prop
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  isDragOver: boolean;
  onToggleFeatured: (id: string) => void;
}

const GalleryImageCard: React.FC<GalleryImageCardProps> = ({
  image,
  index, // Added index parameter
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDragLeave,
  isDragOver,
  onToggleFeatured,
  onDelete
}) => {
  const [hasImageError, setHasImageError] = React.useState(false);
  
  const handleImageError = () => {
    console.error("Failed to load image in GalleryImageCard:", image.src);
    setHasImageError(true);
  };
  
  return (
    <Card
      className={`overflow-hidden group animate-fade-in border-persian-gold/20 hover:shadow-lg transition-all ${
        isDragOver ? "border-2 border-persian-gold" : ""
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, image.id)}
      onDragOver={(e) => onDragOver(e, image.id)}
      onDrop={(e) => onDrop(e, image.id)}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
    >
      <CardContent className="p-0 relative">
        {hasImageError ? (
          <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center">
            <Image size={32} className="text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">Image failed to load</p>
          </div>
        ) : (
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
            onError={handleImageError}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-white mb-4">{image.alt}</p>
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${
                image.featured ? "bg-persian-gold text-persian-navy" : "bg-gray-200/30 text-white"
              }`}
              onClick={() => onToggleFeatured(image.id)}
            >
              {image.featured ? <Check size={16} /> : <Plus size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-red-500/80 text-white rounded-full hover:bg-red-600"
              onClick={() => onDelete(image.id)}
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>
        {image.featured && (
          <div className="absolute top-2 right-2 bg-persian-gold text-persian-navy text-xs px-2 py-1 rounded-full">
            Featured
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryImageCard;
