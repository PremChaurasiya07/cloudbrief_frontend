import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { PageContainer } from "./components/layout/PageContainer";

import Index from "./pages/Index";
import WhatsApp from "./pages/WhatsApp";
import Gmail from "./pages/Gmail";
import Twitter from "./pages/Twitter";
import LinkedIn from "./pages/LinkedIn";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Conversation from "./pages/Conversation";
import EmailView from "./pages/Gmail_conver";

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
              <Route path="/" element={<Index />} />
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="/gmail" element={<Gmail />} />
              <Route path="/gmail/:id" element={<EmailView />} />
              <Route path="/twitter" element={<Twitter />} />
              <Route path="/linkedin" element={<LinkedIn />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/:platform/conversation" element={<Conversation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageContainer>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
