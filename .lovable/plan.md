

# Unify Analytics & Performance into Dashboard (Single View, No Tabs)

## Changes

### 1. Edit `src/components/dashboard/HQDashboard.tsx`
- Remove the `ActivityFeed` section (lines 106-111)
- Remove the ActivityFeed import
- Add inline after the Pipeline card:
  - **Analytics section**: Visit Trends line chart (30 days) + Visits by Day of Week bar chart from OverviewTab, using `useAnalyticsData` hook
  - **Branch Performance section**: KPI cards (Total Sales, Conversion Rate, Incentives, Sales Officers) + Target vs Actual bar chart from BranchPerformanceTab, using `useBranchAnalytics` hook
  - **Leaderboard section**: Top 3 podium + rankings list from PerformanceBoard, using `usePerformanceData` hook
- Remove "Analytics" and "Performance" quick action buttons (lines 142-147)

### 2. Edit `src/components/dashboard/ManagerDashboard.tsx`
- Add inline after Target vs Achievement:
  - **Analytics section**: Sales Trend chart + Target vs Actual bar chart using `useBranchAnalytics`
  - **Leaderboard section**: Top performers + rankings using `usePerformanceData`
- Remove "Performance" quick action button (lines 162-164)

### 3. Edit `src/components/AppSidebar.tsx`
- Remove the entire ANALYTICS section from `branch_manager`, `admin`/`super_admin`, and `platform_admin` roles (Analytics + Performance Review entries)

### 4. Edit `src/App.tsx`
- Redirect `/dashboard/analytics` and `/dashboard/performance-review` to `/dashboard`

### Files
| Action | File |
|--------|------|
| Edit | `src/components/dashboard/HQDashboard.tsx` — remove ActivityFeed, add analytics charts + leaderboard inline |
| Edit | `src/components/dashboard/ManagerDashboard.tsx` — add analytics charts + leaderboard inline |
| Edit | `src/components/AppSidebar.tsx` — remove ANALYTICS section for all roles |
| Edit | `src/App.tsx` — redirect old analytics/performance routes |

