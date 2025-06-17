
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/use-language";
import ErrorBoundary from "./components/ErrorBoundary";
import DiagnosticInfo from "./components/DiagnosticInfo";
import BackgroundInitializer from "./components/BackgroundInitializer";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminMinimal from "./pages/AdminMinimal";
import Order from "./pages/Order";
import OrderDashboard from "./pages/OrderDashboard";
import MenuPage from "./pages/MenuPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import DatabaseSetup from "./components/DatabaseSetup";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary componentName="App">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <BackgroundInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ErrorBoundary componentName="Index">
                  <Index />
                </ErrorBoundary>
              } />
              <Route path="/admin" element={
                <ErrorBoundary componentName="Admin">
                  <Admin />
                </ErrorBoundary>
              } />
              <Route path="/order" element={
                <ErrorBoundary componentName="Order">
                  <Order />
                </ErrorBoundary>
              } />
              <Route path="/orders" element={
                <ErrorBoundary componentName="OrderDashboard">
                  <OrderDashboard />
                </ErrorBoundary>
              } />
              <Route path="/menu" element={
                <ErrorBoundary componentName="MenuPage">
                  <MenuPage />
                </ErrorBoundary>
              } />
              <Route path="/payment/success" element={
                <ErrorBoundary componentName="PaymentSuccess">
                  <PaymentSuccess />
                </ErrorBoundary>
              } />
              <Route path="/payment/cancel" element={
                <ErrorBoundary componentName="PaymentCancel">
                  <PaymentCancel />
                </ErrorBoundary>
              } />
              <Route path="/database-setup" element={
                <div className="min-h-screen bg-gray-50 py-12">
                  <ErrorBoundary componentName="DatabaseSetup">
                    <DatabaseSetup />
                  </ErrorBoundary>
                </div>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <DiagnosticInfo />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
