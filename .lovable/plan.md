

# Separate Branches & Teams + Restore Admin Planning Overview

## Changes

### 1. Sidebar Navigation Updates (`src/components/AppSidebar.tsx`)

Split "Team & Branches" into two separate sidebar items and restore admin access to Planning Overview:

- **Branches** (`/dashboard/branches`): Visible to `admin`, `super_admin`, `platform_admin` -- manages physical office locations
- **Teams** (`/dashboard/teams`): Visible to `branch_manager`, `admin`, `super_admin`, `platform_admin` -- shows team hierarchy and planning
- **Planning Overview** (`/dashboard/planning/overview`): Restore access for `branch_manager`, `admin`, `super_admin`, `platform_admin`
- **Daily Plan** stays restricted to `sales_officer`, `branch_manager` (no change)

### 2. Route Updates (`src/App.tsx`)

Add new routes:
- `/dashboard/branches` -- renders the existing `BranchesTab` as a standalone page
- `/dashboard/teams` -- renders the existing `TeamPlanningTab` as a standalone page
- Keep `/dashboard/team` as a redirect or remove it

### 3. Split `TeamAndBranches.tsx` into Two Pages

Extract the two tab components into separate pages:

- **`src/pages/Branches.tsx`**: Standalone page wrapping the existing `BranchesTab` component (branch CRUD, activation toggle)
- **`src/pages/Teams.tsx`**: Standalone page wrapping the existing `TeamPlanningTab` component (team plans, stats, editing)

The hierarchy concept (Agents >> Teams >> Branches >> HO) is already reflected in the data model (`profiles.reporting_manager_id` for teams, `profiles.branch_id` for branch assignment). The separation in navigation reinforces this hierarchy visually.

### 4. Hierarchy Concept

```text
HO (Admin/Super Admin)
  |
  +-- Branch 1 (managed via Branches page)
  |     +-- Team A (Reporting Manager)
  |     |     +-- Agent 1
  |     |     +-- Agent 2
  |     +-- Team B (Reporting Manager)
  |           +-- Agent 3
  |
  +-- Branch 2
        +-- Team C
              +-- Agent 4
              +-- Agent 5
```

### Files Summary

| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | Split "Team & Branches" into "Teams" and "Branches"; restore admin access to Planning Overview |
| `src/pages/Branches.tsx` | New -- standalone branches management page (extracted from TeamAndBranches) |
| `src/pages/Teams.tsx` | New -- standalone teams/planning page (extracted from TeamAndBranches) |
| `src/App.tsx` | Add `/dashboard/branches` and `/dashboard/teams` routes |

