

# Seed Dummy Data for In-Sync Organization

## Current State
The In-Sync organization (`a6b515c0-...`) already has:
- 12 users (across 4 branches: HO, Bangalore South, Mumbai Central, Delhi North)
- 111 leads
- 43 daily plans
- 18 visits
- **0 customers** (visits reference customers but none exist)
- **0 attendance records**

## What Will Be Seeded

### 1. Customers (50 records)
- Realistic Indian names, phone numbers, addresses across cities
- Distributed across territories matching the branches (Mumbai, Delhi, Bangalore)
- Mix of statuses: active, inactive, pending
- Assigned to existing sales officers

### 2. Attendance Records (last 30 days, ~200 records)
- Punch-in/out records for all 10 sales officers/field agents
- Realistic times (9-10 AM punch-in, 5-7 PM punch-out)
- GPS coordinates near their branch cities
- Weekdays only

### 3. More Visits (100 additional records)
- Linked to the newly created customers
- Distributed among sales officers
- Mix of completed, in-progress, and cancelled
- Realistic check-in/out times and GPS data

### 4. Location History (~500 records)
- Tied to attendance records
- Simulates agent movement throughout the day
- Recorded every 15-30 minutes during working hours

## Technical Approach

Update the `seed-demo-data` edge function to:
1. Accept an `organization_id` parameter
2. Use existing users from that organization (no new user creation)
3. Insert customers, attendance, visits, and location history directly into Supabase tables
4. Use the service role key to bypass RLS

Then invoke it with the In-Sync organization ID.

### Files to modify
- `supabase/functions/seed-demo-data/index.ts` -- rewrite to seed org-specific data into actual DB tables

