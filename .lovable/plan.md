
# Add Admin Edit and Delete Actions to Planning Overview

## Overview
Add edit and delete functionality to the Planning Overview page, allowing administrators to manage any agent's daily plan. This extends the existing read-only view with administrative capabilities.

## Current State
- **Planning Overview** (`/dashboard/planning/overview`) displays all organization plans in a read-only table
- **Team Planning** (`/dashboard/planning/team`) has edit (correct) functionality for managers
- **Delete functionality** does not exist anywhere in the planning system
- Admin roles are checked using `has_role` RPC calls for `admin`, `super_admin`, and `platform_admin`

## Changes Required

### 1. Create Delete Plan Mutation
**File:** `src/hooks/useDailyPlansOffline.ts`

Add a new `useDeletePlanOffline` hook that:
- Deletes the plan from local IndexedDB
- Adds a delete action to the sync queue
- Attempts immediate sync to Supabase if online
- Shows appropriate success/offline toast messages

### 2. Update Planning Overview Page
**File:** `src/pages/PlanningOverview.tsx`

Add the following functionality:
- Import additional icons (Edit2, Trash2, Save, X) and components
- Add admin role check state and useEffect
- Add edit mode state management (editing plan ID, edit values)
- Add delete confirmation dialog
- Add "Actions" column to the table header
- Add inline edit inputs for Prospects, Quotes, Policies when editing
- Add action buttons (Edit, Delete, Save, Cancel) visible only for admins
- Use the existing `useCorrectPlanOffline` for editing (same as TeamPlanning)
- Use the new `useDeletePlanOffline` for deletion

### 3. UI/UX Details

**Edit Functionality:**
- Click edit icon → row switches to inline input mode
- Shows numeric inputs for Prospects, Quotes, Policies targets
- Save and Cancel buttons appear
- Uses the "correct" pattern to track who made changes

**Delete Functionality:**
- Click trash icon → confirmation dialog appears
- Dialog shows plan details (agent name, date, targets)
- Confirm deletes the plan; Cancel closes dialog
- Immediate deletion from local store + queued sync

---

## Technical Implementation

### New Hook: useDeletePlanOffline

```text
Location: src/hooks/useDailyPlansOffline.ts

Function signature:
- useDeletePlanOffline()
- Returns mutation that accepts { id: string, odataId?: string }

Logic:
1. Delete from IndexedDB (db.dailyPlans.delete)
2. Add to sync queue with action: 'delete'
3. If online and has odataId, call supabase.from('daily_plans').delete()
4. If sync succeeds, remove from sync queue
5. Show toast message
```

### Update syncPendingDailyPlans

```text
Location: src/hooks/useDailyPlansOffline.ts

Add handling for delete action:
- Check if item.action === 'delete'
- Call supabase.from('daily_plans').delete().eq('id', odataId)
- Remove from sync queue on success
```

### Planning Overview Changes

```text
Location: src/pages/PlanningOverview.tsx

State additions:
- isAdmin: boolean (check user roles on mount)
- editingPlanId: string | null
- editValues: { prospects_target, quotes_target, policies_target }
- deleteDialogOpen: boolean
- planToDelete: DailyPlanLocal | null

New imports:
- Edit2, Trash2, Save, X from lucide-react
- Input from @/components/ui/input
- AlertDialog components from @/components/ui/alert-dialog
- useCorrectPlanOffline, useDeletePlanOffline from hooks

Table modifications:
- Add "Actions" column header (only visible if isAdmin)
- For each plan row, add action buttons in Actions cell
- When editing, show Input components instead of static values
- Show Edit/Delete buttons or Save/Cancel buttons based on editingPlanId
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDailyPlansOffline.ts` | Add `useDeletePlanOffline` hook, update `syncPendingDailyPlans` |
| `src/pages/PlanningOverview.tsx` | Add admin check, edit/delete UI, confirmation dialog |

---

## Security Considerations
- Admin role check happens client-side for UI visibility
- Backend RLS policies on `daily_plans` table should already enforce proper access
- The correct/update mutations check user authentication
- Delete operations will fail server-side if RLS denies access

---

## User Flow

### Editing a Plan
1. Admin navigates to Planning Overview
2. Clicks edit icon on a plan row
3. Inline inputs appear for targets
4. Admin modifies values and clicks Save
5. Plan is updated locally and synced (or queued if offline)
6. Row returns to display mode with updated values

### Deleting a Plan
1. Admin clicks trash icon on a plan row
2. Confirmation dialog appears showing plan details
3. Admin clicks "Delete" to confirm
4. Plan is removed from local store
5. Sync queue item created for server deletion
6. Table updates to remove the row
