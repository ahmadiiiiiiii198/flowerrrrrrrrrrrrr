import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { businessHoursService } from '@/services/businessHoursService';
import { Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Debug component to test business hours functionality
 * This helps verify that the cache clearing fix works properly
 */
const BusinessHoursDebug: React.FC = () => {
  const {
    isOpen,
    isLoading,
    message,
    nextOpenTime,
    todayHours,
    formattedHours,
    checkBusinessStatus,
    refreshHours
  } = useBusinessHours();

  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Listen for business hours updates
  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      setLastUpdate(new Date().toLocaleTimeString());
      console.log('🔄 Business hours debug: Received update event', event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('businessHoursUpdated', handleUpdate as EventListener);
      return () => {
        window.removeEventListener('businessHoursUpdated', handleUpdate as EventListener);
      };
    }
  }, []);

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered from debug component');
    refreshHours();
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const handleClearCache = () => {
    console.log('🗑️ Clearing cache from debug component');
    businessHoursService.clearCache();
    checkBusinessStatus();
    setLastUpdate(new Date().toLocaleTimeString());
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
        <CardTitle className="flex items-center gap-3 text-blue-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          Business Hours Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {isLoading ? (
            <Clock className="w-5 h-5 animate-spin text-gray-500" />
          ) : isOpen ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <p className="font-semibold text-gray-900">
              Status: {isLoading ? 'Loading...' : isOpen ? 'OPEN' : 'CLOSED'}
            </p>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        {/* Today's Hours */}
        {todayHours && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-900">Today's Hours:</p>
            <p className="text-sm text-blue-700">
              {todayHours.isOpen
                ? `${todayHours.openTime} - ${todayHours.closeTime}`
                : 'Closed today'
              }
            </p>
          </div>
        )}

        {/* Next Open Time */}
        {!isOpen && nextOpenTime && (
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="font-medium text-orange-900">Next Open:</p>
            <p className="text-sm text-orange-700">{nextOpenTime}</p>
          </div>
        )}

        {/* Formatted Hours */}
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="font-medium text-green-900">All Hours:</p>
          <p className="text-sm text-green-700">{formattedHours}</p>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="font-medium text-purple-900">Last Update:</p>
            <p className="text-sm text-purple-700">{lastUpdate}</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            onClick={handleClearCache}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <AlertCircle className="w-4 h-4" />
            Clear Cache
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Test Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to Admin → Hours Settings</li>
            <li>Change some business hours</li>
            <li>Click "Save Hours"</li>
            <li>Watch this component update automatically</li>
            <li>The "Last Update" time should change immediately</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessHoursDebug;