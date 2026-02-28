

# Combined Dashboard Redesign + Unified Routing

## Summary
Merge all dashboards into a single `/dashboard` route that auto-renders the correct view per role. Redesign all three tiers with rich visual components (StatusKPICard, PipelineCard, ActivityFeed, MiniChart). Add a view controller (Today/Week/Month) to each. Remove separate `/dashboard/team-dashboard` and `/dashboard/branch-dashboard` routes.

## Files to Create

### `src/components/dashboard/DashboardViewControl.tsx`
Period toggle: **Today | This Week | This Month** — compact button group at top of every dashboard. Manages state via props/callback. Displays current date label.

### `src/components/dashboard/StatusKPICard.tsx`
Rich KPI card inspired by reference image:
- Colored left border accent (teal/green/amber/red)
- Large bold metric + subtitle
- Status badge (e.g. "Active", "Critical", "+12%")
- Semi-transparent background icon (right-aligned)
- Click-to-navigate

### `src/components/dashboard/PipelineCard.tsx`
Horizontal stage pipeline visualization:
- Row of stage boxes with count + label
- Color-coded per stage (e.g. Planned=blue, In Progress=amber, Completed=green, Missed=red)
- Used for visit pipeline and lead pipeline

### `src/components/dashboard/ActivityFeed.tsx`
Scrollable activity log:
- Avatar initials + name + action + timestamp
- Status-colored icons (green check, amber clock, red alert)
- ScrollArea with max height, "View All" link

### `src/components/dashboard/MiniChart.tsx`
Small sparkline component using recharts for 7-day visit trends, embeddable inside cards.

### `src/components/dashboard/RoleDashboard.tsx`
Role router component:
- Detects user role from `user_roles` table
- admin/super_admin/platform_admin → renders `<HQDashboard />`
- branch_manager → renders `<ManagerDashboard />`
- sales_officer → renders `<AgentDashboard />`
- No redirect, no separate routes — inline rendering

### `src/components/dashboard/HQDashboard.tsx`
Redesigned Head Office dashboard (replaces BranchDashboard content):
- DashboardViewControl at top
- 4 StatusKPICards: Visits Today (with +/- vs yesterday badge), Active Agents, Attendance Rate, Plan Achievement
- PipelineCard: Branch performance ranked
- ActivityFeed: Recent visits across org
- Bottom row: Alerts (branches with <50% attendance), Quick Actions

### `src/components/dashboard/ManagerDashboard.tsx`
Redesigned Branch Manager dashboard (replaces TeamDashboard content):
- DashboardViewControl at top
- 4 StatusKPICards: Team Visits, Active Agents, Attendance, Plan Completion
- PipelineCard: Visit status pipeline (Planned→In Progress→Completed→Cancelled)
- Agent Activity list with avatars and status badges
- Target vs Achievement progress bars

### `src/components/dashboard/AgentDashboard.tsx`
Redesigned Agent dashboard (replaces Dashboard content):
- DashboardViewControl at top
- 4 StatusKPICards (reduced from 7): Visits Today, This Week, Active Visits, Overdue Follow-ups
- PipelineCard: Today's Plan pipeline (Planned→Visited→Pending→Follow-up)
- Follow-ups Due section
- Recent Visits (keep existing RecentVisitsSection)
- Quick Actions

## Files to Edit

### `src/App.tsx`
- Change `/dashboard` index route from `<Dashboard />` to `<RoleDashboard />`
- Remove `team-dashboard` and `branch-dashboard` routes (or redirect them to `/dashboard`)
- Keep BranchDashboard and TeamDashboard imports only if used as sub-components

### `src/components/AppSidebar.tsx`
- **Admin/Super Admin/Platform Admin**: Change OVERVIEW Dashboard path from `/dashboard/branch-dashboard` to `/dashboard`
- **Branch Manager**: Remove "Team Dashboard" entry from TEAM section; change MY WORK Dashboard to `/dashboard`
- All roles now use `/dashboard` as their single dashboard link

### `src/hooks/useBranchDashboard.ts`
- Accept optional `period` parameter ('today' | 'week' | 'month')
- Adjust date range filtering based on period
- Add yesterday's visit count for comparison badge

### `src/hooks/useTeamDashboard.ts`
- Accept optional `period` parameter
- Adjust date range filtering based on period

### `src/hooks/useDashboardData.ts` (`useMyStats`)
- Accept optional `period` parameter
- Add month-level aggregation option

## Technical Notes
- All new components use existing UI primitives: Card, Badge, Progress, ScrollArea, Button
- Charts use recharts (already installed)
- No database changes required — all data already exists in visits, attendance, daily_plans, profiles, branches tables
- No new routes — unified under `/dashboard`
- Existing MetricCard kept for Analytics pages; new StatusKPICard used on dashboards

