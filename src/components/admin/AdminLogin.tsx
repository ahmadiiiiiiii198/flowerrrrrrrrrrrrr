
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getSetting } from "@/lib/supabase";

interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [defaultCredentials, setDefaultCredentials] = useState<{username: string, password: string}>({
    username: "admin",
    password: "persian123"
  });
  const { toast } = useToast();

  // Get default credentials when component mounts
  useEffect(() => {
    const fetchDefaultCredentials = async () => {
      try {
        const adminCredentials = await getSetting('adminCredentials') as { username: string, password: string } | null;
        
        if (adminCredentials) {
          console.log("Admin credentials found:", { username: adminCredentials.username, password: "***" });
          setDefaultCredentials(adminCredentials);
        } else {
          console.log("Using fallback admin credentials");
        }
      } catch (error) {
        console.error("Error fetching admin credentials:", error);
      }
    };
    
    fetchDefaultCredentials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with username:", username);
      
      // Try to verify credentials
      const success = await onLogin(username, password);
      
      if (success) {
        toast({
          title: "Success",
          description: "Welcome to the admin panel!",
        });
      } else {
        toast({
          title: "Authentication failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        
        // Log default credentials to help with debugging
        console.log("Default credentials are:", { 
          username: defaultCredentials.username, 
          password: "***" 
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-samarkand-pattern">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-xl border-2 border-persian-gold/30 overflow-hidden">
        <div className="relative mb-8 p-6 pt-8 bg-persian-navy/90">
          <div className="text-center">
            <img
              src="https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png"
              alt="Francesco Fiori & Piante Logo"
              className="h-24 w-24 mx-auto mb-4 rounded-full shadow-lg border-2 border-persian-gold animate-pulse"
            />
            <h1 className="text-3xl font-playfair font-bold text-white">
              Francesco <span className="text-persian-gold">Admin</span>
            </h1>
            <p className="text-gray-300 mt-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Accedi per gestire il tuo sito web del negozio di fiori
            </p>
          </div>
          
          <div className="absolute inset-0 -z-10 opacity-20 bg-samarkand-pattern"></div>
        </div>
        
        <div className="p-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-persian-gold/60" />
                </div>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Default: admin"
                  className="pl-10 border-persian-blue/30 focus:border-persian-blue"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-persian-gold/60" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Default: persian123"
                  className="pl-10 border-persian-blue/30 focus:border-persian-blue"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-persian-gold hover:bg-persian-gold/90 text-persian-navy font-medium transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Default credentials: admin / persian123</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
