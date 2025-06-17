
import React from "react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "", size = "md" }) => {
  // Map size to actual dimensions
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  
  const spinnerSize = sizeClasses[size];
  
  return (
    <div className={`flex justify-center ${className}`}>
      <div className={`animate-spin rounded-full ${spinnerSize} border-t-2 border-b-2 border-persian-gold`}></div>
    </div>
  );
};

export default LoadingSpinner;
