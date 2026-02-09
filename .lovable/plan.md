
# Live Agent Location Tracking

## Overview
Agents will automatically share their GPS location while using the app, and admins/managers can see all active agents as live markers on the Territory Map.

## How It Works

**For Agents (Sales Officers):**
- When they open the app and are logged in, their location is captured every 2 minutes in the background
- A small indicator shows that location sharing is active
- Location updates stop when they close the app or go offline

**For Admins/Managers:**
- A new "Live Agents" toggle on the Territory Map shows/hides agent location markers
- Agent markers appear as distinct pulsing blue dots with the agent's name
- Markers update in real-time (every 30 seconds refresh) -- no page reload needed
- Clicking an agent marker shows their name, last update time, and battery-style "freshness" indicator
- Managers see only their team; admins see all agents in the organization

## Technical Details

### 1. Database: New `agent_locations` table

```sql
CREATE TABLE public.agent_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
```

- Uses `UNIQUE(user_id)` so each agent has only one row that gets upserted (no history bloat)
- RLS policies: agents can upsert their own row; managers/admins can read rows in their org
- Enable realtime on this table for live updates

### 2. New Hook: `src/hooks/useAgentLocationTracker.ts`

- Runs on app load for all authenticated users
- Uses `navigator.geolocation.watchPosition` or `setInterval` with `getCurrentPosition` (every 2 minutes)
- Upserts to `agent_locations` table with current lat/lng
- Cleans up on unmount

### 3. Integrate tracker in `src/components/Layout.tsx`

- Call `useAgentLocationTracker()` so it runs app-wide for logged-in users

### 4. New Component: `src/components/LiveAgentMarkers.tsx`

- Fetches all agent locations for the user's organization (respecting role hierarchy)
- Subscribes to realtime changes on `agent_locations` table
- Renders pulsing blue circle markers on the Mapbox map
- Each marker has a popup with agent name and "last seen X minutes ago"

### 5. Update `src/pages/TerritoryMap.tsx`

- Add a "Live Agents" toggle switch next to the existing "Routes" toggle
- When enabled, render `LiveAgentMarkers` component with the map reference
- Only visible to managers and admins (not sales officers viewing their own map)

### 6. Auto-cleanup

- Locations older than 30 minutes are considered "stale" and shown with a faded marker
- A simple filter in the query: `updated_at > now() - interval '30 minutes'` for "active" agents

## Steps

1. Create `agent_locations` table with RLS policies and realtime enabled
2. Create `useAgentLocationTracker` hook for background GPS reporting
3. Integrate the tracker in Layout so all agents report location
4. Create `LiveAgentMarkers` component for map visualization
5. Add "Live Agents" toggle to Territory Map
