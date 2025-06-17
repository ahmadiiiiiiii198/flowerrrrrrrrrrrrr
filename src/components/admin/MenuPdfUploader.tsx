
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, X } from "lucide-react";

const MenuPdfUploader = ({ onSaveContent }: { onSaveContent?: (sectionId: string, content: any) => void }) => {
  const { toast } = useToast();
  const [menuPdf, setMenuPdf] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load menu PDF from localStorage if available
    const storedContent = localStorage.getItem('menuPdfContent');
    if (storedContent) {
      try {
        setMenuPdf(JSON.parse(storedContent));
      } catch (e) {
        console.error('Failed to parse menu PDF content');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const pdfUrl = e.target?.result as string;
      setMenuPdf(pdfUrl);
      
      // Save to localStorage
      localStorage.setItem('menuPdfContent', JSON.stringify(pdfUrl));
      
      if (onSaveContent) {
        onSaveContent('menuPdf', pdfUrl);
      }
      
      toast({
        title: "Menu PDF uploaded",
        description: "The menu PDF has been updated successfully"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setMenuPdf(null);
    localStorage.removeItem('menuPdfContent');
    
    if (onSaveContent) {
      onSaveContent('menuPdf', null);
    }
    
    toast({
      title: "Menu PDF removed",
      description: "The menu PDF has been removed"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-playfair font-bold text-persian-navy">Catalogo Prodotti PDF</h2>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
          
          {menuPdf ? (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-md overflow-hidden h-[500px]">
                <iframe 
                  src={menuPdf} 
                  className="w-full h-full" 
                  title="Menu PDF"
                ></iframe>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleUploadClick}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  Replace PDF
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(menuPdf, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download PDF
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  Remove PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded-md">
              <FileText size={48} className="text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">Nessun catalogo PDF caricato</h3>
              <p className="text-gray-500 mb-6">Carica un file PDF del tuo catalogo prodotti (max 100MB)</p>
              <Button
                onClick={handleUploadClick}
                className="bg-persian-gold text-persian-navy hover:bg-persian-gold/90 flex items-center gap-2"
              >
                <Upload size={16} />
                Carica Catalogo PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuPdfUploader;
