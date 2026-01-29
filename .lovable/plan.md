
# Enhanced Dashboard Metrics Plan

## Overview
Transform the current simple metric cards into rich, interactive cards with progress indicators, detailed breakdowns, color-coded status indicators, and click-to-expand functionality.

## Current State
The Dashboard shows four basic metric cards:
- **Visits Today**: Shows just a number (e.g., "0")
- **This Week**: Shows a number (e.g., "3") with comparison to last week
- **Active Visits**: Shows count of visits without checkout
- **Total Leads**: Shows total count only

## Proposed Changes

### Visual Mockup (New Design)
```text
+-------------------------------------------+
| VISITS TODAY                        [📍]  |
| 0 of 5 planned                            |
| [████████████████░░░░░░░░░░░░░░░░░] 0%    |
| ↑ 15% vs last week                        |
+-------------------------------------------+

+-------------------------------------------+
| THIS WEEK                           [📈]  |
| 3 completed | 12 planned                  |
| ↑ 20% from last week                      |
+-------------------------------------------+

+-------------------------------------------+
| ACTIVE VISITS                       [📅]  |
| 1 in progress                             |
| Started 45 mins ago                       |
+-------------------------------------------+

+-------------------------------------------+
| TOTAL PROSPECTS                     [👥]  |
| 101 open leads                            |
| 23 need follow-up today                   |
+-------------------------------------------+
```

---

## Files to Modify

### 1. `src/hooks/useDashboardData.ts` - Enhanced Data Hook

Add new data points to the `useMyStats` hook:

| New Field | Description | Query |
|-----------|-------------|-------|
| `plannedVisitsToday` | From daily_plans table | Query today's plan for prospects_target |
| `plannedVisitsWeek` | Week's planned visits | Sum of prospects_target for this week |
| `activeVisitStartTime` | Oldest active visit check-in | Query visits without checkout, get oldest |
| `openLeadsCount` | Leads with status = 'lead' | Count leads with open status |
| `followUpToday` | Leads with follow_up_date = today | Count leads needing follow-up today |
| `weeklyTrend` | Percentage change week over week | Calculate from existing data |

### 2. `src/components/dashboard/MetricCard.tsx` - Enhanced Component

Add new props to support rich content:

| New Prop | Type | Purpose |
|----------|------|---------|
| `progress` | number (0-100) | Show progress bar when provided |
| `primaryText` | string | Main display text (e.g., "0 of 5 planned") |
| `secondaryText` | string | Additional info (e.g., "Started 45 mins ago") |
| `status` | 'success' \| 'warning' \| 'danger' | Color-code the card border/accent |
| `onClick` | function | Make card clickable to navigate |

### 3. `src/pages/Dashboard.tsx` - Apply New Features

Update the stats array to use enhanced data:

| Metric | Primary Text | Secondary Text | Status Logic |
|--------|--------------|----------------|--------------|
| Visits Today | "X of Y planned" | Progress bar | Green: ≥80%, Yellow: 40-79%, Red: <40% |
| This Week | "X completed \| Y planned" | Trend arrow | Green: on track, Yellow: behind |
| Active Visits | "X in progress" | "Started N mins ago" | Yellow if >2 hours |
| Total Prospects | "X open leads" | "Y need follow-up today" | Red if follow-ups > 10 |

---

## Detailed Implementation

### Data Hook Changes (`useDashboardData.ts`)

New queries to add:

**Planned visits from daily_plans:**
```text
Query daily_plans for current user + today's date
Get prospects_target as plannedVisitsToday
```

**Active visit duration:**
```text
Query visits where check_out_time IS NULL
Get oldest check_in_time
Calculate minutes since start
```

**Follow-up leads:**
```text
Query leads where follow_up_date = today
AND status IN ('lead', 'contacted', 'follow_up')
Count as followUpToday
```

**Open leads:**
```text
Query leads where status NOT IN ('enrolled', 'converted', 'closed')
Count as openLeadsCount
```

### MetricCard Enhancement

New component structure:
```text
<Card onClick={onClick} className={statusBorderClass}>
  <Title + Icon>
  
  <Primary Value with optional progress>
    "0 of 5 planned"
    [Progress Bar - optional]
  
  <Secondary Info>
    "↑ 15% vs last week" (with trend arrow)
  
  <Additional Context - optional>
    "23 need follow-up today"
</Card>
```

### Status Color Logic

| Condition | Color | Visual |
|-----------|-------|--------|
| On track (≥80% completion) | Green | Green border accent |
| Needs attention (40-79%) | Yellow/Gold | Gold border accent |
| Urgent (<40% or overdue) | Red | Red border accent |

### Click Navigation

| Card | Navigates To |
|------|--------------|
| Visits Today | `/dashboard/visits` |
| This Week | `/dashboard/visits` with week filter |
| Active Visits | `/dashboard/visits?status=active` |
| Total Prospects | `/dashboard/leads` |

---

## Summary of Changes

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useDashboardData.ts` | Modify | Add 6 new data fields to useMyStats |
| `src/components/dashboard/MetricCard.tsx` | Modify | Add progress bar, status colors, click handler, rich text display |
| `src/pages/Dashboard.tsx` | Modify | Update stats configuration with new props and navigation |

---

## Technical Notes

### Progress Bar Styling
- Use the existing `<Progress>` component from `@/components/ui/progress`
- Style with brand colors: Teal for progress fill
- Compact height (h-1.5) to fit in metric cards

### Trend Arrows
- Use lucide icons: `TrendingUp`, `TrendingDown`, `Minus`
- Color: Green for up, Red for down, Gray for neutral

### Mobile Responsiveness
- Cards remain in 2-column grid on mobile
- Text truncates gracefully
- Progress bar scales to card width

### Real-Time Updates
- Hook already uses React Query with auto-refetch
- Dashboard will update when user returns from other pages
