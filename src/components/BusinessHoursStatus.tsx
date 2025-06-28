import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useBusinessHours } from '@/hooks/useBusinessHours';

interface BusinessHoursStatusProps {
  showFullHours?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'banner';
}

const BusinessHoursStatus: React.FC<BusinessHoursStatusProps> = ({
  showFullHours = false,
  className = '',
  variant = 'default'
}) => {
  const {
    isOpen,
    isLoading,
    message,
    nextOpenTime,
    todayHours,
    formattedHours
  } = useBusinessHours();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Caricamento orari...</span>
      </div>
    );
  }

  // Compact variant - just a badge
  if (variant === 'compact') {
    return (
      <Badge 
        variant={isOpen ? 'default' : 'secondary'}
        className={`flex items-center gap-1 ${className}`}
      >
        {isOpen ? (
          <>
            <CheckCircle className="w-3 h-3" />
            Aperto
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3" />
            Chiuso
          </>
        )}
      </Badge>
    );
  }

  // Banner variant - full width alert
  if (variant === 'banner') {
    return (
      <Alert className={`${isOpen ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'} ${className}`}>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-orange-600" />
          )}
          <AlertDescription className={isOpen ? 'text-green-800' : 'text-orange-800'}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="font-medium">{message}</span>
              {!isOpen && nextOpenTime && (
                <span className="text-sm">Prossima apertura: {nextOpenTime}</span>
              )}
              {isOpen && todayHours && (
                <span className="text-sm">Oggi: {todayHours.openTime} - {todayHours.closeTime}</span>
              )}
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // Default variant - detailed card
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${isOpen ? 'bg-green-100' : 'bg-orange-100'}`}>
          {isOpen ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Clock className="w-5 h-5 text-orange-600" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {isOpen ? 'Siamo Aperti' : 'Siamo Chiusi'}
            </h3>
            <Badge variant={isOpen ? 'default' : 'secondary'}>
              {isOpen ? 'Aperto' : 'Chiuso'}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{message}</p>
          
          {!isOpen && nextOpenTime && (
            <p className="text-sm text-orange-600 font-medium">
              Prossima apertura: {nextOpenTime}
            </p>
          )}
          
          {isOpen && todayHours && (
            <p className="text-sm text-green-600 font-medium">
              Orari di oggi: {todayHours.openTime} - {todayHours.closeTime}
            </p>
          )}
          
          {showFullHours && formattedHours && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tutti gli orari:</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {formattedHours}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessHoursStatus;
