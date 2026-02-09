

# Seed Dummy Data for Team & Branches

## Overview
The 10 dummy team members already exist in the database with proper branch assignments and reporting hierarchy, but they have no `daily_plans` entries. This plan will insert daily plan records for all team members and fix two display issues.

## Data to Insert

Insert `daily_plans` entries for all 10 dummy agents with varied targets and actuals across recent dates (Feb 7-9):

| Agent | Branch | Prospects T/A | Quotes T/A | Sales T/A | Status |
|-------|--------|--------------|------------|-----------|--------|
| Rahul Sharma | Mumbai Central | 12/10 | 8/6 | 5/4 | approved |
| Priya Patel | Delhi North | 15/14 | 10/9 | 6/5 | submitted |
| Amit Kumar | Mumbai Central | 8/7 | 5/4 | 3/2 | approved |
| Sneha Gupta | Mumbai Central | 10/9 | 6/5 | 4/3 | submitted |
| Vikram Singh | Delhi North | 9/8 | 7/6 | 4/4 | approved |
| Raj Deshmukh | Delhi North | 11/10 | 8/7 | 5/3 | corrected |
| Anita Iyer | Delhi North | 7/6 | 4/3 | 2/2 | submitted |
| Neha Reddy | Mumbai Central | 10/8 | 6/5 | 3/3 | draft |
| Arjun Mehta | Mumbai Central | 13/12 | 9/8 | 5/4 | submitted |
| Kavita Joshi | Delhi North | 8/7 | 5/4 | 3/2 | approved |

This will be inserted for 3 dates each (Feb 7, 8, 9) = 30 total records.

## Bug Fixes

1. **"Policies" column header**: The Team Planning table still shows "Policies" in the header -- rename to "Sales" (missed in the earlier terminology update).
2. **Your profile name**: Update your profile's `full_name` from "a@in-sync.co.in" to a proper display name so it doesn't show as a truncated ID.

## Steps
1. Insert 30 `daily_plans` records for the 10 dummy agents across Feb 7-9
2. Fix the "Policies" column header in `TeamAndBranches.tsx` to "Sales"
3. Update your profile's `full_name` for better display

