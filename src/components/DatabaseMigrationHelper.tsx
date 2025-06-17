import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DatabaseMigrationHelper = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const migrations = [
    {
      id: 'delete_order_cascade_function',
      name: 'Create Delete Order Cascade Function',
      description: 'Creates a database function to safely delete orders and all related records',
      sql: `
-- Create a function to safely delete an order and all its related records
CREATE OR REPLACE FUNCTION delete_order_cascade(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_exists BOOLEAN;
BEGIN
    -- Check if order exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE id = order_uuid) INTO order_exists;
    
    IF NOT order_exists THEN
        RAISE EXCEPTION 'Order with ID % does not exist', order_uuid;
    END IF;

    -- Delete related records in the correct order to avoid foreign key constraint violations
    
    -- 1. Delete order notifications
    DELETE FROM order_notifications WHERE order_id = order_uuid;
    
    -- 2. Delete order status history
    DELETE FROM order_status_history WHERE order_id = order_uuid;
    
    -- 3. Delete order items
    DELETE FROM order_items WHERE order_id = order_uuid;
    
    -- 4. Finally delete the order itself
    DELETE FROM orders WHERE id = order_uuid;
    
    -- Return success
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE EXCEPTION 'Failed to delete order %: %', order_uuid, SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_order_cascade(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_order_cascade(UUID) IS 'Safely deletes an order and all its related records (notifications, status history, items) in the correct order to avoid foreign key constraint violations.';
      `
    },
    {
      id: 'fix_rls_policies',
      name: 'Fix RLS Policies for Order Deletion',
      description: 'Ensures authenticated users can delete orders and related records',
      sql: `
-- Fix RLS policies for order deletion
-- Orders table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON orders;
CREATE POLICY "Allow authenticated users to delete orders" 
  ON orders 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Order items table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete order items" ON order_items;
CREATE POLICY "Allow authenticated users to delete order items" 
  ON order_items 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Order notifications table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete order notifications" ON order_notifications;
CREATE POLICY "Allow authenticated users to delete order notifications" 
  ON order_notifications 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Order status history table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete order status history" ON order_status_history;
CREATE POLICY "Allow authenticated users to delete order status history" 
  ON order_status_history 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Ensure all tables have RLS enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
      `
    }
  ];

  const runMigration = async (migration: any) => {
    setIsRunning(true);
    
    try {
      console.log(`Running migration: ${migration.name}`);
      
      // Execute the SQL using Supabase's rpc with a custom function
      // Since we can't execute arbitrary SQL directly, we'll try a different approach
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: migration.sql
      });

      if (error) {
        // If the exec_sql function doesn't exist, try direct execution
        if (error.message.includes('function exec_sql')) {
          throw new Error('Direct SQL execution not available. Please run migrations manually in Supabase dashboard.');
        }
        throw error;
      }

      const result = {
        id: migration.id,
        name: migration.name,
        success: true,
        message: 'Migration executed successfully',
        timestamp: new Date().toISOString()
      };

      setResults(prev => [...prev, result]);
      
      toast({
        title: 'Migration Successful',
        description: migration.name,
      });

    } catch (error) {
      console.error(`Migration failed: ${migration.name}`, error);
      
      const result = {
        id: migration.id,
        name: migration.name,
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [...prev, result]);
      
      toast({
        title: 'Migration Failed',
        description: `${migration.name}: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAllMigrations = async () => {
    setResults([]);
    for (const migration of migrations) {
      await runMigration(migration);
      // Small delay between migrations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const copyMigrationSQL = (migration: any) => {
    navigator.clipboard.writeText(migration.sql);
    toast({
      title: 'SQL Copied',
      description: 'Migration SQL copied to clipboard. You can run it manually in Supabase dashboard.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Migration Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This tool helps apply database migrations for order deletion functionality. 
              If automatic execution fails, you can copy the SQL and run it manually in your Supabase dashboard.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button
              onClick={runAllMigrations}
              disabled={isRunning}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running Migrations...' : 'Run All Migrations'}
            </Button>
          </div>

          {/* Migration List */}
          <div className="space-y-4">
            <h4 className="font-medium">Available Migrations:</h4>
            {migrations.map((migration) => {
              const result = results.find(r => r.id === migration.id);
              
              return (
                <div key={migration.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{migration.name}</h5>
                      {result && (
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Success</>
                          ) : (
                            <><AlertTriangle className="w-3 h-3 mr-1" /> Failed</>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => runMigration(migration)}
                        disabled={isRunning}
                        size="sm"
                        variant="outline"
                      >
                        Run
                      </Button>
                      <Button
                        onClick={() => copyMigrationSQL(migration)}
                        size="sm"
                        variant="ghost"
                      >
                        Copy SQL
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{migration.description}</p>
                  
                  {result && (
                    <div className={`text-sm p-2 rounded ${
                      result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {result.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Manual Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-sm text-blue-800 mb-2">Manual Migration Instructions:</h5>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy the SQL from each migration above</li>
              <li>Paste and execute each migration in order</li>
              <li>Verify the function exists by testing order deletion</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseMigrationHelper;
