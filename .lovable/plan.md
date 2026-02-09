
# Google Places Nearby Search Integration

## What Changes

Add a "Nearby Places" feature that works in two places:
1. **Territory Map** -- A button to search for nearby businesses around the current map center and display them as markers
2. **Lead Discovery** -- Ability to import discovered places directly as new prospects/leads

## Prerequisites

You'll need to provide a **Google Maps API key** with the Places API (New) enabled. This will be stored as a secret called `GOOGLE_PLACES_API_KEY`.

## Technical Details

### 1. Add secret

Store `GOOGLE_PLACES_API_KEY` securely so the backend function can access it.

### 2. Create Edge Function: `supabase/functions/nearby-places/index.ts`

A backend function that proxies requests to the Google Places Nearby Search API. This keeps the API key secure on the server side.

- Accepts: `latitude`, `longitude`, `radius` (meters, default 5000), `includedTypes` (e.g. `["insurance_agency", "bank", "finance"]`), `maxResultCount` (default 20)
- Calls: `POST https://places.googleapis.com/v1/places:searchNearby` with `X-Goog-Api-Key` and `X-Goog-FieldMask` headers
- Returns: Array of places with `displayName`, `formattedAddress`, `location` (lat/lng), `primaryType`, `phoneNumbers`

### 3. Update Territory Map (`src/pages/TerritoryMap.tsx`)

Add a "Discover Nearby" button panel:

- A floating button/panel on the map with a "Search Nearby" button
- A type filter dropdown (Insurance Agency, Bank, Hospital, School, etc.)
- A radius selector (1km, 2km, 5km, 10km)
- Calls the edge function with the current map center coordinates
- Displays results as distinct markers (e.g., purple diamonds) separate from visit markers
- Each marker popup shows place name, address, type, and an "Add as Prospect" button

### 4. Add "Add as Prospect" flow

When clicking "Add as Prospect" on a nearby place marker popup:

- Pre-fills a new lead with:
  - `name` from `displayName`
  - `village_city` from the formatted address
  - `latitude` / `longitude` from the place location
  - `mobile_no` from phone number (if available)
  - `lead_source` set to "Google Places"
- Inserts directly into the leads table via existing `useLeads` hook
- Shows a success toast

### 5. No database migration needed

The existing `leads` table already has `latitude`, `longitude`, `name`, `village_city`, `mobile_no`, and `lead_source` columns -- everything needed to store discovered places.

## Steps in order

1. Request and store the `GOOGLE_PLACES_API_KEY` secret
2. Create the `nearby-places` edge function
3. Add the Nearby Places UI panel and markers to Territory Map
4. Add the "Add as Prospect" action from place markers
5. Deploy and test
