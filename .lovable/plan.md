

# Fix and Connect the Guided Tour to Registration Flow

## Problem
The guided tour system exists but is broken for new users because:
1. The `hasCompletedTour` state defaults to `true`, causing a brief flash before correcting itself
2. After completing onboarding, the tour localStorage key is never reset, so returning users or users who previously dismissed the tour never see it
3. There is no system introduction during the registration/onboarding flow explaining what the app does

## Solution

### 1. Add a "System Introduction" screen at the end of Onboarding (before Dashboard redirect)

After Step 3 completes, instead of immediately redirecting to the Dashboard, show a brief **"Here's What You Can Do"** intro screen with 4-5 feature highlights:

| Feature | Icon | Description |
|---------|------|-------------|
| Dashboard | BarChart | Track daily performance at a glance |
| Daily Planning | Calendar | Set targets for prospects, quotes, and sales |
| Prospects | Users | Manage leads through the full sales cycle |
| Team Management | Building2 | Build teams and monitor performance |
| Territory Map | MapPin | Visualize your coverage area |

This screen ends with a "Start Guided Tour" button (primary) and a "Skip to Dashboard" link.

### 2. Reset tour state after onboarding completes

In `handleStep3Submit` (Onboarding.tsx), clear the tour localStorage keys so the guided tour is guaranteed to trigger:
- Remove `insync_app_tour_completed`
- Remove `insync_app_tour_progress`

### 3. Fix the default state in `useAppTour.ts`

Change `hasCompletedTour` default from `true` to checking localStorage synchronously on init, preventing the flash:
```
const [hasCompletedTour, setHasCompletedTour] = useState(
  () => localStorage.getItem('insync_app_tour_completed') === 'true'
);
```

### 4. Auto-start tour from onboarding flag

Add a `startTourOnMount` flag via localStorage (e.g., `insync_start_tour_after_onboarding`). When the Dashboard mounts and this flag is present, automatically start the tour and clear the flag. This ensures the tour begins seamlessly after onboarding.

## Files to Change

| File | Change |
|------|--------|
| `src/pages/Onboarding.tsx` | Add intro screen after Step 3; reset tour localStorage keys; set auto-start flag |
| `src/hooks/useAppTour.ts` | Fix default state to read localStorage synchronously; add auto-start-from-onboarding logic |
| `src/components/AppTour.tsx` | Remove the standalone welcome popup (no longer needed -- onboarding handles the intro); keep the tour tooltip and navigation UI intact |

## User Flow After Changes

```text
Registration --> Onboarding (3 steps) --> System Introduction Screen
                                              |
                              "Start Tour" -- +--> Dashboard (tour auto-starts)
                              "Skip"       -- +--> Dashboard (no tour)
```

The "Take Tour" button remains on the Dashboard header for users who want to retake it later.

