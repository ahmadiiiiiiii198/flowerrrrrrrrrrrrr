
import React, { useState, useCallback } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { GalleryImage } from "@/types/gallery";

interface GalleryUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (image: GalleryImage) => void;
}

const GalleryUploadDialog: React.FC<GalleryUploadDialogProps> = ({ 
  isOpen, 
  onClose, 
  onUploadComplete 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const { toast } = useToast();
  
  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      handleUpload(filesArray);
      
      // Reset input to allow selecting the same file again
      setFileInputKey(Date.now());
    }
  }, []);
  
  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  // Handle upload of files
  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Process each file
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 5MB limit`,
            variant: "destructive",
          });
          continue;
        }
        
        // Generate a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;
        
        // For now, create a blob URL as a placeholder
        const imageUrl = URL.createObjectURL(file);
        
        // Create gallery image object
        const newImage: GalleryImage = {
          id: uuidv4(),
          src: imageUrl,
          alt: file.name.split('.')[0] || "Uploaded image",
          featured: false,
        };
        
        // Pass the new image to the parent component
        onUploadComplete(newImage);
      }
      
      // Reset state after successful upload
      setSelectedFiles([]);
      
      // Close dialog if requested
      if (files.length > 0) {
        toast({
          title: "Upload complete",
          description: `${files.length} image(s) added to gallery`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, onUploadComplete]);
  
  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
      handleUpload(files);
    }
  }, [handleUpload]);
  
  // Reset the selected files
  const handleReset = useCallback(() => {
    setSelectedFiles([]);
    setFileInputKey(Date.now());
  }, []);
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Upload gallery images</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div 
          className={`flex flex-col gap-4 items-center justify-center border-2 border-dashed rounded-lg p-8 transition-all
            ${dragActive ? "border-persian-gold bg-persian-gold/5" : "border-gray-300 hover:border-persian-gold"}
            ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-persian-gold"></div>
              <p className="text-gray-500 mt-4">Uploading {selectedFiles.length} image(s)...</p>
            </div>
          ) : selectedFiles.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto w-full">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="bg-gray-100 p-2 rounded-md text-sm">
                      {file.name.length > 20 
                        ? `${file.name.substring(0, 15)}...${file.name.substring(file.name.lastIndexOf('.'))}`
                        : file.name
                      }
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-500 mt-2">{selectedFiles.length} file(s) selected</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset} 
                className="mt-2"
                disabled={isUploading}
              >
                <X size={16} className="mr-1" /> Clear selection
              </Button>
            </>
          ) : (
            <>
              <ImageIcon size={48} className="text-gray-400" />
              <p className="text-gray-500 text-center mb-2">Drag and drop your images here</p>
              <p className="text-gray-400 text-center text-sm">or click to browse</p>
              <input
                key={fileInputKey}
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept="image/*"
                multiple
                disabled={isUploading}
              />
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">
          Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB per image.
        </p>
      </div>
    </DialogContent>
  );
};

export default GalleryUploadDialog;
