

# Hierarchical Dashboard Restructuring

## Problem
Currently, the app has a flat navigation where all roles see a single "My Dashboard" with agent-level metrics. There's no dedicated Team Dashboard or Branch Dashboard. The sidebar mixes operational and management items without clear grouping.

## Solution
Restructure the system into three dedicated dashboards with proper hierarchy, grouped sidebar navigation, and role-based access control.

```text
HO / Admin
  |
  +-- Branch Dashboard (consolidated branch-level view)
  |     |
  |     +-- Team Dashboard (team-level aggregate view)
  |           |
  |           +-- Agent Dashboard (personal work view)
```

---

## 1. Sidebar Navigation Restructure

Group sidebar items into logical sections with headers, filtered by role:

**For Sales Officers (Agents):**
- MY WORK section:
  - Dashboard (personal agent dashboard)
  - Daily Plan
  - Visits (existing)
  - Leads (existing)
  - Attendance
  - Territory Map

**For Branch Managers:**
- MY WORK section:
  - Dashboard (personal agent dashboard -- managers may also do field work)
  - Daily Plan
  - Attendance
- TEAM section:
  - Team Dashboard (NEW -- aggregate view of their team)
  - Teams (existing team planning page)
  - Planning Overview
- ANALYTICS section:
  - Analytics
  - Performance Review

**For Admins / Super Admins:**
- OVERVIEW section:
  - Branch Dashboard (NEW -- org-wide consolidated view)
  - Planning Overview
- MANAGEMENT section:
  - Branches
  - Teams
  - Users
- ANALYTICS section:
  - Analytics
  - Performance Review
- SETTINGS section:
  - Subscription

---

## 2. New Page: Team Dashboard (`/dashboard/team-dashboard`)

A dedicated dashboard for Branch Managers showing their team's consolidated metrics.

**Content:**
- KPI Cards: Team Visits Today, Active Agents, Attendance Rate, Plan Completion %
- Agent Activity List: Each agent with status (active/idle), visits today, last check-in time, current location status
- Team Target Progress: Visual progress bars for Prospects, Quotes, Sales (Target vs Actual)
- Today's Visit Summary: Pie chart of visit statuses (completed/in-progress/cancelled)
- Quick Actions: View Team Plans, View Team Attendance, Open Performance Review

**Access:** `branch_manager` only (auto-scoped to their reporting agents)

---

## 3. New Page: Branch Dashboard (`/dashboard/branch-dashboard`)

A consolidated HQ-level dashboard for Admins showing all branches, teams, and agents.

**Content:**
- Org KPI Cards: Total Visits Today, Total Active Agents, Overall Attendance %, Org Plan Achievement %
- Branch Performance Cards: One card per branch showing visits, agents, achievement % with a "View Details" link to Performance Review
- Live Activity Feed: Recent visits across the organization (last 10) with agent name, customer, branch
- Agent Coverage Map: Simple map showing agent last-known locations (reusing existing Mapbox)
- Quick Actions: Manage Branches, Manage Users, View Analytics, View Performance Review

**Access:** `admin`, `super_admin`, `platform_admin`

---

## 4. Update Existing Agent Dashboard

Refine the current Dashboard page to be explicitly agent-focused:
- Add a role label ("My Dashboard" for agents, or redirect managers/admins to their respective dashboards on first load)
- Keep existing KPI cards, quick actions, and recent visits
- Add a "Today's Plan" summary card showing the current day plan inline (target vs actual for prospects/quotes/sales)
- Add an "Attendance Status" indicator showing punch-in/out status prominently

---

## 5. Role-Based Dashboard Routing

When users navigate to `/dashboard`:
- **Agents**: Show the Agent Dashboard (current behavior, enhanced)
- **Branch Managers**: Show the Agent Dashboard but add a prominent banner/link to "View Team Dashboard"
- **Admins**: Show the Branch Dashboard directly (redirect to `/dashboard/branch-dashboard`)

This ensures each role lands on the most relevant view while still being able to navigate to other dashboards.

---

## 6. Access Control Summary

| Page | Agent | Manager | Admin |
|------|-------|---------|-------|
| Agent Dashboard | Yes | Yes | No (redirected) |
| Team Dashboard | No | Yes | No |
| Branch Dashboard | No | No | Yes |
| Daily Plan | Yes | Yes | No |
| Visits / Leads | Yes | Yes | Yes |
| Teams | No | Yes | Yes |
| Branches | No | No | Yes |
| Planning Overview | No | Yes | Yes |
| Analytics | No | Yes | Yes |
| Performance Review | No | Yes | Yes |
| Users | No | No | Yes |
| Attendance | Yes | Yes | Yes |

---

## 7. Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/pages/TeamDashboard.tsx` | Team-level consolidated dashboard for Branch Managers |
| `src/pages/BranchDashboard.tsx` | Organization-wide dashboard for Admins |
| `src/hooks/useTeamDashboard.ts` | Data hook for team dashboard metrics |
| `src/hooks/useBranchDashboard.ts` | Data hook for branch/org dashboard metrics |

### Modified Files
| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | Grouped navigation with section headers, role-based filtering |
| `src/App.tsx` | Add routes for `/dashboard/team-dashboard` and `/dashboard/branch-dashboard` |
| `src/pages/Dashboard.tsx` | Add "Today's Plan" summary card, attendance status indicator, role-based banner for managers |

### No Database Changes Required
All data is sourced from existing tables: `profiles`, `branches`, `visits`, `attendance`, `daily_plans`, `agent_locations`.

