

# Add Missing Analytics Parameters to Unified Dashboard

## What's Missing

Comparing the original `AnalyticsHub` and `PerformanceReview` pages with the current unified dashboards, these components are absent:

### From AnalyticsHub → OverviewTab (missing in HQ Dashboard)
1. **Avg Duration** metric card (`analyticsData.avgDuration`)
2. **Form Completion Rate** metric card (`analyticsData.formCompletionRate`)
3. **Photo Capture Rate** metric card (`analyticsData.photoCompletionRate`)
4. **Total Visits (all time)** metric card (`analyticsData.totalVisits`)
5. **Visits by Day of Week** bar chart (data is computed but never rendered)

### From AnalyticsHub → BranchPerformanceTab (missing in HQ Dashboard)
6. **Month Selector** (calendar popover to pick month for branch analytics)
7. **Sales Officer Performance Table** — full table with columns: Officer, Prospects (T/A/%), Quotes (T/A/%), Sales (T/A/%), Incentives, Badge

### From PerformanceReview → OrgOverviewTab (missing in HQ Dashboard)
8. **Branch Target vs Actual** stacked bar chart (Prospects T/A, Sales T/A per branch)
9. **Branch Comparison Radar Chart** (Sales%, Visits, Attendance, Prospects, Quotes)
10. **Daily Sales Trend** line chart (per-branch daily lines)
11. **Branch Performance Table** (Branch, Agents, Visits Today/Mo, Sales T/A, Achievement, Attendance, Top Performer)

### From PerformanceReview → BranchDrilldownTab (missing in HQ Dashboard)
12. **Branch Drilldown Section** with branch selector, branch KPIs, Employee Target vs Actual bar chart, Visit Status Pie chart, Employee Performance table with click-to-detail sheet

### From PerformanceBoard (missing in HQ Dashboard)
13. **Complete Rankings** list with "done • this month" subtitle, trend arrows, progress bars (currently only shows top 8, original shows all)

## Plan

### Edit `src/components/dashboard/HQDashboard.tsx`
Add all missing sections inline after existing content, in this order:

1. **Analytics Metrics Row** (4 cards): Avg Duration, Form Rate, Photo Rate, Total Visits — using `analyticsData`
2. **Visits by Day of Week** bar chart — data already computed (`visitsByDayOfWeekData`) but not rendered
3. **Month Selector** — calendar popover for branch analytics month selection
4. **Sales Officer Performance Table** — full table from BranchPerformanceTab with all columns
5. **Org Performance Section**: Branch Target vs Actual bar chart + Branch Comparison Radar chart — using `useOrgPerformance` and `useDailyTrends` hooks
6. **Daily Sales Trend** line chart — per-branch daily lines
7. **Branch Performance Table** — clickable rows with all columns from OrgOverviewTab
8. **Branch Drilldown Section** — branch selector, KPIs, Employee bar chart, Visit Status pie, Employee table with EmployeeDetailSheet
9. **Complete Rankings** — show all performers (not just 8) with trend arrows and "done • this month" subtitles

### Edit `src/components/dashboard/ManagerDashboard.tsx`
Add missing sections:

1. **Analytics Metrics Row**: Avg Duration, Form Rate, Photo Rate, Total Visits
2. **Visits by Day of Week** bar chart
3. **Month Selector** for branch analytics
4. **Sales Officer Performance Table** with all columns
5. **Complete Rankings** with trend arrows and full list

### Files
| Action | File |
|--------|------|
| Edit | `src/components/dashboard/HQDashboard.tsx` — add all missing analytics, performance review, and drilldown sections |
| Edit | `src/components/dashboard/ManagerDashboard.tsx` — add missing analytics metrics, day-of-week chart, performance table, full rankings |

