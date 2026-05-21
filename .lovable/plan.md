

# Updated Plan: Attendance Summary + Mandatory Punch-In Gate

## 1. Attendance Summary Page (as previously planned)

Create `src/pages/AttendanceSummary.tsx` with Daily and Monthly tabs:
- **Daily tab**: Date picker, table with Employee Name, Punch In, Punch Out, Hours, Status
- **Monthly tab**: Month/Year selector, aggregated stats per employee (Days Present, Absent, Total Hours, Avg Hours)
- Role-based visibility: agents see self, managers see direct reports, admins see all org employees
- Queries `attendance` table joined with `profiles` for names

Add route `/dashboard/attendance-summary` in `src/App.tsx`.

Add sidebar item "Attendance Summary" (BarChart3 icon) in `src/components/AppSidebar.tsx`:
- `sales_officer` → MY WORK section
- `branch_manager` → TEAM section
- `admin`/`super_admin`/`platform_admin` → MANAGEMENT section

## 2. Mandatory Attendance Punch-In Gate on Login

Create `src/components/AttendanceGate.tsx`:
- Wraps protected app content (inside Layout, after auth)
- On mount, checks if the current user has a `punch_in_time` for today in the `attendance` table
- If no punch-in exists, shows a full-screen modal/overlay prompting "Mark Attendance" with GPS capture
- On successful punch-in, dismisses the gate and shows the app
- Only applies to `sales_officer` and `branch_manager` roles (admins/platform_admins skip the gate)

Integrate in `src/components/Layout.tsx`:
- Wrap the main content area with `<AttendanceGate>` so it blocks navigation until attendance is marked

No database changes needed — the existing `attendance` table and RLS policies already support this flow.

