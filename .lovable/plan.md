

# Remove Sync Column from Team Planning

## Problem
The "Sync" column showing cloud sync status icons is unnecessary -- data synchronization should happen automatically in the background without exposing internal sync state to users.

## Change

### `src/pages/TeamAndBranches.tsx`
- Remove the "Sync" `<TableHead>` column header
- Remove the `<TableCell>` containing `getSyncBadge(plan.syncStatus)` from each row
- The `getSyncBadge` function can be removed as well since it will no longer be used

This is a simple column removal with no impact on functionality -- sync continues to work automatically behind the scenes.

