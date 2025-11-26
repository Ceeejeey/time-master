import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import MobileSuccess from "./pages/MobileSuccess";
import MobileFailure from "./pages/MobileFailure";
import Index from "./pages/Home";
import Today from "./pages/Today";
import Workplan from "./pages/Workplan";
import Timer from "./pages/Timer";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/mobile-success" element={<MobileSuccess />} />
              <Route path="/auth/mobile-failure" element={<MobileFailure />} />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DataProvider>
                      <div className="min-h-screen flex flex-col safe-top safe-bottom">
                        <Navigation />
                        <main className="flex-1 overflow-x-hidden">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/today" element={<Today />} />
                            <Route path="/workplan" element={<Workplan />} />
                            <Route path="/timer" element={<Timer />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </DataProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;


