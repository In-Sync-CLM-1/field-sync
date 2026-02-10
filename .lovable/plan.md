

# Fix: Stop Repeated "Synced 3 prospects" Toast

## Problem
Every time you interact with the New Visit page (e.g., selecting a lead), the "Synced 3 prospects" toast keeps appearing. This happens because the sync effect re-triggers on every render cycle.

The current code syncs whenever `leads.length === 0`, but after syncing, the leads array updates (length changes from 0 to 3), causing re-renders. Due to timing issues with IndexedDB live queries, this can re-trigger or appear redundant.

## Solution
Replace the current sync effect with a one-time sync that runs only once when the component mounts and the organization is available -- not on every leads length change.

## Changes

### File: `src/pages/NewVisit.tsx`
- Replace the current `useEffect` that watches `leads.length` with one that:
  - Watches `currentOrganization?.id` instead
  - Uses a `ref` flag (`hasSynced`) to ensure it only syncs once per mount
  - Calls `syncFromDatabase()` silently (the toast in `useLeads` will still show once)

```typescript
// Before (causes repeated syncing):
useEffect(() => {
  if (leads.length === 0) {
    syncFromDatabase();
  }
}, [leads.length]);

// After (syncs exactly once on mount):
const hasSynced = useRef(false);
useEffect(() => {
  if (!hasSynced.current && currentOrganization?.id) {
    hasSynced.current = true;
    syncFromDatabase();
  }
}, [currentOrganization?.id]);
```

## About the "Enter address manually" prompt
This is expected behavior -- lead "A" was created without GPS coordinates, so the app correctly warns you. You can either:
- Enter the address manually using the fields provided
- Or go back and add location data to the lead record

No changes needed for this part.

## Technical Notes
- Only `src/pages/NewVisit.tsx` needs to be modified (lines 78-83)
- Requires adding `useRef` to the React import
- Need to get `currentOrganization` from the auth store (already imported via `useLeads` but may need direct access)
