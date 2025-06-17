import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Settings,
  Package,
  Tag
} from 'lucide-react';
import { initializeDatabase } from '@/utils/initializeDatabase';
import { verifyDatabaseState, DatabaseStatus } from '@/utils/verifyDatabase';

const DatabaseSetup = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const { toast } = useToast();

  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    try {
      console.log('[DatabaseSetup] Starting database initialization...');
      const success = await initializeDatabase();
      
      if (success) {
        toast({
          title: 'Success! 🎉',
          description: 'Database initialized successfully with all categories and products',
        });
        
        // Verify the database state after initialization
        await handleVerifyDatabase();
      } else {
        toast({
          title: 'Initialization Failed',
          description: 'Failed to initialize database. Check console for details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[DatabaseSetup] Initialization error:', error);
      toast({
        title: 'Error',
        description: `Database initialization failed: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleVerifyDatabase = async () => {
    setIsVerifying(true);
    try {
      console.log('[DatabaseSetup] Verifying database state...');
      const status = await verifyDatabaseState();
      setDatabaseStatus(status);
      
      if (status.overall) {
        toast({
          title: 'Database Verified ✅',
          description: 'All categories and products are properly configured',
        });
      } else {
        toast({
          title: 'Database Issues Found',
          description: 'Some issues were found. Check the details below.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[DatabaseSetup] Verification error:', error);
      toast({
        title: 'Verification Failed',
        description: `Failed to verify database: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const StatusBadge = ({ success, label }: { success: boolean; label: string }) => (
    <Badge variant={success ? 'default' : 'destructive'} className="flex items-center gap-1">
      {success ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </Badge>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup & Verification
        </CardTitle>
        <p className="text-sm text-gray-600">
          Initialize and verify the backend database for the Products section
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleInitializeDatabase}
            disabled={isInitializing || isVerifying}
            className="flex-1"
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Initialize Database
              </>
            )}
          </Button>
          
          <Button
            onClick={handleVerifyDatabase}
            disabled={isInitializing || isVerifying}
            variant="outline"
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Verify Database
              </>
            )}
          </Button>
        </div>

        {/* Database Status */}
        {databaseStatus && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Database Status</h3>
              <StatusBadge 
                success={databaseStatus.overall} 
                label={databaseStatus.overall ? 'All Good' : 'Issues Found'} 
              />
            </div>

            {/* Categories Status */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Categories</span>
                </div>
                <StatusBadge 
                  success={databaseStatus.categories.success} 
                  label={databaseStatus.categories.success ? 'OK' : 'Issues'} 
                />
              </div>
              <p className="text-sm text-gray-600">{databaseStatus.categories.message}</p>
              {databaseStatus.categories.details && (
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <pre>{JSON.stringify(databaseStatus.categories.details, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Products Status */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Products</span>
                </div>
                <StatusBadge 
                  success={databaseStatus.products.success} 
                  label={databaseStatus.products.success ? 'OK' : 'Issues'} 
                />
              </div>
              <p className="text-sm text-gray-600">{databaseStatus.products.message}</p>
              {databaseStatus.products.details && (
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <pre>{JSON.stringify(databaseStatus.products.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Click "Initialize Database" to create categories and products</li>
            <li>2. Click "Verify Database" to check the current state</li>
            <li>3. Check that all 4 categories exist: Matrimoni, Fiori & Piante, Fiori Finti, Funerali</li>
            <li>4. Verify that products are properly linked to categories</li>
            <li>5. Go to the Products section to see the results</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetup;
