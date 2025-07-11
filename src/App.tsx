
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/use-language";
import { SimpleCartProvider } from "@/hooks/use-simple-cart";

import ErrorBoundary from "./components/ErrorBoundary";
import DiagnosticInfo from "./components/DiagnosticInfo";
import BackgroundInitializer from "./components/BackgroundInitializer";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminMinimal from "./pages/AdminMinimal";

import OrderDashboardPro from "./pages/OrderDashboardPro";
import ContactUs from "./pages/ContactUs";
import MenuPage from "./pages/MenuPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
// DatabaseSetup component removed to prevent accidental initialization
import SimpleStripeTest from "./components/SimpleStripeTest";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary componentName="App">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <SimpleCartProvider>
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

              <Route path="/orders" element={
                <ErrorBoundary componentName="OrderDashboard">
                  <OrderDashboardPro />
                </ErrorBoundary>
              } />
              <Route path="/contact" element={
                <ErrorBoundary componentName="ContactUs">
                  <ContactUs />
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
              {/* Database setup route removed to prevent accidental initialization */}
              <Route path="/stripe-test" element={
                <div className="min-h-screen bg-gray-50 py-12">
                  <ErrorBoundary componentName="SimpleStripeTest">
                    <SimpleStripeTest />
                  </ErrorBoundary>
                </div>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <DiagnosticInfo />
          </SimpleCartProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
