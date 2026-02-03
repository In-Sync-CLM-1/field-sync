
# Add Navigation to Platform Admin Dashboard

## Problem
The Platform Admin page is currently rendered outside of the main `Layout` component, which means there's no sidebar navigation available. Users who navigate to `/platform-admin/organizations` have no UI element to return to the main dashboard.

## Solution
Add a "Back to Dashboard" button to the Platform Admin page header, following the same navigation pattern used across other pages in the application.

## Implementation

### Changes to `src/pages/PlatformAdmin/OrganizationsDashboard.tsx`

1. **Import Dependencies**
   - Add `ArrowLeft` icon from `lucide-react`
   - Add `useNavigate` hook from `react-router-dom`

2. **Add Navigation Hook**
   - Initialize `useNavigate()` in the component

3. **Add Back Button to Header**
   - Add a "Back to Dashboard" ghost button with the `ArrowLeft` icon
   - Position it in the header section alongside the existing "Refresh" button
   - Button navigates to `/dashboard` when clicked

### UI Layout
The header will be updated to include:
```text
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard    Platform Admin           [Refresh]   │
│                        Manage organizations...              │
└─────────────────────────────────────────────────────────────┘
```

## Technical Details

- The button will use the `ghost` variant to match the "Back to Dashboard" pattern used in other modules (Visits, Leads, Planning, etc.)
- Navigation target: `/dashboard` (following the mandatory `/dashboard` prefix routing pattern)
- The implementation follows the existing design pattern documented in the project memories
