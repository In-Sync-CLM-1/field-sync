

# Add "Visits" Tab for All Roles and Ensure Agent Visit Visibility

## What Changes

### 1. Add "Visits" to Admin/Super Admin Sidebar
The Visits link (`/dashboard/visits`) is currently available for Sales Officers and Branch Managers but missing from the Admin, Super Admin, and Platform Admin sidebar sections. It will be added to the **MANAGEMENT** section for these roles.

### 2. Agent Dashboard -- Already Complete
The agent (Sales Officer) dashboard already displays:
- **Visits Today** metric card with planned vs completed count
- **This Week** visits summary
- **Active Visits** count
- **Pending Visits** count
- **Avg Duration** metric
- **Recent Visits Section** with today's schedule and visit history
- **Quick Actions** with "View All Visits" and "Start Visit" buttons

No changes are needed on the dashboard itself.

## Technical Details

### File: `src/components/AppSidebar.tsx`

Add the Visits menu item to the `admin`, `super_admin`, and `platform_admin` role sections in the `getSectionsForRole` function:

- For `admin` / `super_admin` (lines 76-108): Add `{ icon: MapPin, label: 'Visits', path: '/dashboard/visits' }` to the MANAGEMENT items list
- For `platform_admin` (lines 110-142): Add `{ icon: MapPin, label: 'Visits', path: '/dashboard/visits' }` to the MANAGEMENT items list

This is a single-file change affecting approximately 2 lines of code.
