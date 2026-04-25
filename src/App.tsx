import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ParticipantProvider } from "@/contexts/ParticipantContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import ParticipantLogin from "./pages/ParticipantLogin";
import ParticipantSubmission from "./pages/ParticipantSubmission";
import NotFound from "./pages/NotFound";
import Timer from "./pages/Timer";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ParticipantProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/participant-login" element={<ParticipantLogin />} />
            <Route path="/submit" element={<ParticipantSubmission />} />
            <Route path="/timer" element={<Timer />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ParticipantProvider>
  </QueryClientProvider>
);

export default App;
