
# Enhanced Recent Visits Section Plan

## Overview
Transform the static "Recent Visits" card on the Dashboard into a dynamic, context-aware section that shows either upcoming scheduled visits (when no visits exist today) or completed visits with action buttons. Add filter tabs for easy navigation.

## Current State
The Recent Visits section currently displays:
- A static icon with placeholder text
- A single "Go to Visits" button
- No actual visit data shown

## Proposed Changes

### Visual Mockup

**When No Visits Today (Show Schedule):**
```text
┌─────────────────────────────────────────────────────┐
│ Today's Schedule                                 📅 │
├─────────────────────────────────────────────────────┤
│ [Today] [This Week] [Pending] [Completed]          │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐    │
│ │ 09:00 AM  •  Ramesh Kumar                   │    │
│ │ Quote Presentation  •  Vijayawada           │    │
│ └─────────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────────┐    │
│ │ 11:30 AM  •  Sita Devi                      │    │
│ │ Follow-up  •  Guntur                        │    │
│ └─────────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────────┐    │
│ │ 02:00 PM  •  Venkat Rao                     │    │
│ │ Document Collection  •  Tenali              │    │
│ └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ [        ▶ Start First Visit         ]             │
└─────────────────────────────────────────────────────┘
```

**When Visits Completed (Show History):**
```text
┌─────────────────────────────────────────────────────┐
│ Recent Visits                                    📅 │
├─────────────────────────────────────────────────────┤
│ [Today] [This Week] [Pending] [Completed]          │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐    │
│ │ ✓ Ramesh Kumar              Completed 10:45 │    │
│ │   Quote Presentation  •  45 mins            │    │
│ │   [View Details]  [Add Follow-up]           │    │
│ └─────────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────────┐    │
│ │ ⏱ Sita Devi                    In Progress │    │
│ │   Follow-up  •  Started 23 mins ago         │    │
│ │   [View Details]                            │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDashboardData.ts` | Add new hook `useRecentVisits` to fetch visits with filters and scheduled customers |
| `src/pages/Dashboard.tsx` | Replace static Recent Visits card with dynamic component |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/RecentVisitsSection.tsx` | New component for the enhanced visits section |

---

## Detailed Implementation

### 1. New Hook: `useRecentVisits` (in useDashboardData.ts)

Add a new query hook to fetch:

**Scheduled visits (from plan_enrollments + customers):**
```text
Query plan_enrollments for today's plan
Join with customers to get name, city, etc.
Filter out customers already visited today
Return as scheduledVisits[]
```

**Recent/Completed visits:**
```text
Query visits table with filters:
- "today": check_in_time >= today start
- "this_week": check_in_time within current week
- "pending": check_out_time IS NULL
- "completed": check_out_time IS NOT NULL

Join with leads for customer name, location
Order by check_in_time descending
Limit to 10 items
```

Return structure:
```typescript
{
  scheduledVisits: Array<{
    customerId: string;
    customerName: string;
    purpose?: string;
    location?: string;
    scheduledTime?: string;
  }>;
  recentVisits: Array<{
    id: string;
    customerName: string;
    purpose?: string;
    checkInTime: string;
    checkOutTime?: string;
    duration?: number;
    location?: string;
  }>;
  activeFilter: 'today' | 'this_week' | 'pending' | 'completed';
}
```

### 2. New Component: `RecentVisitsSection.tsx`

Component structure:
```text
<Card>
  <CardHeader>
    <Title: "Today's Schedule" or "Recent Visits" based on context>
    <Icon: Calendar>
  </CardHeader>
  
  <FilterTabs>
    - Today (default)
    - This Week
    - Pending
    - Completed
  </FilterTabs>
  
  <CardContent>
    {hasNoVisitsToday && hasSchedule ? (
      <ScheduleList>
        {scheduledVisits.map(visit => (
          <ScheduleItem>
            <Time badge>
            <CustomerName>
            <Purpose>
            <Location>
          </ScheduleItem>
        ))}
        <Button "Start First Visit" />
      </ScheduleList>
    ) : (
      <VisitsList>
        {recentVisits.map(visit => (
          <VisitItem>
            <StatusIcon: ✓ or ⏱>
            <CustomerName>
            <CompletedTime or "In Progress">
            <Purpose>
            <Duration>
            <ActionButtons>
              - View Details
              - Add Follow-up (for completed)
            </ActionButtons>
          </VisitItem>
        ))}
      </VisitsList>
    )}
    
    {isEmpty && <EmptyState />}
  </CardContent>
</Card>
```

### 3. Dashboard Integration

Replace the static Recent Visits card:
```typescript
// Before
<Card className="animate-fade-in card-glass">
  <CardHeader>
    <CardTitle>Recent Visits</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Static placeholder */}
  </CardContent>
</Card>

// After
<RecentVisitsSection />
```

---

## Filter Button Behavior

| Filter | Query | Display |
|--------|-------|---------|
| **Today** | `check_in_time >= today` | Shows today's visits + schedule if empty |
| **This Week** | `check_in_time within week bounds` | All visits this week |
| **Pending** | `check_out_time IS NULL` | In-progress visits only |
| **Completed** | `check_out_time IS NOT NULL` | Completed visits only |

---

## Visit Item Display

### For Scheduled (Upcoming) Visits:
| Element | Source | Style |
|---------|--------|-------|
| Time | Estimated from schedule or "TBD" | Badge, primary color |
| Customer Name | customers.name | Bold, text-sm |
| Purpose | plan_enrollments.notes or default | Text-xs, muted |
| Location | customers.city | Text-xs, muted |

### For Completed Visits:
| Element | Source | Style |
|---------|--------|-------|
| Status Icon | Based on check_out_time | ✓ green or ⏱ yellow |
| Customer Name | leads.name | Bold, text-sm |
| Completed Time | format(check_out_time) | Text-xs |
| Purpose | visits.notes or category | Text-xs, muted |
| Duration | check_out - check_in | Badge |
| View Details Button | Navigate to /dashboard/visits/:id | Outline, small |
| Add Follow-up Button | Navigate to /dashboard/leads/:id/follow-up | Outline, small |

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useDashboardData.ts` | Modify | Add `useRecentVisits` hook with filter support and scheduled visits query |
| `src/components/dashboard/RecentVisitsSection.tsx` | Create | New component with filter tabs, schedule view, and completed visits list |
| `src/pages/Dashboard.tsx` | Modify | Import and use `RecentVisitsSection` component |

---

## Color Coding

| State | Visual |
|-------|--------|
| Scheduled visit | Neutral card with time badge in primary |
| Completed visit | Green check icon, success accent |
| In-progress visit | Yellow clock icon, warning accent |
| Overdue/late visit | Red border accent |

---

## Mobile Considerations

- Filter buttons scroll horizontally if needed
- Visit cards stack vertically
- Action buttons are full-width on mobile
- Time badges are compact
