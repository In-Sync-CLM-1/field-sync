
# Add Back Navigation Buttons to Dashboard Pages

## Problem
Currently, when navigating to pages like Visits, Leads, Planning, or Territory Map, there's no easy way to go back to the Dashboard. Users can only use the sidebar menu or bottom navigation bar to return home.

## Solution
Add a back/home button to the header section of all main pages that allows quick navigation back to the Dashboard.

## Pages to Update

| Page | File | Current Header | Change |
|------|------|----------------|--------|
| Visits | `src/pages/Visits.tsx` | Title only | Add back button |
| Leads | `src/pages/Leads.tsx` | Title + org badge | Add back button |
| Planning | `src/pages/Planning.tsx` | Title only | Add back button |
| New Visit | `src/pages/NewVisit.tsx` | No header | Add header with back button |
| Territory Map | `src/pages/TerritoryMap.tsx` | Filter controls only | Add back button |
| Team Planning | `src/pages/TeamPlanning.tsx` | Title only | Add back button |
| Planning Overview | `src/pages/PlanningOverview.tsx` | Title + filters | Add back button |
| Performance Board | `src/pages/PerformanceBoard.tsx` | Title only | Add back button |

## Implementation Details

### Pattern to Use
Follow the existing pattern from `LeadDetail.tsx` and `VisitDetail.tsx`:

```text
<Button variant="ghost" onClick={() => navigate('/dashboard')}>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Dashboard
</Button>
```

### For Each Page

**1. Visits.tsx** (lines 83-91)
- Add ArrowLeft icon import
- Add back button before the "Visits" title

**2. Leads.tsx** (lines 72-99)
- Add ArrowLeft icon import  
- Add back button in the header row

**3. Planning.tsx** (lines 246-263 for manager view, lines 500+ for agent view)
- Add ArrowLeft icon import
- Add back button in both manager and agent views

**4. NewVisit.tsx**
- Add a header section with back button → `/dashboard/visits`
- Currently has no header at all

**5. TerritoryMap.tsx**
- Add back button at top of page
- Navigate to `/dashboard`

**6. TeamPlanning.tsx**
- Add back button to header
- Navigate to `/dashboard/planning`

**7. PlanningOverview.tsx**
- Add back button to header
- Navigate to `/dashboard/planning`

**8. PerformanceBoard.tsx**
- Add back button to header
- Navigate to `/dashboard`

## Visual Design
- Use `variant="ghost"` for subtle appearance
- Use `size="sm"` for compact size
- Include ArrowLeft icon with label "Dashboard" or just icon on mobile
- Position at the start of the header row

## Files to Modify
1. `src/pages/Visits.tsx`
2. `src/pages/Leads.tsx`
3. `src/pages/Planning.tsx`
4. `src/pages/NewVisit.tsx`
5. `src/pages/TerritoryMap.tsx`
6. `src/pages/TeamPlanning.tsx`
7. `src/pages/PlanningOverview.tsx`
8. `src/pages/PerformanceBoard.tsx`
