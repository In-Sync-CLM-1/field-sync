
# Add "Add New Lead" Button Plan

## Overview
Add a prominent "Add New Lead" button to both the New Visit page and the Leads page, making it easy for users to quickly add new leads/prospects without navigating away.

## Current State

### New Visit Page (`NewVisit.tsx`)
- Has a lead selector dropdown
- No option to add a new lead if the desired prospect doesn't exist
- Users must navigate away to add leads

### Leads Page (`Leads.tsx`)
- Header has "LeadsUpload" and "Sync" buttons
- No direct "Add New Lead" button visible
- Users can only bulk upload via CSV

## Proposed Changes

### 1. Leads Page - Add Prominent Button

**Location:** Next to the existing "LeadsUpload" and "Sync" buttons in the header

**Design:**
- Primary gradient button (most prominent)
- Plus icon with "Add Lead" text
- Positioned first (leftmost) as it's the primary action

```text
┌─────────────────────────────────────────────────────────┐
│ ← Dashboard    Prospects                                │
│                [+ Add Lead] [Upload] [Sync]             │
└─────────────────────────────────────────────────────────┘
```

### 2. New Visit Page - Add Quick Action

**Location:** Below the lead selector dropdown

**Design:**
- Link-style or outline button
- Plus icon with "Add New Lead" text
- Helpful text explaining the option

```text
┌─────────────────────────────────────────────────────────┐
│ Lead *                                                  │
│ [Select lead...                              ▼]         │
│                                                         │
│ Can't find the lead? [+ Add New Lead]                   │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Leads.tsx` | Add "Add Lead" button in header |
| `src/pages/NewVisit.tsx` | Add "Add New Lead" link below lead selector |

### Detailed Changes

#### 1. Leads.tsx Changes

**Add import:**
```typescript
import { Plus } from 'lucide-react';
```

**Modify header buttons section (around line 96-107):**
```typescript
<div className="flex gap-2">
  <Button 
    onClick={() => navigate('/dashboard/leads/new')}
    className="btn-gradient-primary text-primary-foreground"
    size="sm"
  >
    <Plus className="h-3 w-3 mr-1" />
    Add Lead
  </Button>
  <LeadsUpload />
  <Button 
    onClick={syncFromDatabase} 
    disabled={syncing || !currentOrganization}
    className="btn-outline-info"
    size="sm"
  >
    <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
    {syncing ? 'Syncing' : 'Sync'}
  </Button>
</div>
```

**Also update empty state (around line 148-155):**
```typescript
<div className="flex gap-2">
  <Button 
    onClick={() => navigate('/dashboard/leads/new')}
    className="btn-gradient-primary text-primary-foreground"
    size="sm"
  >
    <Plus className="h-3 w-3 mr-1" />
    Add Lead
  </Button>
  <Button onClick={syncFromDatabase} disabled={syncing} variant="outline" size="sm">
    <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
    Sync
  </Button>
  <LeadsUpload />
</div>
```

#### 2. NewVisit.tsx Changes

**Add import:**
```typescript
import { Plus } from 'lucide-react';
```

**Add below the Popover (after line 258, before the lead location status):**
```typescript
{/* Add New Lead Option */}
<div className="flex items-center gap-2 text-sm">
  <span className="text-muted-foreground">Can't find the prospect?</span>
  <Button
    variant="link"
    size="sm"
    className="p-0 h-auto text-primary font-medium"
    onClick={() => navigate('/dashboard/leads/new?returnTo=new-visit')}
  >
    <Plus className="h-3 w-3 mr-1" />
    Add New Lead
  </Button>
</div>
```

## Visual Summary

### Leads Page Header (After)
```text
┌──────────────────────────────────────────────────────────────┐
│ ← Dashboard                                                   │
│                                                               │
│ Prospects                    [+ Add Lead] [Upload📤] [🔄Sync] │
│ 🏢 Organization Name • 45 prospects                          │
└──────────────────────────────────────────────────────────────┘
```

### New Visit Page (After)
```text
┌──────────────────────────────────────────────────────────────┐
│ Lead *                                                        │
│ [Select lead...                                        ▼]     │
│                                                               │
│ Can't find the prospect? [+ Add New Lead]                     │
│                                                               │
│ ⚠️ This lead doesn't have a location... (if applicable)      │
└──────────────────────────────────────────────────────────────┘
```

## Button Styling

| Page | Button Style | Reason |
|------|--------------|--------|
| Leads Page Header | `btn-gradient-primary` | Primary action, should stand out |
| Leads Page Empty State | `btn-gradient-primary` | Encourage adding first lead |
| New Visit Page | `variant="link"` | Secondary action, non-intrusive |

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Leads.tsx` | Modify | Add "Add Lead" button in header and empty state, import Plus icon |
| `src/pages/NewVisit.tsx` | Modify | Add "Add New Lead" link below lead selector, import Plus icon |

## Note
This assumes a `/dashboard/leads/new` route exists for adding leads. If it doesn't exist, we may need to create a new page or use a dialog/modal for adding leads inline.
