

# Add "Directions to Visit" Button

## Overview
Add a prominent "Get Directions" button on both the **Visit Detail** page and each **Visit card** in the list, so agents can quickly open Google Maps navigation to the lead's location.

## Changes

### 1. Visit Detail Page (`src/pages/VisitDetail.tsx`)
- Add a prominent "Directions" button in the **Lead Details** section (where address is shown)
- Uses the lead's `latitude`/`longitude` to open Google Maps directions
- Button is shown whenever the lead has valid coordinates, regardless of visit status
- Styled as a visible action button (not just a ghost icon like the existing check-in/check-out navigation buttons)

### 2. Visits List Page (`src/pages/Visits.tsx`)
- Add a small **Navigation icon button** on each visit card
- Clicking it opens Google Maps directions to the lead's location
- Uses `e.stopPropagation()` to prevent navigating to the visit detail page
- Only shown when the lead has valid latitude/longitude

## Technical Details

### Files Modified
| File | Change |
|---|---|
| `src/pages/VisitDetail.tsx` | Add a "Get Directions" button in the lead details section using `lead.latitude` and `lead.longitude` |
| `src/pages/Visits.tsx` | Add a navigation icon button on each visit card that opens Google Maps directions |

Both use the existing pattern: `window.open('https://www.google.com/maps/dir/?api=1&destination={lat},{lng}', '_blank')`

No database changes or new files required.
