import React from 'react';
import { Loader2, Flower2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  className?: string;
  showIcon?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Loading...", 
  className = "",
  showIcon = true 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="flex items-center space-x-3">
        {showIcon && (
          <div className="relative">
            <Flower2 className="h-8 w-8 text-emerald-500" />
            <Loader2 className="h-4 w-4 text-emerald-600 animate-spin absolute -top-1 -right-1" />
          </div>
        )}
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default LoadingFallback;
