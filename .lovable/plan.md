

# Fix Agent Column to Show Full Names

## Problem
The `getUserName` function in both `TeamAndBranches.tsx` and `PlanningOverview.tsx` truncates the user ID (`plan.userId.substring(0, 8) + '...'`) instead of showing the agent's full name. The profile data IS fetched from the server (with a join on `profiles`), but `toLocalPlan()` discards it, and the `DailyPlanLocal` interface has no field for it.

## Solution
Add an `agentFullName` field to `DailyPlanLocal`, populate it during sync, and use it in the display functions.

## Changes

### 1. `src/lib/db.ts` -- Add `agentFullName` to `DailyPlanLocal`
- Add optional field: `agentFullName?: string`

### 2. `src/hooks/useDailyPlansOffline.ts` -- Cache agent name during sync
- In `toLocalPlan()`, extract the joined profile data:
  ```
  agentFullName: plan.user?.full_name || plan.user?.first_name || ''
  ```
- This preserves the name in IndexedDB for offline access.

### 3. `src/pages/TeamAndBranches.tsx` -- Use cached name
- Update `getUserName()` to: `return plan.agentFullName || plan.userId.substring(0, 8) + '...'`

### 4. `src/pages/PlanningOverview.tsx` -- Use cached name
- Same update to `getUserName()` as above.
- Also fix the delete confirmation text that still says "Policies" (line 455) to "Sales".

