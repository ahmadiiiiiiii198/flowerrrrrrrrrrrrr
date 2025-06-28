import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, Loader2, X, Plus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageWithLabel {
  url: string;
  label: string;
}

interface MultipleImageUploaderProps {
  onImagesSelected?: (imageUrls: string[]) => void;
  onImagesWithLabelsSelected?: (images: ImageWithLabel[]) => void;
  buttonLabel?: string;
  className?: string;
  bucketName?: string;
  folderPath?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  maxFiles?: number;
  currentImages?: string[];
  currentImagesWithLabels?: ImageWithLabel[];
  enableLabels?: boolean;
}

const MultipleImageUploader: React.FC<MultipleImageUploaderProps> = ({
  onImagesSelected,
  onImagesWithLabelsSelected,
  buttonLabel = "Upload Images",
  className,
  bucketName = "gallery",
  folderPath,
  acceptedFileTypes = "image/*",
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  currentImages = [],
  currentImagesWithLabels = [],
  enableLabels = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(currentImages);
  const [previewImagesWithLabels, setPreviewImagesWithLabels] = useState<ImageWithLabel[]>(currentImagesWithLabels);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update preview when props change
  React.useEffect(() => {
    if (enableLabels) {
      setPreviewImagesWithLabels(currentImagesWithLabels);
    } else {
      setPreviewImages(currentImages);
    }
  }, [currentImages, currentImagesWithLabels, enableLabels]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Check max files limit
    const currentCount = enableLabels ? previewImagesWithLabels.length : previewImages.length;
    if (currentCount + filesArray.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} images allowed. You currently have ${currentCount} images.`,
        variant: "destructive",
      });
      return;
    }

    // Validate each file
    for (const file of filesArray) {
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizeMB}MB limit`,
          variant: "destructive",
        });
        return;
      }
    }

    await uploadFiles(filesArray);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress({});
    
    console.log(`Starting upload for ${files.length} file(s)`);
    
    try {
      const uploadedUrls: string[] = [];
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${file.name}-${i}`;
        
        // Update progress for this file
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileName = `${timestamp}-${randomString}-${i}.${fileExt}`;
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

        console.log(`Uploading file ${i + 1}/${files.length}:`, filePath);

        // Check if bucket exists (only on first file)
        if (i === 0) {
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          if (!bucketsError && buckets) {
            const targetBucket = buckets.find(b => b.name === bucketName);
            if (!targetBucket) {
              console.log(`Bucket ${bucketName} not found. Creating...`);
              const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 52428800, // 50MB
              });
              if (createError) {
                console.warn('Could not create bucket:', createError);
              }
            }
          }
        }

        // Update progress to 50% (uploading)
        setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));

        // Direct Supabase upload
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error(`Upload error for file ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        if (!data) {
          throw new Error(`No data returned from upload for ${file.name}`);
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;
        uploadedUrls.push(fileUrl);
        
        // Update progress to 100%
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        console.log(`File ${i + 1}/${files.length} uploaded successfully:`, fileUrl);
      }
      
      // Update preview and notify parent
      if (enableLabels) {
        const newImagesWithLabels = [
          ...previewImagesWithLabels,
          ...uploadedUrls.map(url => ({ url, label: '' }))
        ];
        setPreviewImagesWithLabels(newImagesWithLabels);
        if (onImagesWithLabelsSelected) {
          onImagesWithLabelsSelected(newImagesWithLabels);
        }
      } else {
        const newImages = [...previewImages, ...uploadedUrls];
        setPreviewImages(newImages);
        if (onImagesSelected) {
          onImagesSelected(newImages);
        }
      }
      
      toast({
        title: `${files.length} image${files.length > 1 ? 's' : ''} uploaded`,
        description: `Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`,
      });
    } catch (error: any) {
      console.error("Error uploading files:", error);
      setUploadError(error.message || "Upload failed");
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const removeImage = (index: number) => {
    if (enableLabels) {
      const newImages = previewImagesWithLabels.filter((_, i) => i !== index);
      setPreviewImagesWithLabels(newImages);
      if (onImagesWithLabelsSelected) {
        onImagesWithLabelsSelected(newImages);
      }
    } else {
      const newImages = previewImages.filter((_, i) => i !== index);
      setPreviewImages(newImages);
      if (onImagesSelected) {
        onImagesSelected(newImages);
      }
    }
  };

  const updateImageLabel = (index: number, label: string) => {
    if (!enableLabels) return;

    const newImages = [...previewImagesWithLabels];
    newImages[index] = { ...newImages[index], label };
    setPreviewImagesWithLabels(newImages);

    if (onImagesWithLabelsSelected) {
      onImagesWithLabelsSelected(newImages);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
      
      {/* Upload Button */}
      <Button
        type="button"
        onClick={handleUploadClick}
        disabled={isUploading || (enableLabels ? previewImagesWithLabels.length : previewImages.length) >= maxFiles}
        className="w-full"
        variant="outline"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {buttonLabel} ({enableLabels ? previewImagesWithLabels.length : previewImages.length}/{maxFiles})
          </>
        )}
      </Button>

      {/* Upload Progress */}
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {uploadError && (
        <p className="text-center text-xs text-red-500">{uploadError}</p>
      )}

      {/* Image Previews */}
      {(enableLabels ? previewImagesWithLabels.length > 0 : previewImages.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enableLabels ? (
            previewImagesWithLabels.map((image, index) => (
              <div key={index} className="relative group border rounded-lg p-3">
                <div className="relative mb-2">
                  <img
                    src={image.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    size="icon"
                  >
                    <X size={12} />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Label:</span>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter image label..."
                    value={image.label}
                    onChange={(e) => updateImageLabel(index, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            ))
          ) : (
            previewImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                <Button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  size="icon"
                >
                  <X size={12} />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MultipleImageUploader;
export type { ImageWithLabel };
