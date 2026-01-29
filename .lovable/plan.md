
# Dashboard Enhancement Plan: New Metrics & Consistent Card Sizing

## Overview
Add three new metric cards (Pending Visits, Overdue Follow-ups, Average Visit Duration) to the dashboard and ensure all 7 cards have consistent sizing, padding, and typography.

## Current State
The Dashboard displays 4 metric cards in a responsive grid:
- Visits Today (with progress bar)
- This Week
- Active Visits
- Total Prospects

Current issues:
- Only 4 metrics tracked
- Cards have variable content heights due to optional progress bars and secondary text
- No dedicated metrics for pending visits, overdue follow-ups, or visit duration

## New Metrics to Add

| Metric | Primary Text | Secondary Text | Status Logic |
|--------|--------------|----------------|--------------|
| **Pending Visits** | "X visits pending today" | "Y completed so far" | Green: 0 pending, Yellow: 1-3, Red: >3 |
| **Overdue Follow-ups** | "X overdue" | "Last Y days" | Green: 0, Yellow: 1-5, Red: >5 |
| **Avg Visit Duration** | "X mins" | "Based on last 30 days" | Neutral (no status needed) |

## Grid Layout Change
```text
Current (4 cards):
+--------+--------+--------+--------+
| Today  | Week   | Active | Leads  |
+--------+--------+--------+--------+

New (7 cards - 2 rows on desktop, stacked on mobile):
+--------+--------+--------+--------+
| Today  | Week   | Active | Leads  |
+--------+--------+--------+--------+
|Pending |Overdue | Avg    |        |
|Visits  |FollowUp|Duration|        |
+--------+--------+--------+--------+
```

Mobile view: 2 columns, cards stack naturally

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDashboardData.ts` | Add 3 new data points to useMyStats |
| `src/components/dashboard/MetricCard.tsx` | Add fixed height class, consistent padding |
| `src/pages/Dashboard.tsx` | Add 3 new metric cards to stats array |

---

## Detailed Changes

### 1. Data Hook Updates (`useDashboardData.ts`)

New queries to add:

**Pending visits today:**
```text
pendingVisitsToday = plannedVisitsToday - visitsToday (minimum 0)
```

**Overdue follow-ups:**
```text
Query leads where:
- follow_up_date < today
- status NOT IN ('enrolled', 'converted', 'closed')
Count as overdueFollowUps
```

**Average visit duration:**
```text
Query visits from last 30 days with check_out_time
Calculate average (check_out - check_in) in minutes
Return as avgVisitDuration
```

New fields returned:
- `pendingVisitsToday: number` (calculated)
- `overdueFollowUps: number` (queried)
- `avgVisitDuration: number` (calculated)

### 2. MetricCard Component (`MetricCard.tsx`)

Add consistent sizing:
- Fixed minimum height: `min-h-[140px]`
- Consistent padding: `p-4` (changed from `p-3`)
- Standardized text sizes:
  - Title: `text-xs` (uppercase, tracking-wide)
  - Primary value: `text-xl` (changed from `text-2xl` for fit)
  - Secondary text: `text-xs`
  - Progress label: `text-[10px]`

Updated component structure:
```text
<Card className="p-4 min-h-[140px] flex flex-col">
  <Header: Title + Icon (fixed height)>
  <Primary Value (flex-grow to center content)>
  <Footer: Progress/Trend/Secondary (fixed at bottom)>
</Card>
```

### 3. Dashboard Updates (`Dashboard.tsx`)

Add status helper functions:
```typescript
function getPendingStatus(pending: number): StatusColor {
  if (pending === 0) return 'success';
  if (pending <= 3) return 'warning';
  return 'danger';
}

function getOverdueStatus(overdue: number): StatusColor {
  if (overdue === 0) return 'success';
  if (overdue <= 5) return 'warning';
  return 'danger';
}
```

Add 3 new stats to the array:
```typescript
{
  label: 'Pending Visits',
  value: myStats?.pendingVisitsToday || 0,
  primaryText: `${myStats?.pendingVisitsToday || 0} pending today`,
  secondaryText: `${myStats?.visitsToday || 0} completed`,
  icon: Clock,
  accentColor: 'info',
  status: getPendingStatus(myStats?.pendingVisitsToday || 0),
  onClick: () => navigate('/dashboard/visits'),
},
{
  label: 'Overdue Follow-ups',
  value: myStats?.overdueFollowUps || 0,
  primaryText: `${myStats?.overdueFollowUps || 0} overdue`,
  secondaryText: 'Need immediate attention',
  icon: AlertTriangle,
  accentColor: 'destructive',
  status: getOverdueStatus(myStats?.overdueFollowUps || 0),
  onClick: () => navigate('/dashboard/leads?filter=overdue'),
},
{
  label: 'Avg Duration',
  value: myStats?.avgVisitDuration || 0,
  primaryText: `${myStats?.avgVisitDuration || 0} mins`,
  secondaryText: 'Last 30 days average',
  icon: Timer,
  accentColor: 'success',
  status: 'neutral',
  onClick: () => navigate('/dashboard/visits'),
}
```

---

## Card Consistency Improvements

### Padding & Spacing
| Element | Current | New |
|---------|---------|-----|
| Card padding | `p-3` | `p-4` |
| Header margin | `mb-2` | `mb-3` |
| Icon size | `h-8 w-8` | `h-8 w-8` (unchanged) |
| Value font | `text-2xl` | `text-xl` |

### Fixed Height Structure
```text
Card (min-h-[140px], flex flex-col)
├── Header Row (flex-shrink-0)
│   ├── Title (text-xs uppercase)
│   └── Icon (h-8 w-8)
├── Content Area (flex-1)
│   └── Primary Text (text-xl font-bold)
└── Footer Area (flex-shrink-0)
    ├── Progress Bar (optional)
    ├── Trend Arrow + Change Text
    └── Secondary Text
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useDashboardData.ts` | Modify | Add overdueFollowUps query, avgVisitDuration calculation, pendingVisitsToday calculation |
| `src/components/dashboard/MetricCard.tsx` | Modify | Add min-height, adjust padding, use flex layout for consistent height |
| `src/pages/Dashboard.tsx` | Modify | Add 3 new stats, import Timer and AlertTriangle icons, add status functions |

---

## Visual Preview

### Desktop (7 cards, 4-column grid)
```text
┌────────────────┬────────────────┬────────────────┬────────────────┐
│ VISITS TODAY   │ THIS WEEK      │ ACTIVE VISITS  │ TOTAL PROSPECTS│
│ 2 of 5 planned │ 8 completed    │ 1 in progress  │ 45 open leads  │
│ [████░░░] 40%  │ 15 planned     │ Started 23m    │ 5 follow-up    │
│ ↑ 15% vs week  │ ↑ vs last week │                │                │
├────────────────┼────────────────┼────────────────┼────────────────┤
│ PENDING VISITS │ OVERDUE        │ AVG DURATION   │                │
│ 3 pending today│ 2 overdue      │ 28 mins        │                │
│ 2 completed    │ Need attention │ Last 30 days   │                │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

### Mobile (2-column grid, cards stack)
```text
┌──────────┬──────────┐
│ TODAY    │ WEEK     │
│ 2 of 5   │ 8 done   │
├──────────┼──────────┤
│ ACTIVE   │ PROSPECTS│
│ 1 active │ 45 open  │
├──────────┼──────────┤
│ PENDING  │ OVERDUE  │
│ 3 left   │ 2 urgent │
├──────────┼──────────┤
│ DURATION │          │
│ 28 mins  │          │
└──────────┴──────────┘
```

---

## Color Coding Summary

| Status | Color | Used For |
|--------|-------|----------|
| **Success (Green)** | `ring-success/30` | ≥80% completion, 0 overdue, 0 pending |
| **Warning (Yellow)** | `ring-warning/30` | 40-79% completion, 1-5 overdue, 1-3 pending |
| **Danger (Red)** | `ring-destructive/30` | <40% completion, >5 overdue, >3 pending |
| **Neutral** | No ring | Informational cards like Avg Duration |
