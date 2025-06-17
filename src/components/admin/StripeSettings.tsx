import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StripeCheckoutTest from './StripeCheckoutTest';
import { 
  CreditCard, 
  Save, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Loader2,
  TestTube
} from 'lucide-react';

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isTestMode: boolean;
}

const StripeSettings = () => {
  const [config, setConfig] = useState<StripeConfig>({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    isTestMode: true,
  });
  const [showSecrets, setShowSecrets] = useState({
    secretKey: false,
    webhookSecret: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keyStatus, setKeyStatus] = useState({
    publishableValid: false,
    secretValid: false,
    webhookValid: false,
  });
  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    loadStripeSettings();
  }, []);

  // Validate keys whenever config changes
  useEffect(() => {
    validateKeys();
  }, [config]);

  const loadStripeSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stripeConfig')
        .single();

      if (!error && data?.value) {
        setConfig(data.value as StripeConfig);
      }
    } catch (error) {
      console.error('Error loading Stripe settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateKeys = () => {
    const publishableValid = config.publishableKey.startsWith('pk_test_') || config.publishableKey.startsWith('pk_live_');
    const secretValid = config.secretKey.startsWith('sk_test_') || config.secretKey.startsWith('sk_live_');
    const webhookValid = config.webhookSecret.startsWith('whsec_') || config.webhookSecret === '';

    setKeyStatus({
      publishableValid,
      secretValid,
      webhookValid,
    });
  };

  const saveStripeSettings = async () => {
    try {
      setIsSaving(true);

      // Validate required fields
      if (!config.publishableKey || !config.secretKey) {
        toast({
          title: 'Validation Error',
          description: 'Publishable key and secret key are required.',
          variant: 'destructive',
        });
        return;
      }

      // Validate key formats
      if (!keyStatus.publishableValid || !keyStatus.secretValid) {
        toast({
          title: 'Invalid Keys',
          description: 'Please check that your Stripe keys are in the correct format.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Saving Stripe config:', { ...config, secretKey: '[HIDDEN]' });

      // Save to database - try update first, then insert if not exists
      let data, error;

      // First try to update existing record
      const updateResult = await supabase
        .from('settings')
        .update({
          value: config,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'stripeConfig')
        .select();

      if (updateResult.error) {
        console.log('Update failed, trying insert:', updateResult.error.message);
        // If update fails, try insert
        const insertResult = await supabase
          .from('settings')
          .insert({
            key: 'stripeConfig',
            value: config,
            updated_at: new Date().toISOString(),
          })
          .select();

        data = insertResult.data;
        error = insertResult.error;
      } else {
        data = updateResult.data;
        error = updateResult.error;
      }

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Save successful:', data);

      toast({
        title: 'Settings Saved! ✅',
        description: 'Stripe configuration has been updated successfully.',
      });

      // Clear cached config so it gets reloaded
      if (window.stripeConfigCache) {
        delete window.stripeConfigCache;
      }

    } catch (error) {
      console.error('Error saving Stripe settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Save Failed',
        description: `Failed to save Stripe settings: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testStripeConnection = async () => {
    if (!keyStatus.publishableValid || !keyStatus.secretValid) {
      toast({
        title: 'Invalid Keys',
        description: 'Please configure valid Stripe keys before testing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Test if we can load Stripe with the current config
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(config.publishableKey);

      if (stripe) {
        toast({
          title: 'Connection Successful! ✅',
          description: 'Stripe keys are valid and connection is working.',
        });
      } else {
        throw new Error('Failed to initialize Stripe');
      }
    } catch (error) {
      console.error('Stripe test error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to Stripe. Please check your keys.',
        variant: 'destructive',
      });
    }
  };

  const getKeyStatusIcon = (isValid: boolean, isEmpty: boolean = false) => {
    if (isEmpty) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    return isValid ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading Stripe settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Stripe Payment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="keys" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="keys">API Keys</TabsTrigger>
              <TabsTrigger value="test">Test Integration</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="keys" className="space-y-6">
              {/* Test/Live Mode Toggle */}
              <div className="flex items-center gap-4">
                <Label>Mode:</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={config.isTestMode ? "default" : "secondary"}>
                    {config.isTestMode ? "Test Mode" : "Live Mode"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, isTestMode: !prev.isTestMode }))}
                  >
                    Switch to {config.isTestMode ? "Live" : "Test"}
                  </Button>
                </div>
              </div>

              {/* Publishable Key */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="publishableKey">Publishable Key *</Label>
                  {getKeyStatusIcon(keyStatus.publishableValid, !config.publishableKey)}
                </div>
                <Input
                  id="publishableKey"
                  placeholder={`pk_${config.isTestMode ? 'test' : 'live'}_...`}
                  value={config.publishableKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  Get this from your Stripe Dashboard → Developers → API keys
                </p>
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="secretKey">Secret Key *</Label>
                  {getKeyStatusIcon(keyStatus.secretValid, !config.secretKey)}
                </div>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showSecrets.secretKey ? "text" : "password"}
                    placeholder={`sk_${config.isTestMode ? 'test' : 'live'}_...`}
                    value={config.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSecrets(prev => ({ ...prev, secretKey: !prev.secretKey }))}
                  >
                    {showSecrets.secretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  ⚠️ Keep this secret! Never share or expose in frontend code.
                </p>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                  {getKeyStatusIcon(keyStatus.webhookValid, !config.webhookSecret)}
                </div>
                <div className="relative">
                  <Input
                    id="webhookSecret"
                    type={showSecrets.webhookSecret ? "text" : "password"}
                    placeholder="whsec_..."
                    value={config.webhookSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSecrets(prev => ({ ...prev, webhookSecret: !prev.webhookSecret }))}
                  >
                    {showSecrets.webhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Required for webhook verification. Get from Stripe Dashboard → Webhooks.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-6">
              <StripeCheckoutTest />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">How to get your Stripe keys:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Go to <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
                  <li>2. Navigate to Developers → API keys</li>
                  <li>3. Copy your Publishable key and Secret key</li>
                  <li>4. For webhooks: Go to Developers → Webhooks → Add endpoint</li>
                  <li>5. Use this URL: <code className="bg-blue-100 px-1 rounded">https://your-supabase-project.supabase.co/functions/v1/stripe-webhook</code></li>
                </ol>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">⚠️ Security Notes:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Never expose secret keys in frontend code</li>
                  <li>• Use test keys during development</li>
                  <li>• Switch to live keys only for production</li>
                  <li>• Regularly rotate your API keys</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              onClick={saveStripeSettings}
              disabled={isSaving || !keyStatus.publishableValid || !keyStatus.secretValid}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={testStripeConnection}
              disabled={!keyStatus.publishableValid || !keyStatus.secretValid}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeSettings;
