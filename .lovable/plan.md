

# Fix 404 Errors - Navigation Route Prefix Issue

## Problem Identified

The 404 errors are **not caused by edge functions** - those are deployed and working correctly. The issue is that **all navigation routes are missing the required `/dashboard` prefix**.

When you navigate within the app (clicking buttons, links, or programmatic navigation), the routes used don't include `/dashboard`, causing the 404 page to appear.

**Example of the issue:**
- Clicking "Start Visit" navigates to `/visits/new` 
- But the correct route is `/dashboard/visits/new`
- Since `/visits/new` doesn't exist, you see a 404 error

---

## Files That Need Updates

### 1. Navigation Components

| File | Issue |
|------|-------|
| `src/components/AppSidebar.tsx` | Sidebar navigation paths missing `/dashboard` prefix |
| `src/components/Layout.tsx` | Bottom navigation and dropdown links missing prefix |

### 2. Page Components with Navigation

| File | Lines Affected | Navigation Calls |
|------|----------------|------------------|
| `src/pages/Dashboard.tsx` | Lines 19, 26, 134 | "Start Visit", "View Visits" buttons |
| `src/pages/Leads.tsx` | Line 154 | Lead card clicks |
| `src/pages/LeadDetail.tsx` | Lines 54, 78, 97 | Back button, "Start Visit" button |
| `src/pages/Visits.tsx` | Lines 88, 124, 135 | "New Visit" button, visit card clicks |
| `src/pages/VisitDetail.tsx` | Lines 73, 102, 126 | Success redirects, back buttons |
| `src/pages/NewVisit.tsx` | Lines 176, 310 | Success redirect, cancel button |

---

## Solution

Add `/dashboard` prefix to all navigation paths throughout the application.

### Changes Summary

**AppSidebar.tsx** - Update navItems paths:
```text
Before: { path: '/' }          → After: { path: '/dashboard' }
Before: { path: '/planning' }  → After: { path: '/dashboard/planning' }
Before: { path: '/users' }     → After: { path: '/dashboard/users' }
... (all paths)
```

**Layout.tsx** - Update bottom nav and dropdown:
```text
Before: { path: '/' }          → After: { path: '/dashboard' }
Before: { path: '/leads' }     → After: { path: '/dashboard/leads' }
Before: { path: '/visits' }    → After: { path: '/dashboard/visits' }
Before: <Link to="/sync-monitoring">  → After: <Link to="/dashboard/sync-monitoring">
```

**Dashboard.tsx** - Update quick actions:
```text
Before: navigate('/visits/new')  → After: navigate('/dashboard/visits/new')
Before: navigate('/visits')      → After: navigate('/dashboard/visits')
```

**Leads.tsx** - Update card click:
```text
Before: navigate(`/leads/${lead.id}`)  → After: navigate(`/dashboard/leads/${lead.id}`)
```

**LeadDetail.tsx** - Update navigation:
```text
Before: navigate(`/visits/new?leadId=${id}`)  → After: navigate(`/dashboard/visits/new?leadId=${id}`)
Before: navigate('/leads')                     → After: navigate('/dashboard/leads')
```

**Visits.tsx** - Update navigation:
```text
Before: navigate('/visits/new')           → After: navigate('/dashboard/visits/new')
Before: navigate(`/visits/${visit.id}`)   → After: navigate(`/dashboard/visits/${visit.id}`)
```

**VisitDetail.tsx** - Update redirects:
```text
Before: navigate('/visits')  → After: navigate('/dashboard/visits')
```

**NewVisit.tsx** - Update redirects:
```text
Before: navigate(`/visits/${visit.id}`)  → After: navigate(`/dashboard/visits/${visit.id}`)
Before: navigate('/visits')              → After: navigate('/dashboard/visits')
```

---

## Implementation Order

1. **Update AppSidebar.tsx** - Fix main sidebar navigation
2. **Update Layout.tsx** - Fix bottom nav bar and dropdown menu
3. **Update Dashboard.tsx** - Fix quick action buttons
4. **Update Leads.tsx** - Fix lead card navigation
5. **Update LeadDetail.tsx** - Fix back/action buttons
6. **Update Visits.tsx** - Fix visit navigation
7. **Update VisitDetail.tsx** - Fix success redirects
8. **Update NewVisit.tsx** - Fix success/cancel navigation

---

## Technical Notes

- All routes within the protected area are nested under `/dashboard` in `src/App.tsx`
- The `isActive` function in Layout.tsx also needs updating to check paths correctly
- This is a systematic find-and-replace across 8 files
- No database or edge function changes required

