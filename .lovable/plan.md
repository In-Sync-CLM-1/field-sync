
# Attendance & Route Tracking Module

## Overview
Build a complete attendance and field tracking system with GPS-verified punch-in/out, location history recording, route replay on the map, and deviation alerts for managers.

---

## 1. Database Changes

### New table: `attendance`
Stores daily punch-in/punch-out records with GPS verification.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK profiles | |
| organization_id | uuid FK organizations | |
| date | date NOT NULL | One record per user per day |
| punch_in_time | timestamptz | |
| punch_in_latitude | float | |
| punch_in_longitude | float | |
| punch_in_accuracy | float | |
| punch_out_time | timestamptz | nullable until checkout |
| punch_out_latitude | float | |
| punch_out_longitude | float | |
| punch_out_accuracy | float | |
| status | text | 'active', 'completed', 'missed' |
| total_hours | float | computed on punch-out |
| notes | text | optional |
| created_at / updated_at | timestamptz | |
| **UNIQUE** | (user_id, date) | one attendance per day |

RLS: Users can read/write their own records; admins/managers can read their team's records.

### New table: `location_history`
Stores periodic GPS breadcrumbs during active field hours (between punch-in and punch-out).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK profiles | |
| organization_id | uuid FK organizations | |
| attendance_id | uuid FK attendance | links to the day's session |
| latitude | float | |
| longitude | float | |
| accuracy | float | |
| recorded_at | timestamptz | |

RLS: Users can insert their own; admins/managers can read their team's history.
Enable Realtime for live tracking.

### New table: `route_deviations`
Logs alerts when an agent strays too far from their planned route.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK profiles | |
| organization_id | uuid FK organizations | |
| attendance_id | uuid FK attendance | |
| latitude | float | where deviation occurred |
| longitude | float | |
| distance_from_route_km | float | |
| nearest_visit_id | uuid FK visits | closest planned stop |
| detected_at | timestamptz | |
| acknowledged | boolean default false | manager can dismiss |

RLS: Admin/manager read-only within org.

---

## 2. Attendance Page (`src/pages/Attendance.tsx`)

### Agent View
- Large "Punch In" button (when not punched in today)
  - Captures GPS with the existing multi-stage fallback strategy
  - Shows confirmation with location accuracy
- Once punched in: shows timer (elapsed hours), current status, and a "Punch Out" button
- Daily/weekly attendance history list below

### Manager/Admin View
- Team attendance table for today: name, punch-in time, status (active/completed/missed), total hours
- Date picker to review past days
- Click a row to see that agent's route replay

---

## 3. Location History Tracking (`src/hooks/useLocationHistory.ts`)

- Activates only when the user has an active attendance record (punched in, not yet out)
- Records GPS every 2 minutes to `location_history` table
- Reuses the existing `useAgentLocationTracker` pattern but writes to the history table instead of upserting
- Stops recording automatically on punch-out

---

## 4. Route Replay (`src/components/RouteReplayMap.tsx`)

- Renders on the Territory Map or a dedicated view
- Takes a user_id + date, fetches `location_history` breadcrumbs
- Draws an animated polyline on Mapbox showing the agent's path chronologically
- Markers for punch-in (green), punch-out (red), and each visit check-in (orange)
- Playback controls: play/pause, speed (1x/2x/4x), timeline scrubber
- Accessible from Attendance page (manager clicks an agent row) and from Territory Map

---

## 5. Deviation Alerts (`src/hooks/useDeviationDetector.ts`)

- Runs client-side during active tracking
- On each location update, checks distance (Haversine) from the nearest scheduled visit for the day
- If distance exceeds a threshold (e.g., 5 km from any planned stop AND agent has been off-route for 2+ consecutive pings), inserts a record into `route_deviations`
- Avoids duplicate alerts within a 15-minute window

### Manager notification
- On the Attendance page, show a badge/alert icon next to agents with unacknowledged deviations
- Clicking opens a mini-map showing where the deviation occurred relative to planned visits

---

## 6. Navigation & Routing

### Sidebar
- Add "Attendance" item with a `Clock` icon, visible to all roles

### Routes in `App.tsx`
- `/dashboard/attendance` -- main attendance page
- `/dashboard/attendance/replay/:userId/:date` -- route replay view

---

## Technical Details

### Files to Create
1. `src/pages/Attendance.tsx` -- main attendance page (agent + manager views)
2. `src/hooks/useAttendance.ts` -- CRUD operations for attendance records
3. `src/hooks/useLocationHistory.ts` -- background location recording during field hours
4. `src/hooks/useDeviationDetector.ts` -- client-side deviation detection logic
5. `src/components/RouteReplayMap.tsx` -- Mapbox-based animated route playback
6. `src/components/AttendanceTimer.tsx` -- live elapsed-time display component
7. `src/components/DeviationAlert.tsx` -- deviation notification card for managers

### Files to Modify
1. `src/App.tsx` -- add attendance routes
2. `src/components/AppSidebar.tsx` -- add Attendance nav item
3. `src/hooks/useAgentLocationTracker.ts` -- extend to also write to `location_history` when attendance is active

### Database Migration
- CREATE `attendance` table with RLS + unique constraint
- CREATE `location_history` table with RLS + realtime
- CREATE `route_deviations` table with RLS
- Add indexes on (user_id, date) for attendance and (attendance_id, recorded_at) for location_history

### Deviation Detection Logic
```text
On each GPS ping:
  1. Get today's scheduled visits for the user
  2. Calculate Haversine distance to nearest visit location
  3. If distance > 5km AND last 2 pings were also > 5km:
     - Check if a deviation was logged in the last 15 min
     - If not, insert into route_deviations
```

### Attendance Status Flow
```text
[No record] --punch in--> active --punch out--> completed
                              |
                  (end of day cron) --> missed
```
