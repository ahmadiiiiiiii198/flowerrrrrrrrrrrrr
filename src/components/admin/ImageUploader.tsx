
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Loader2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storageService } from "@/services/storageService";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploaderProps {
  currentImage?: string;
  onImageSelected: (imageUrl: string) => void;
  onMultipleImagesSelected?: (imageUrls: string[]) => void; // New prop for multiple uploads
  buttonLabel?: string;
  className?: string;
  bucketName?: string;
  folderPath?: string;
  acceptedFileTypes?: string; // e.g., "image/*" or "audio/*"
  maxFileSize?: number; // in bytes
  multiple?: boolean; // Enable multiple file selection
  maxFiles?: number; // Maximum number of files (default: 10)
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageSelected,
  onMultipleImagesSelected,
  buttonLabel,
  className,
  bucketName = "specialties",
  folderPath,
  acceptedFileTypes = "image/*",
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  maxFiles = 10
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>(currentImage);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // When currentImage prop changes, update the preview
  React.useEffect(() => {
    if (currentImage !== previewImage) {
      setPreviewImage(currentImage);
    }
  }, [currentImage]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const filesArray = Array.from(files);

    // Check if multiple files but multiple not enabled
    if (filesArray.length > 1 && !multiple) {
      toast({
        title: "Multiple files not allowed",
        description: "Please select only one file",
        variant: "destructive",
      });
      return;
    }

    // Check max files limit
    if (multiple && filesArray.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Please select no more than ${maxFiles} files`,
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

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress({});

    console.log(`Starting upload for ${filesArray.length} file(s)`);
    console.log("Using bucket:", bucketName, "and folder:", folderPath || "root");

    try {
      // For now, handle single file upload (first file in array)
      const file = filesArray[0];

      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      // Check if bucket exists, create if not
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (!bucketsError && buckets) {
        const targetBucket = buckets.find(b => b.name === bucketName);
        if (!targetBucket) {
          console.log(`Bucket ${bucketName} not found. Available buckets:`, buckets.map(b => b.name));
          console.log(`Attempting to create ${bucketName} bucket...`);
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          });
          if (createError) {
            console.warn('Could not create bucket:', createError);
            console.log('Will proceed with upload anyway...');
          } else {
            console.log(`Successfully created ${bucketName} bucket`);
          }
        }
      } else if (bucketsError) {
        console.warn('Could not list buckets:', bucketsError);
        console.log('Will proceed with upload anyway...');
      }

      // Direct Supabase upload
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message || "Failed to upload file");
      }

      if (!data) {
        throw new Error("No data returned from upload");
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // This is the old single file upload logic - need to replace with multiple file support
      const fileUrl = urlData.publicUrl;
      console.log("File uploaded successfully:", fileUrl);

      // For now, keep single file logic but prepare for multiple
      console.log('📤 ImageUploader: Calling onImageSelected with URL:', fileUrl);
      onImageSelected(fileUrl);
      setPreviewImage(fileUrl);
      console.log('📤 ImageUploader: Preview image set to:', fileUrl);

      const isAudio = acceptedFileTypes.includes('audio');
      toast({
        title: isAudio ? "Audio uploaded" : "Image uploaded",
        description: isAudio ? "The audio file has been uploaded successfully" : "The image has been uploaded successfully",
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

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 ${className || ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleImageChange}
        multiple={multiple}
        className="hidden"
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center h-32">
          <Loader2 className="h-10 w-10 animate-spin text-peach-500" />
          <p className="mt-2 text-sm text-gray-500">Uploading...</p>
        </div>
      ) : previewImage ? (
        <div className="relative">
          {acceptedFileTypes.includes('audio') ? (
            // Audio file preview
            <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-md">
              <Music size={32} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 text-center">Audio file uploaded</p>
              <audio controls className="mt-2 max-w-full">
                <source src={previewImage} />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            // Image preview
            <img
              src={previewImage}
              alt="Selected image"
              className="max-h-48 mx-auto rounded-md object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
                console.error("Failed to load image:", previewImage);
              }}
            />
          )}
          <Button
            type="button"
            onClick={handleUploadClick}
            className="absolute top-2 right-2 bg-peach-500/70 hover:bg-peach-600 text-white rounded-full p-1"
            size="icon"
          >
            <Upload size={16} />
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-32 cursor-pointer"
          onClick={handleUploadClick}
        >
          {acceptedFileTypes.includes('audio') ? (
            <Music size={32} className="text-gray-400 mb-2" />
          ) : (
            <ImageIcon size={32} className="text-gray-400 mb-2" />
          )}
          <p className="text-center text-sm text-gray-500">
            {buttonLabel || (acceptedFileTypes.includes('audio') ? "Click to upload an audio file" : "Click to upload an image")}
          </p>
          {uploadError && (
            <p className="text-center text-xs text-red-500 mt-2">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export { ImageUploader };
export default ImageUploader;
