

# Remove Bottom Navigation, Add Map to Sidebar

## Changes

### 1. Edit `src/components/Layout.tsx`
- Remove the entire bottom `<nav>` element (lines 181-208)
- Remove the `pb-14` class from `<main>` (no longer need padding for bottom bar)
- Remove unused imports (`Home`, `Users`, `MapPin`, `Map` from lucide, `Link`)
- Remove `navItems` array and `isActive` function (no longer needed)

### 2. Edit `src/components/AppSidebar.tsx`
- Add **Territory Map** item to `sales_officer` section (already has Territory at `/dashboard/territory`)
- Verify all bottom nav items (Home, Leads, Visits, Map) are covered in the sidebar for each role — they already are except Map for branch_manager/admin roles
- Add `Map` (Globe icon) entry to `branch_manager` and `admin`/`super_admin`/`platform_admin` sections pointing to `/dashboard/territory`

### Files
| Action | File |
|--------|------|
| Edit | `src/components/Layout.tsx` — remove bottom nav, remove pb-14 |
| Edit | `src/components/AppSidebar.tsx` — add Territory Map for manager/admin roles |

