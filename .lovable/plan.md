

# Mandatory Photo Capture for Field Visits

## Overview
Add a photo capture requirement during field visits with minimum 2-3 geotagged photos, offline support via IndexedDB, and background sync to cloud storage.

## How It Works

1. During an active visit (status: "in_progress"), agents see a **Photos** section on the Visit Detail page
2. They must capture at least 2 photos before they can complete the visit (check-out is blocked until requirement is met)
3. Each photo is automatically tagged with GPS coordinates and timestamp at capture time
4. Photos are stored locally in IndexedDB first (works offline), then synced to cloud storage when online
5. Photo categories: **Customer Selfie**, **Property/Location**, **Documents**, **Other**

## Technical Details

### 1. Database: New `visit_photos` Table

```
visit_photos:
  - id (uuid, PK)
  - visit_id (uuid, FK to visits)
  - organization_id (uuid)
  - user_id (uuid)
  - category (text) -- selfie, property, document, other
  - storage_path (text) -- path in storage bucket
  - latitude (numeric)
  - longitude (numeric)
  - accuracy (numeric)
  - captured_at (timestamptz)
  - created_at (timestamptz)
```

RLS policies scoped to organization. Realtime not needed.

### 2. Storage Bucket: `visit-photos`

A new public storage bucket for photo files. RLS policies allow authenticated users within the same organization to upload and view.

### 3. Photo Capture Component

New `VisitPhotoCapture.tsx` component with:
- Camera input using `<input type="file" accept="image/*" capture="environment">` for native camera access on mobile
- Photo category selector (Customer Selfie, Property, Documents, Other)
- Auto-geotagging: captures GPS at moment of photo
- Thumbnail preview grid showing captured photos with category labels
- Delete option for photos not yet synced
- Minimum photo count indicator (e.g., "2/2 required photos taken")

### 4. Offline-First Flow

The existing IndexedDB `photos` table already has the right schema (id, visitId, blob, caption, latitude, longitude, timestamp, syncStatus). The flow:
1. Agent takes photo -> stored as Blob in IndexedDB with `syncStatus: 'pending'`
2. When online, background sync uploads Blob to `visit-photos` storage bucket
3. Creates corresponding row in `visit_photos` Supabase table with the storage path
4. Updates IndexedDB `syncStatus` to `'synced'`

### 5. Visit Completion Gate

On the Visit Detail page, the "Complete Visit" button is disabled until:
- At least 2 photos have been captured (stored locally or synced)
- A validation message shows: "Please capture at least 2 photos before completing"

### 6. Photo Display for Managers

On the Visit Detail page (read-only for completed visits), photos are displayed in a thumbnail grid with:
- Category label
- GPS coordinates
- Timestamp
- Tap to view full-size

## Files Summary

### New Files
| File | Purpose |
|---|---|
| `src/components/VisitPhotoCapture.tsx` | Camera capture UI with category selection, thumbnail grid, geotagging |
| `src/hooks/useVisitPhotos.ts` | Hook to manage photos in IndexedDB and sync to cloud storage |

### Modified Files
| File | Change |
|---|---|
| `src/pages/VisitDetail.tsx` | Add VisitPhotoCapture section, gate check-out on minimum 2 photos |
| `src/lib/db.ts` | Add `category` field to Photo interface, bump DB version |
| `src/services/syncProcessor.ts` | Add photo sync logic (upload blob to storage, create DB record) |

### Database Migration
| Change | Description |
|---|---|
| Create `visit_photos` table | Metadata table for synced photos |
| Create `visit-photos` storage bucket | Cloud storage for photo files |
| Storage RLS policies | Organization-scoped upload/read access |

