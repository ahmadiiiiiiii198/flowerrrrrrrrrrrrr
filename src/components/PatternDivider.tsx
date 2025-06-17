
import React from "react";

interface PatternDividerProps {
  className?: string;
}

const PatternDivider = ({ className = "" }: PatternDividerProps) => {
  return (
    <div className={`flex items-center justify-center my-8 ${className}`}>
      <div className="w-1/4 h-px bg-gradient-to-r from-transparent via-persian-gold/50 to-transparent"></div>
      <div className="mx-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 100 100"
          fill="none"
          className="text-persian-gold"
        >
          <path
            d="M50 0L61.8 38.2L100 50L61.8 61.8L50 100L38.2 61.8L0 50L38.2 38.2L50 0Z"
            fill="currentColor"
            fillOpacity="0.7"
          />
        </svg>
      </div>
      <div className="w-1/4 h-px bg-gradient-to-r from-transparent via-persian-gold/50 to-transparent"></div>
    </div>
  );
};

export default PatternDivider;
