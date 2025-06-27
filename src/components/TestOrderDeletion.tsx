import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, TestTube, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TestOrderDeletion = () => {
  const [orderId, setOrderId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const testDatabaseFunction = async () => {
    if (!orderId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an order ID to test',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    setTestResult(null);

    try {
      // First check if the order exists
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        setTestResult({
          success: false,
          message: 'Order not found',
          details: fetchError.message
        });
        return;
      }

      // Test the database function
      const { data, error } = await supabase.rpc('delete_order_cascade', {
        order_uuid: orderId
      });

      if (error) {
        setTestResult({
          success: false,
          message: 'Database function failed',
          details: error.message,
          order: order
        });
      } else {
        setTestResult({
          success: true,
          message: 'Order deleted successfully',
          details: `Order #${order.order_number} (${order.customer_name}) was deleted`,
          order: order
        });
      }

    } catch (error) {
      setTestResult({
        success: false,
        message: 'Unexpected error',
        details: error.message
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const testManualDeletion = async () => {
    if (!orderId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an order ID to test',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    setTestResult(null);

    try {
      // First check if the order exists
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        setTestResult({
          success: false,
          message: 'Order not found',
          details: fetchError.message
        });
        return;
      }

      // Manual deletion process
      const steps = [];

      // 1. Delete order items (only table that actually exists with foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      steps.push({
        step: 'Delete order items',
        success: !itemsError,
        error: itemsError?.message
      });

      // 2. Delete the order itself
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      steps.push({
        step: 'Delete order',
        success: !orderError,
        error: orderError?.message
      });

      const allSuccessful = steps.every(step => step.success);

      setTestResult({
        success: allSuccessful,
        message: allSuccessful ? 'Manual deletion successful' : 'Manual deletion failed',
        details: `Order #${order.order_number} (${order.customer_name})`,
        steps: steps,
        order: order
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: 'Unexpected error',
        details: error.message
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test Order Deletion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order ID Input */}
        <div className="space-y-2">
          <Label htmlFor="orderId">Order ID</Label>
          <Input
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter order UUID to test deletion"
          />
        </div>

        {/* Test Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={testDatabaseFunction}
            disabled={isDeleting || !orderId.trim()}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Testing...' : 'Test DB Function'}
          </Button>
          
          <Button
            onClick={testManualDeletion}
            disabled={isDeleting || !orderId.trim()}
            variant="outline"
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Testing...' : 'Test Manual Deletion'}
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                <div className="space-y-2">
                  <p><strong>{testResult.message}</strong></p>
                  <p>{testResult.details}</p>
                  
                  {testResult.steps && (
                    <div className="mt-3">
                      <p className="font-medium">Deletion Steps:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {testResult.steps.map((step, index) => (
                          <li key={index} className={step.success ? 'text-green-700' : 'text-red-700'}>
                            {step.step}: {step.success ? '✓ Success' : `✗ Failed - ${step.error}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-sm text-blue-800 mb-2">How to use:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Enter an order ID (UUID) that you want to test deletion on</li>
            <li>2. Click "Test DB Function" to test the database function approach</li>
            <li>3. Click "Test Manual Deletion" to test the step-by-step approach</li>
            <li>4. Check the results to see which method works</li>
            <li>⚠️ Warning: This will actually delete the order!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestOrderDeletion;
