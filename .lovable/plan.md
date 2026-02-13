

# Rename "Branch Dashboard" to "Organization Dashboard"

## Problem
The Admin's top-level dashboard is incorrectly named "Branch Dashboard" even though it displays organization-wide metrics across all branches. This is confusing since it implies a single branch's view.

## Changes

### 1. Rename in the Page (`src/pages/BranchDashboard.tsx`)
- Change the heading from "Branch Dashboard" to "Organization Dashboard"
- Update the subtitle from "Organization-wide performance overview" to "Head Office overview across all branches"

### 2. Rename in the Sidebar (`src/components/AppSidebar.tsx`)
- Change the sidebar label from "Branch Dashboard" to "Organization Dashboard" (or "HQ Dashboard" for brevity)

No backend changes, no routing changes (the URL `/dashboard/branch-dashboard` stays the same to avoid breaking bookmarks).

## Summary of Hierarchy (no changes needed -- already correct)

```text
Admin       --> Organization Dashboard (all branches, all agents)
Manager     --> Team Dashboard (their team's agents only)
Agent       --> My Dashboard (personal stats only)
```

