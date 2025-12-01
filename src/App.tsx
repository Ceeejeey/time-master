import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TutorialProvider, useTutorial } from "./contexts/TutorialContext";
import { OnboardingScreen } from "./pages/Onboarding";
import { TutorialOverlay } from "./components/TutorialOverlay";
import { TutorialSuccess } from "./components/TutorialSuccess";
import Index from "./pages/Home";
import Today from "./pages/Today";
import Workplan from "./pages/Workplan";
import Timer from "./pages/Timer";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import WorkplanForm from "./pages/WorkplanForm";
import TaskForm from "./pages/TaskForm";
import TodayGoalForm from "./pages/TodayGoalForm";
import TodayTaskForm from "./pages/TodayTaskForm";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const AppContent = () => {
  const { needsOnboarding, loading } = useAuth();
  const { isActive, currentStep, completedSteps } = useTutorial();
  const showSuccessScreen = !isActive && completedSteps.length === 12 && currentStep === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingScreen />;
  }

  if (showSuccessScreen) {
    return <TutorialSuccess />;
  }

  return (
    <DataProvider>
      <Navigation />
      <main className="pt-14 pb-16 min-h-screen overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/today" element={<Today />} />
          <Route path="/today/goal" element={<TodayGoalForm />} />
          <Route path="/today/task/new" element={<TodayTaskForm />} />
          <Route path="/workplan" element={<Workplan />} />
          <Route path="/workplan/new" element={<WorkplanForm />} />
          <Route path="/workplan/task/new" element={<TaskForm />} />
          <Route path="/workplan/task/edit" element={<TaskForm />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <TutorialOverlay />
    </DataProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <TutorialProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppContent />
            </BrowserRouter>
          </TutorialProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;


