

# Create Lead Form Page Plan

## Problem
The "Add Lead" button navigates to `/dashboard/leads/new`, but this route is being matched by the existing `/dashboard/leads/:id` route, causing `LeadDetail` to try fetching a lead with ID "new" and showing "Prospect not found".

## Solution
Create a dedicated `NewLead.tsx` page with a form to add new leads, and add a specific route for it that takes precedence over the dynamic `:id` route.

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/NewLead.tsx` | Lead creation form with all required fields |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route `/dashboard/leads/new` before `/dashboard/leads/:id` |

## Technical Implementation

### 1. Route Configuration (App.tsx)

Add the new route BEFORE the dynamic `:id` route so it takes precedence:

```typescript
<Route path="leads" element={<Leads />} />
<Route path="leads/new" element={<NewLead />} />  {/* ADD THIS */}
<Route path="leads/:id" element={<LeadDetail />} />
```

### 2. New Lead Form (NewLead.tsx)

**Form Fields (based on leads table schema):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | text | Yes | Customer/Lead name |
| mobile_no | text | No | Mobile number |
| policy_type_category | select | No | Life/Health/Motor/General |
| policy_type | text | No | Specific policy type |
| premium_amount | number | No | Annual premium |
| village_city | text | No | Village or City |
| district | text | No | District |
| state | text | No | State |
| lead_source | text | No | Source of lead |
| customer_response | textarea | No | Notes |
| follow_up_date | date | No | Follow-up date |

**Component Structure:**
```text
NewLead
├── Header with "Back to Prospects" link
├── Card
│   └── Form
│       ├── Personal Details Section
│       │   ├── Name (required)
│       │   └── Mobile Number
│       ├── Policy Details Section
│       │   ├── Policy Category (dropdown)
│       │   ├── Policy Type
│       │   └── Premium Amount
│       ├── Location Section
│       │   ├── Village/City
│       │   ├── District
│       │   └── State
│       ├── Additional Info Section
│       │   ├── Lead Source
│       │   ├── Follow-up Date
│       │   └── Customer Response/Notes
│       └── Submit Button
└── Handle returnTo param for NewVisit flow
```

**Key Features:**
- Uses existing `useLeads().addLead()` function to save
- Handles `returnTo=new-visit` query param to redirect back to New Visit page
- Current location capture button for coordinates
- Form validation with React Hook Form + Zod
- Success toast and navigation on save

### 3. Form Layout Mockup

```text
┌─────────────────────────────────────────────────────────┐
│ ← Back to Prospects                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Add New Lead                                        │ │
│ │ Create a new prospect/lead                          │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                     │ │
│ │ Personal Details                                    │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Name *                                          │ │ │
│ │ │ [Enter customer name                         ]  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Mobile Number                                   │ │ │
│ │ │ [Enter mobile number                         ]  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ Policy Details                                      │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Policy Category                                 │ │ │
│ │ │ [Select category...                          ▼] │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Policy Type                                     │ │ │
│ │ │ [Enter policy type                           ]  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Premium Amount (Annual)                         │ │ │
│ │ │ [₹ Enter amount                              ]  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ Location                                            │ │
│ │ ┌────────────────────┐ ┌────────────────────────┐  │ │
│ │ │ Village/City       │ │ District               │  │ │
│ │ │ [City name      ]  │ │ [District name      ]  │  │ │
│ │ └────────────────────┘ └────────────────────────┘  │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ State                                           │ │ │
│ │ │ [State name                                  ]  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │ [📍 Capture Current Location]                       │ │
│ │                                                     │ │
│ │ Additional Details                                  │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Lead Source                                     │ │ │
│ │ │ [Select source...                            ▼] │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Follow-up Date                                  │ │ │
│ │ │ [📅 Select date...                           ]  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Notes                                           │ │ │
│ │ │ [                                            ]  │ │ │
│ │ │ [                                            ]  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ [              ✓ Save Lead                       ]  │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### Form Submission Logic:
```typescript
const onSubmit = async (data: FormData) => {
  const newLead = await addLead({
    ...data,
    organizationId: currentOrganization?.id,
    status: 'lead',
    createdBy: user?.id,
  });
  
  // Handle returnTo param for New Visit flow
  const returnTo = searchParams.get('returnTo');
  if (returnTo === 'new-visit') {
    navigate(`/dashboard/visits/new?leadId=${newLead.id}`);
  } else {
    navigate('/dashboard/leads');
  }
};
```

### Policy Category Options:
- Life Insurance
- Health Insurance  
- Motor Insurance
- General Insurance

### Lead Source Options:
- Direct/Walk-in
- Referral
- Digital/Online
- Branch Campaign
- Other

## Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/NewLead.tsx` | Create | Lead creation form with all fields, validation, and save logic |
| `src/App.tsx` | Modify | Add `/dashboard/leads/new` route before dynamic `:id` route |
