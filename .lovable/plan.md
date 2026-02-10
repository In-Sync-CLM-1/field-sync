

# Performance Review Hub -- Visual, Tabular, Map & AI Insights

## Overview

Build a comprehensive **Performance Review** page with rich visual displays at every drill-down level (Organization > Branch > Employee), including charts, tables, a geographic heatmap, and AI-generated key insights. Also seed richer demo data to make the visualizations compelling.

---

## 1. Demo Data Seeding (Pre-requisite)

The current data has only 3 daily_plan entries per user (sparse). To make charts and insights meaningful, the seed function needs to generate denser data.

**Update `supabase/functions/seed-demo-data/index.ts`** to add a `mode: "performance-review"` option that seeds:

- **Daily Plans**: 30 days of daily_plans for all 10 agents with realistic variance (some agents hit 120% targets, some at 60%, creating interesting patterns)
- **Visits**: 300+ visits spread across the month with GPS coordinates per branch city, varying completion rates per agent
- **Attendance**: Full month coverage with some agents having gaps (absenteeism patterns)
- **Location History**: Denser breadcrumbs for the last 7 days to make heatmaps work

This ensures charts show trends, comparisons show contrast, and the AI has enough signal to generate insights.

---

## 2. Page Structure: `/dashboard/performance-review`

### Tab Layout

```text
[ Organization Overview ] [ Branch Drill-Down ] [ Map View ] [ AI Insights ]
```

Each tab has both graphical and tabular components.

---

## 3. Tab 1: Organization Overview (HO/Admin View)

### Graphical
- **KPI Summary Cards** (4 cards): Total Sales, Avg Achievement %, Total Visits, Attendance Rate -- with trend arrows comparing to last month
- **Stacked Bar Chart** (Recharts): Branch-wise Target vs Actual for Prospects / Quotes / Sales side by side
- **Radar/Spider Chart**: Branch comparison across 5 dimensions (Sales Achievement, Visit Completion, Attendance, Prospect Conversion, Quote Conversion)
- **Line Chart**: Daily sales trend across all branches overlaid (one line per branch, last 30 days)

### Tabular
- **Branch Comparison Table**: Branch Name | Active Agents | Visits (Today/Month) | Sales Target | Sales Actual | Achievement % | Attendance Rate | Top Performer
- Each row is clickable to drill into Branch Detail (Tab 2 auto-filters)

---

## 4. Tab 2: Branch Drill-Down

Dropdown to select a branch (auto-selected when clicking from Tab 1).

### Graphical
- **Branch KPI Cards**: Sales Achievement, Visit Count, Attendance Days, Avg Visit Duration
- **Grouped Bar Chart**: Per-employee Target vs Actual (Prospects, Quotes, Sales)
- **Pie/Donut Chart**: Visit status distribution (Completed, In-Progress, Cancelled)
- **Sparkline mini-charts** in the table rows showing each employee's 7-day visit trend

### Tabular
- **Employee Performance Table**: Name | Visits Today | Visits This Month | Sales (T/A/%) | Attendance Days | Avg Visit Duration | Last Active
- Clickable rows expand an **Employee Detail Panel** (slide-out sheet):
  - Profile card with name, designation, branch
  - Monthly summary: visits, attendance, plan achievement
  - **Small line chart**: Daily visits over last 30 days
  - **Plan Achievement Gauges**: 3 circular progress indicators for Prospects, Quotes, Sales
  - Last 7 days timeline (attendance + visits in a compact list)

---

## 5. Tab 3: Map View

Reuse the existing Mapbox infrastructure from TerritoryMap.tsx.

### Displays
- **Visit Heatmap Layer**: Color-coded density of visits across geographies using location_history and visit check-in coordinates. Darker = more visits.
- **Branch Territory Markers**: Large markers for each branch location with a popup showing branch KPIs (agents, visits, sales %)
- **Agent Trail Lines**: Toggle to show today's agent routes (color-coded per agent, reusing existing route drawing logic)
- **Customer Pin Clusters**: Existing cluster logic from TerritoryMap, filtered to the selected branch or org-wide
- **Heat Zones**: Using Mapbox heatmap layer on visit coordinates to visualize coverage gaps

### Controls
- Branch filter dropdown
- Date range picker
- Toggle: Heatmap / Pins / Routes

---

## 6. Tab 4: AI Insights

Use a backend function that calls Lovable AI (google/gemini-2.5-flash) to analyze the aggregated performance data and return actionable insights.

### New Edge Function: `supabase/functions/generate-performance-insights/index.ts`
- Accepts `organization_id` and optional `branch_id`
- Queries aggregated data: daily_plans, visits, attendance for the current month
- Sends structured data summary to the AI model with a prompt like:
  > "You are a sales performance analyst. Given the following branch and employee performance data for this month, provide 5-7 key insights with actionable recommendations. Focus on: top/bottom performers, attendance vs sales correlation, branch comparisons, trend anomalies, and improvement opportunities."
- Returns structured JSON: `{ insights: [{ title, description, type: 'positive'|'warning'|'action', metric?, recommendation? }] }`

### Frontend Display
- **Insight Cards**: Each insight rendered as a colored card (green for positive, amber for warning, blue for action items)
- **Key Metrics Highlighted**: AI identifies which numbers matter most and they are shown prominently
- **Refresh Button**: Re-generate insights on demand
- Example insights the AI might generate:
  - "Mumbai Central branch leads with 87% sales achievement, outperforming Delhi North by 23 points"
  - "Vikram Singh has 100% target achievement but lowest visit count -- high conversion efficiency"
  - "3 agents in Delhi North had 4+ absent days this month, correlating with 15% lower sales vs target"
  - "Wednesday is the most productive day across all branches (32% more visits than Friday)"

---

## 7. Navigation & Access

### Sidebar Update (`AppSidebar.tsx`)
- Replace the current "Performance" link with "Performance Review" pointing to `/dashboard/performance-review`
- Keep it visible for `branch_manager`, `admin`, `super_admin`, `platform_admin`
- Branch managers auto-scope to their branch (skip org-level tab)

### Route (`App.tsx`)
- Add route `/dashboard/performance-review` pointing to new `PerformanceReview.tsx`

---

## 8. Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/pages/PerformanceReview.tsx` | Main page with 4 tabs |
| `src/hooks/usePerformanceReview.ts` | Data fetching hooks for org, branch, employee levels |
| `src/components/performance/OrgOverviewTab.tsx` | Organization-level charts + table |
| `src/components/performance/BranchDrilldownTab.tsx` | Branch-level charts + employee table + detail panel |
| `src/components/performance/MapViewTab.tsx` | Mapbox heatmap + territory view |
| `src/components/performance/AIInsightsTab.tsx` | AI-generated insights display |
| `src/components/performance/EmployeeDetailSheet.tsx` | Slide-out employee detail with gauges + chart |
| `supabase/functions/generate-performance-insights/index.ts` | AI insights edge function |

### Modified Files
| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | Update Performance link to new route |
| `src/App.tsx` | Add `/dashboard/performance-review` route |
| `supabase/functions/seed-demo-data/index.ts` | Add performance-review seeding mode with denser data |

### No Database Changes Required
All data exists in: `profiles`, `branches`, `visits`, `attendance`, `daily_plans`, `location_history`, `customers`.

