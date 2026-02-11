

# Enhanced Prospect/Lead Management Module

## Overview
Upgrade the existing lead management system with a proper CRM pipeline, communication history logging, and next-action reminders.

## 1. Update Lead Status Pipeline

Replace the current insurance-specific statuses with a universal sales pipeline:

| Current Status | New Pipeline Status |
|---|---|
| lead | New |
| (missing) | Contacted |
| (missing) | Qualified |
| quoted | Quote Given |
| proposal_submitted | Proposal Sent |
| policy_issued | Won |
| (missing) | Lost |

**Database change:** Add new allowed values. Since the `status` column is free-text (no enum constraint), no migration is needed -- just update the UI constants.

## 2. Add Status Filter Chips to Leads List

On the Leads page (`Leads.tsx`), add horizontal scrollable filter chips below the search bar:
- All | New | Contacted | Qualified | Quote Given | Proposal Sent | Won | Lost
- Each chip shows a count badge
- Active chip is highlighted

The `filterStatus` state already exists in `useLeads` but was never wired to the UI.

## 3. Lead Status Update on Detail Page

On `LeadDetail.tsx`, add a status update dropdown/selector:
- Allows agents to move leads through the pipeline
- Shows current stage prominently with a colored progress indicator
- Status change triggers a communication history entry automatically

## 4. Communication History Log (New Table + UI)

**Database migration:** Create a `lead_activities` table:
```
lead_activities:
  - id (uuid, PK)
  - lead_id (uuid, FK to leads)
  - organization_id (uuid)
  - user_id (uuid) -- who performed the action
  - activity_type (text) -- call, whatsapp, visit, note, status_change, follow_up
  - description (text)
  - metadata (jsonb) -- old_status, new_status, etc.
  - created_at (timestamptz)
```

RLS policies: Users can view/create activities within their organization.

**UI on LeadDetail.tsx:** Add a "Timeline" section showing:
- All communication entries in reverse chronological order
- Icons per activity type (phone, message, map-pin, edit, etc.)
- "Add Note" button to log manual interactions
- Auto-logged entries when status changes or visits are made

## 5. Next Action Reminders

On the Leads list page, add visual indicators:
- Overdue follow-ups shown with a red badge
- Today's follow-ups highlighted in amber
- Upcoming follow-ups in green

On the Agent Dashboard, add a "Follow-ups Due Today" card listing leads that need attention, with quick-tap to open the lead detail.

## 6. Quick Log Actions on Lead Detail

Add action buttons below the contact section on `LeadDetail.tsx`:
- "Log Call" -- records a call activity
- "Log WhatsApp" -- records a WhatsApp interaction  
- "Add Note" -- free-text note entry
- Each opens a small dialog to add optional notes, then saves to `lead_activities`

## Files Summary

### New Files
| File | Purpose |
|---|---|
| `src/components/LeadActivityTimeline.tsx` | Timeline component showing communication history |
| `src/components/LogActivityDialog.tsx` | Dialog for logging calls, notes, WhatsApp messages |
| `src/components/LeadStatusPipeline.tsx` | Visual pipeline indicator and status changer |
| `src/hooks/useLeadActivities.ts` | Hook to fetch/create lead activities |

### Modified Files
| File | Change |
|---|---|
| `src/pages/Leads.tsx` | Add status filter chips with counts, overdue/today follow-up indicators |
| `src/pages/LeadDetail.tsx` | Add pipeline status changer, activity timeline, log action buttons |
| `src/pages/Dashboard.tsx` | Add "Follow-ups Due Today" card |
| `src/hooks/useLeads.tsx` | Update status constants, add follow-up query helpers |

### Database Migration
| Table | Change |
|---|---|
| `lead_activities` | New table for communication history with RLS policies scoped to organization |
