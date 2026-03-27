import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AdminRoute } from "@/components/AdminRoute";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ServiceWorkerUpdateHandler } from "@/components/ServiceWorkerUpdateHandler";
import { LandingRoute } from "@/components/LandingRoute";
import Layout from "@/components/Layout";
import Auth from "./pages/Auth";
import RoleDashboard from "./components/dashboard/RoleDashboard";
import NewLead from "./pages/NewLead";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Visits from "./pages/Visits";
import VisitDetail from "./pages/VisitDetail";
import NewVisit from "./pages/NewVisit";
import Users from "./pages/Users";
import Landing from "./pages/Landing";
import ResetPassword from "./pages/ResetPassword";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import NotFound from "./pages/NotFound";
import TodayPage from "./pages/TodayPage";
import OrdersPage from "./pages/OrdersPage";
import PlanPage from "./pages/PlanPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ServiceWorkerUpdateHandler />
          <BrowserRouter>
            <OfflineBanner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingRoute />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected but subscription-exempt routes */}
              <Route path="/subscription-expired" element={
                <ProtectedRoute>
                  <SubscriptionExpired />
                </ProtectedRoute>
              } />

              {/* Protected routes with subscription gate */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <SubscriptionGate>
                      <Layout />
                    </SubscriptionGate>
                  </ProtectedRoute>
                }
              >
                <Route index element={<RoleDashboard />} />
                <Route path="today" element={<TodayPage />} />
                <Route path="customers" element={<Leads />} />
                <Route path="customers/new" element={<NewLead />} />
                <Route path="customers/:id" element={<LeadDetail />} />
                <Route path="visits" element={<Visits />} />
                <Route path="visits/new" element={<NewVisit />} />
                <Route path="visits/:id" element={<VisitDetail />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="plan" element={<PlanPage />} />
                <Route path="team" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="profile" element={<Profile />} />
                <Route path="subscription" element={<AdminRoute><SubscriptionManagement /></AdminRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
