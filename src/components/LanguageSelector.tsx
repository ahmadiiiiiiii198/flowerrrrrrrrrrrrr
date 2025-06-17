
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const LanguageSelector = () => {
  // Static language to avoid hook errors
  const [language, setLanguageState] = useState("it");
  const [open, setOpen] = useState(false);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    // You can add localStorage or other persistence here later
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 border-gray-300 text-gray-700 hover:bg-gray-50 px-3 flex gap-2 shadow-sm"
        >
          <Globe size={14} className="text-gray-600" />
          <span className="font-medium">{language.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0 bg-white border border-gray-200 shadow-lg">
        <div className="flex flex-col">
          <Button
            variant={language === "it" ? "default" : "ghost"}
            onClick={() => {
              setLanguage("it");
              setOpen(false);
            }}
            className={`rounded-none justify-start text-sm ${language === "it" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            🇮🇹 Italiano
          </Button>
          <Button
            variant={language === "en" ? "default" : "ghost"}
            onClick={() => {
              setLanguage("en");
              setOpen(false);
            }}
            className={`rounded-none justify-start text-sm ${language === "en" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            🇬🇧 English
          </Button>
          <Button
            variant={language === "fr" ? "default" : "ghost"}
            onClick={() => {
              setLanguage("fr");
              setOpen(false);
            }}
            className={`rounded-none justify-start text-sm ${language === "fr" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            🇫🇷 Français
          </Button>
          <Button
            variant={language === "ar" ? "default" : "ghost"}
            onClick={() => {
              setLanguage("ar");
              setOpen(false);
            }}
            className={`rounded-none justify-start text-sm ${language === "ar" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            🇸🇦 العربية
          </Button>
          <Button
            variant={language === "fa" ? "default" : "ghost"}
            onClick={() => {
              setLanguage("fa");
              setOpen(false);
            }}
            className={`rounded-none justify-start text-sm ${language === "fa" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            🇮🇷 فارسی
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelector;
