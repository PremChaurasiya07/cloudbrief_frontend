import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { PageContainer } from "./components/layout/PageContainer";
import Callback from "./pages/Callback";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/protected_route/ProtectedRoute";
import Index from "./pages/Index";
import WhatsApp from "./pages/WhatsApp";
import Gmail from "./pages/Gmail";
import Twitter from "./pages/Twitter";
import LinkedIn from "./pages/LinkedIn";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Conversation from "./pages/Conversation";
import EmailView from "./pages/Gmail_conver";
import HybridCalendar from "./pages/HybridCalendar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageContainer>
            <Routes>
            <Route path="/login" element={<Login />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
              <Route path="/gmail" element={<ProtectedRoute><Gmail /></ProtectedRoute>} />
              <Route path="/gmail/:id" element={<ProtectedRoute><EmailView /></ProtectedRoute>} />
              <Route path="/twitter" element={<ProtectedRoute><HybridCalendar /></ProtectedRoute>} />
              <Route path="/linkedin" element={<ProtectedRoute><LinkedIn /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/:platform/conversation" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageContainer>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
