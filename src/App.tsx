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
import { PlatformAdminRoute } from "@/components/PlatformAdminRoute";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ServiceWorkerUpdateHandler } from "@/components/ServiceWorkerUpdateHandler";
import { LandingRoute } from "@/components/LandingRoute";
import Layout from "@/components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewLead from "./pages/NewLead";
import TeamAndBranches from "./pages/TeamAndBranches";
import Branches from "./pages/Branches";
import Teams from "./pages/Teams";
import TeamDashboard from "./pages/TeamDashboard";
import BranchDashboard from "./pages/BranchDashboard";
import AnalyticsHub from "./pages/AnalyticsHub";
import TerritoryMap from "./pages/TerritoryMap";
import PerformanceBoard from "./pages/PerformanceBoard";
import PerformanceReview from "./pages/PerformanceReview";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Visits from "./pages/Visits";
import VisitDetail from "./pages/VisitDetail";
import NewVisit from "./pages/NewVisit";
import Users from "./pages/Users";
import SyncMonitoring from "./pages/SyncMonitoring";
import Planning from "./pages/Planning";
// TeamPlanning is now integrated into TeamAndBranches
import PlanningOverview from "./pages/PlanningOverview";
import BranchAnalytics from "./pages/BranchAnalytics";
import Landing from "./pages/Landing";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import OrganizationsDashboard from "./pages/PlatformAdmin/OrganizationsDashboard";
import OrganizationDetail from "./pages/PlatformAdmin/OrganizationDetail";

import OrgChart from "./pages/OrgChart";
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
              {/* Public routes */}
              <Route path="/" element={<LandingRoute />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected but subscription-exempt routes */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/subscription-expired" element={
                <ProtectedRoute>
                  <SubscriptionExpired />
                </ProtectedRoute>
              } />
              
              {/* Platform Admin routes - bypass subscription gate */}
              <Route path="/platform-admin" element={
                <PlatformAdminRoute>
                  <OrganizationsDashboard />
                </PlatformAdminRoute>
              } />
              <Route path="/platform-admin/organizations" element={
                <PlatformAdminRoute>
                  <OrganizationsDashboard />
                </PlatformAdminRoute>
              } />
              <Route path="/platform-admin/organizations/:id" element={
                <PlatformAdminRoute>
                  <OrganizationDetail />
                </PlatformAdminRoute>
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
                <Route index element={<Dashboard />} />
                <Route path="team-dashboard" element={<TeamDashboard />} />
                <Route path="branch-dashboard" element={<BranchDashboard />} />
                <Route path="planning" element={<Planning />} />
                <Route path="planning/team" element={<Teams />} />
                <Route path="planning/overview" element={<PlanningOverview />} />
                <Route path="team" element={<Teams />} />
                <Route path="branches" element={<Branches />} />
                <Route path="teams" element={<Teams />} />
                <Route path="analytics" element={<AnalyticsHub />} />
                <Route path="analytics/branch" element={<AnalyticsHub />} />
                <Route path="territory" element={<TerritoryMap />} />
                <Route path="performance" element={
                  <AdminRoute>
                    <PerformanceBoard />
                  </AdminRoute>
                } />
                <Route path="performance-review" element={
                  <AdminRoute>
                    <PerformanceReview />
                  </AdminRoute>
                } />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/new" element={<NewLead />} />
                <Route path="leads/:id" element={<LeadDetail />} />
                <Route path="visits" element={<Visits />} />
                <Route path="visits/calendar" element={<Visits />} />
                <Route path="visits/map" element={<TerritoryMap />} />
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
                <Route path="subscription" element={
                  <AdminRoute>
                    <SubscriptionManagement />
                  </AdminRoute>
                } />
                <Route path="attendance" element={<Attendance />} />
                <Route path="profile" element={<Profile />} />
                <Route path="org-chart" element={
                  <AdminRoute>
                    <OrgChart />
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
