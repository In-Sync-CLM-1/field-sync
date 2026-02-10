
# Enhanced Visit Management - All 5 Features

## Overview
This plan adds five major features to the visit management system: Calendar View, Route Optimization, Bulk Visit Creation, Visit Checklist Templates, and Reschedule/Cancel functionality.

---

## 1. Database Changes

### New columns on `visits` table:
- `purpose` (text, nullable) -- e.g. Meeting, Follow-up, Delivery, etc.
- `scheduled_date` (date, nullable) -- for scheduled/planned visits
- `scheduled_time` (time, nullable) -- planned time
- `status` (text, default 'in_progress') -- values: scheduled, in_progress, completed, cancelled, rescheduled
- `cancelled_at` (timestamptz, nullable)
- `cancel_reason` (text, nullable)
- `rescheduled_from` (uuid, nullable, FK to visits.id) -- links to original visit
- `checklist` (jsonb, nullable) -- stores checklist items and completion state

### New table: `visit_checklist_templates`
- `id` (uuid, PK)
- `organization_id` (uuid, NOT NULL)
- `name` (text, NOT NULL)
- `items` (jsonb, NOT NULL) -- array of {label, required}
- `is_active` (boolean, default true)
- `created_at`, `updated_at`
- RLS: org-scoped read for all users, admin-only write

---

## 2. Calendar View for Scheduling Visits

### New page: `src/pages/VisitCalendar.tsx`
- Monthly calendar grid showing visits per day (color-coded by status)
- Click a day to see that day's visits in a side panel
- Click a visit to navigate to its detail page
- "Schedule Visit" button to create a future-dated visit
- Toggle between Calendar and List view on the Visits page

### Changes:
- **`src/pages/Visits.tsx`**: Add a toggle (List | Calendar) at the top. When "Calendar" is selected, render the new calendar component
- **`src/App.tsx`**: Add route `/dashboard/visits/calendar`
- Uses existing `Calendar` component from shadcn as the base

---

## 3. Route Optimization for Field Agents

### New component: `src/components/RouteOptimizer.tsx`
- Takes a list of scheduled visits for a day
- Calculates optimized order using nearest-neighbor algorithm (client-side, using the Haversine formula already in `NewVisit.tsx`)
- Shows ordered list with estimated distances between stops
- "Open in Google Maps" button that generates a multi-stop directions URL
- Accessible from the Calendar day view and Planning page

### How it works:
- Fetches all visits scheduled for a given day
- Gets customer locations from the leads/customers table
- Sorts them by nearest-neighbor from agent's current location
- Generates Google Maps URL with waypoints

---

## 4. Bulk Visit Creation

### New component: `src/components/BulkVisitCreator.tsx`
- Modal/dialog accessible from the Visits page
- Multi-select leads/customers from a searchable list
- Set common fields: scheduled date, purpose, notes
- Preview selected leads before creating
- Creates multiple visit records with `status: 'scheduled'`

### Changes:
- **`src/pages/Visits.tsx`**: Add "Bulk Schedule" button next to the existing "+" button
- **`src/hooks/useVisits.tsx`**: Add `bulkCreateVisits` mutation

---

## 5. Visit Checklist Templates

### Admin: `src/components/ChecklistTemplateManager.tsx`
- Admin-only UI to create/edit checklist templates
- Each template has a name and list of items (label + required flag)
- Accessible from a settings/admin area

### Agent usage:
- **`src/pages/NewVisit.tsx`**: Add optional checklist template selector
- **`src/pages/VisitDetail.tsx`**: Show checklist items with checkboxes, saved to `visits.checklist` as JSONB
- Agents tick off items during the visit; completion state persists

---

## 6. Reschedule/Cancel Functionality

### Changes to `src/pages/VisitDetail.tsx`:
- Add "Reschedule" button (for scheduled/in-progress visits)
  - Opens a dialog to pick a new date/time
  - Creates a new visit record linked via `rescheduled_from`
  - Marks original as `status: 'rescheduled'`
- Add "Cancel" button
  - Opens a dialog for cancel reason
  - Sets `status: 'cancelled'`, `cancelled_at`, `cancel_reason`

### Changes to `src/hooks/useVisits.tsx`:
- Add `rescheduleVisit` and `cancelVisit` mutations
- Update queries to filter by status

---

## Technical Details

### Files to Create:
1. `src/pages/VisitCalendar.tsx` -- Calendar view page
2. `src/components/RouteOptimizer.tsx` -- Route optimization component
3. `src/components/BulkVisitCreator.tsx` -- Bulk visit creation dialog
4. `src/components/ChecklistTemplateManager.tsx` -- Admin checklist template CRUD
5. `src/components/VisitChecklist.tsx` -- Checklist display/interaction for agents
6. `src/components/RescheduleDialog.tsx` -- Reschedule dialog
7. `src/components/CancelVisitDialog.tsx` -- Cancel dialog

### Files to Modify:
1. `src/pages/Visits.tsx` -- Add calendar toggle, bulk schedule button
2. `src/pages/NewVisit.tsx` -- Add scheduled date, purpose, checklist template selector
3. `src/pages/VisitDetail.tsx` -- Add checklist, reschedule/cancel buttons, status display
4. `src/hooks/useVisits.tsx` -- Add new mutations and update interfaces
5. `src/App.tsx` -- Add calendar route

### Database Migration:
- ALTER `visits` table with new columns
- CREATE `visit_checklist_templates` table with RLS policies

### Visit Status Flow:
```text
scheduled --> in_progress --> completed
    |              |
    v              v
cancelled     cancelled
    |
    v
rescheduled (new visit created)
```

### Route Optimization Algorithm:
- Nearest-neighbor heuristic (greedy, O(n^2))
- Start from agent's current GPS location
- Pick closest unvisited customer, repeat
- Good enough for typical daily routes (5-15 stops)
