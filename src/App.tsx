import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AdminRoute } from "@/components/AdminRoute";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ServiceWorkerUpdateHandler } from "@/components/ServiceWorkerUpdateHandler";
import Layout from "@/components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TeamDashboard from "./pages/TeamDashboard";
import AnalyticsHub from "./pages/AnalyticsHub";
import TerritoryMap from "./pages/TerritoryMap";
import PerformanceBoard from "./pages/PerformanceBoard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Visits from "./pages/Visits";
import VisitDetail from "./pages/VisitDetail";
import NewVisit from "./pages/NewVisit";
import Users from "./pages/Users";
import SyncMonitoring from "./pages/SyncMonitoring";
import Planning from "./pages/Planning";
import TeamPlanning from "./pages/TeamPlanning";
import PlanningOverview from "./pages/PlanningOverview";
import NotFound from "./pages/NotFound";

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
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="planning" element={<Planning />} />
                <Route path="planning/team" element={<TeamPlanning />} />
                <Route path="planning/overview" element={<PlanningOverview />} />
                <Route path="team" element={<TeamDashboard />} />
                <Route path="analytics" element={<AnalyticsHub />} />
                <Route path="territory" element={<TerritoryMap />} />
                <Route path="performance" element={
                  <AdminRoute>
                    <PerformanceBoard />
                  </AdminRoute>
                } />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/:id" element={<LeadDetail />} />
                <Route path="visits" element={<Visits />} />
                <Route path="visits/map" element={<Visits />} />
                <Route path="visits/new" element={<NewVisit />} />
                <Route path="visits/new-checkin" element={<VisitDetail />} />
                <Route path="visits/:id" element={<VisitDetail />} />
                <Route path="users" element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                } />
                <Route path="sync-monitoring" element={
                  <AdminRoute>
                    <SyncMonitoring />
                  </AdminRoute>
                } />
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
