

# Replace "Commission" with "Incentives" and "Policy/Policies" with "Sales"

## Overview
This is a UI terminology update across the application. All user-facing text will be changed:
- **Commission** becomes **Incentives** (everywhere it appears as a label)
- **Policy / Policies** becomes **Sales / Sales** (in table headers, badges, card titles, chart titles, landing page copy, etc.)

Database column names and internal variable names will NOT be changed — only the displayed text users see.

## Scope of Changes

### Files to Update

**1. `src/pages/Planning.tsx`** (heaviest changes)
- "Team Commission" → "Team Incentives"
- "Commission" table header → "Incentives"
- "Total Team Commission" → "Total Team Incentives"
- "Monthly Commission" → "Monthly Incentives"
- "Commission Earned" → "Incentives Earned"
- "7 Policies" / "15 Policies" / "25 Policies" milestone labels → "7 Sales" / "15 Sales" / "25 Sales"
- "Policies" row label in Target vs Achievement table → "Sales"
- "polic{ies/y}" dynamic text → "sale(s)"
- "Base (7 policies)" breakdown label → "Base (7 sales)"

**2. `src/pages/AnalyticsHub.tsx`**
- "Team Commission" KPI card → "Team Incentives"
- "Policy Issuance Trend (30 Days)" chart title → "Sales Trend (30 Days)"
- "Policies: Target vs Actual" chart title → "Sales: Target vs Actual"
- Tooltip formatter: "Policies" → "Sales"
- "policies" label under top performer count → "sales"
- "Policies (T/A/%)" table header → "Sales (T/A/%)"
- "Commission" table header → "Incentives"

**3. `src/pages/BranchAnalytics.tsx`**
- "Team Commission" KPI card → "Team Incentives"
- "Policy Issuance Trend (30 Days)" → "Sales Trend (30 Days)"
- "Policies: Target vs Actual" → "Sales: Target vs Actual"
- Tooltip: "Policies" → "Sales"
- "Policies (T/A/%)" table header → "Sales (T/A/%)"
- "Commission" table header → "Incentives"

**4. `src/pages/TeamPlanning.tsx`**
- "Policies" stat badge and table header → "Sales"

**5. `src/pages/PlanningOverview.tsx`**
- "Policies" in any summary badges or table headers → "Sales"

**6. `src/pages/Landing.tsx`**
- "commission tracking" → "incentive tracking"
- "Commission tracking and milestone badges" → "Incentive tracking and milestone badges"
- "track your commission progress" → "track your incentive progress"
- "Commission tracking & milestone badges" pricing feature → "Incentive tracking & milestone badges"
- "prospects, quotes, and policies" → "prospects, quotes, and sales"
- "Policy Category" labels in feature descriptions remain unchanged (these refer to the category field name, not the terminology being replaced)

**7. `src/pages/NewLead.tsx`**
- "Policy Details" section header → "Sales Details"
- "Policy Category" form label → "Sales Category"
- "Policy Type" form label → "Sales Type"
- "Enter policy type" placeholder → "Enter sales type"
- POLICY_CATEGORIES constant labels can stay (Life Insurance, Health Insurance, etc. — these are category values)

**8. `src/pages/LeadDetail.tsx`**
- "Policy Details" section header → "Sales Details"
- "Policy Type" label → "Sales Type"

**9. `src/pages/Leads.tsx`**
- No visible UI text changes needed (only internal status values like 'policy_issued' which are DB values)

**10. `src/hooks/useMonthlyIncentive.ts`**
- Code comments: "policies" → "sales" (minor, for consistency)

## What Will NOT Change
- Database column names (policies_target, policies_actual, policy_type, etc.)
- Variable/property names in code (policiesTarget, policiesActual, etc.)
- Internal status values like 'policy_issued'
- "Privacy Policy" link text in footer (this is a legal term, not the same "policy")
- RLS policies or database schema

## Steps
1. Update Planning.tsx (commission → incentives, policies → sales in all UI text)
2. Update AnalyticsHub.tsx (same replacements in charts, tables, KPI cards)
3. Update BranchAnalytics.tsx (same replacements)
4. Update TeamPlanning.tsx and PlanningOverview.tsx (table headers and badges)
5. Update Landing.tsx (marketing copy)
6. Update NewLead.tsx and LeadDetail.tsx (form labels and section headers)
7. Update useMonthlyIncentive.ts comments
