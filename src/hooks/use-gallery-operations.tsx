import { GalleryImage } from "@/types/gallery";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GalleryOperationsOptions {
  images: GalleryImage[];
  setImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  setDragOverId: React.Dispatch<React.SetStateAction<string | null>>;
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGalleryOperations = ({
  images,
  setImages,
  setDragOverId,
  setHasChanges,
  setIsUploading
}: GalleryOperationsOptions) => {
  const { toast } = useToast();
  
  const handleDragStart = (image: GalleryImage) => {
    return image;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string, draggedImage: GalleryImage | null) => {
    e.preventDefault();
    
    if (!draggedImage || draggedImage.id === targetId) {
      setDragOverId(null);
      return;
    }
    
    const reorderedImages = [...images];
    const draggedIdx = reorderedImages.findIndex((img) => img.id === draggedImage.id);
    const targetIdx = reorderedImages.findIndex((img) => img.id === targetId);
    
    const [removed] = reorderedImages.splice(draggedIdx, 1);
    reorderedImages.splice(targetIdx, 0, removed);
    
    setImages(reorderedImages);
    setDragOverId(null);
    setHasChanges(true);

    toast({
      title: "Image order changed",
      description: "Remember to save your changes",
    });
  };

  const handleDelete = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
    setHasChanges(true);
    
    toast({
      title: "Image removed",
      description: "The image has been removed from the gallery. Remember to save your changes.",
    });
  };

  const toggleFeatured = (id: string) => {
    setImages(
      images.map((img) =>
        img.id === id ? { ...img, featured: !img.featured } : img
      )
    );
    setHasChanges(true);
    
    const image = images.find(img => img.id === id);
    if (image) {
      toast({
        title: image.featured ? "Removed from featured" : "Added to featured",
        description: `"${image.alt}" has been ${image.featured ? "removed from" : "added to"} featured images. Remember to save your changes.`,
      });
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size exceeds 5MB limit');
        }
        
        if (!file.type.startsWith('image/')) {
          throw new Error('Invalid file type. Only images are allowed.');
        }
        
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!fileExt || !validExtensions.includes(fileExt)) {
          throw new Error('Invalid file extension');
        }
        
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;
        
        console.log(`Attempt ${attempt + 1}: Uploading file ${fileName} to Supabase storage...`);
        
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          throw bucketsError;
        }
        
        const galleryBucket = buckets?.find(b => b.name === 'gallery');
        
        if (!galleryBucket) {
          const { error: createError } = await supabase.storage.createBucket('gallery', {
            public: true,
            fileSizeLimit: 5242880,
          });
          
          if (createError) throw createError;
        }
        
        const { data, error } = await supabase.storage
          .from('gallery')
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(fileName);
        console.log("Successfully uploaded to Supabase, URL:", urlData.publicUrl);
        
        return urlData.publicUrl;
      } catch (error) {
        console.error(`Upload attempt ${attempt + 1} failed:`, error);
        
        attempt++;
        if (attempt === maxRetries) {
          console.error("All upload attempts failed, using blob URL as fallback");
          return URL.createObjectURL(file);
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return null;
  };

  const simulateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const newImagesPromises = Array.from(files).map(async (file, index) => {
        const imgSrc = await uploadFileToStorage(file);
        
        return {
          id: `new-${Date.now()}-${index}`,
          src: imgSrc || URL.createObjectURL(file),
          alt: file.name.split('.')[0] || "Uploaded image",
          featured: false,
        };
      });
      
      const newImages = await Promise.all(newImagesPromises);
      const validImages = newImages.filter(img => img.src);
      
      if (validImages.length > 0) {
        setImages([...images, ...validImages]);
        
        toast({
          title: "Upload successful",
          description: `${validImages.length} image${validImages.length > 1 ? 's' : ''} uploaded to the gallery. Remember to save your changes.`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload images. Please try again.",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error("Error during upload:", e);
      toast({
        title: "Upload error",
        description: "An error occurred while uploading images.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setHasChanges(true);
    }
  };

  const handleDragEnd = () => {
    setDragOverId(null);
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDelete,
    toggleFeatured,
    simulateUpload,
    handleDragEnd
  };
};
