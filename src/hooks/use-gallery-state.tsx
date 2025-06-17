
import { useState } from "react";
import { GalleryImage } from "@/types/gallery";
import { useToast } from "@/hooks/use-toast";

export interface GalleryStateHook {
  images: GalleryImage[];
  dragOverId: string | null;
  isUploading: boolean;
  hasChanges: boolean;
  setImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  setDragOverId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialImages: GalleryImage[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    alt: "Saffron Rice with Tahdig",
    featured: true,
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    alt: "Traditional Kabab Platter",
    featured: false,
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    alt: "Persian Dessert Selection",
    featured: false,
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1460574283810-2aab119d8511?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    alt: "Restaurant Interior",
    featured: true,
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1494891848038-7bd202a2afeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    alt: "Architectural Details",
    featured: false,
  },
  {
    id: "6",
    src: "https://images.unsplash.com/photo-1466442929976-97f336a657be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    alt: "Persian Dining Experience",
    featured: true,
  },
];

export const useGalleryState = (): GalleryStateHook => {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  return {
    images,
    dragOverId,
    isUploading,
    hasChanges,
    setImages,
    setDragOverId,
    setIsUploading,
    setHasChanges
  };
};
