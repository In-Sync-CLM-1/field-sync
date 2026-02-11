

# Visual Org Chart

## Overview
Add a new **Org Chart** page that displays the full organizational hierarchy as a visual tree diagram: Branches at the top, Managers underneath, and Agents (Sales Officers) at the leaf level. Accessible from the sidebar under the MANAGEMENT section (Admin only).

## How It Works

1. Admin navigates to **Org Chart** from the sidebar
2. The page fetches all profiles, branches, and user roles for the current organization
3. It renders a top-down tree layout:

```text
       [Organization]
        /         \
   [Branch A]   [Branch B]
      |              |
  [Manager 1]   [Manager 2]
   /     \           |
[Agent] [Agent]   [Agent]
```

4. Each node shows the user's name, role badge, and active/inactive status
5. Unassigned users (no branch or no manager) appear in a separate "Unassigned" section at the bottom
6. Clicking a user node navigates to the Edit User dialog or shows a detail popover

## Technical Details

### New Files

| File | Purpose |
|---|---|
| `src/pages/OrgChart.tsx` | Main page component with tree rendering |

### Modified Files

| File | Change |
|---|---|
| `src/App.tsx` | Add `/dashboard/org-chart` route |
| `src/components/AppSidebar.tsx` | Add "Org Chart" link under MANAGEMENT section (Admin only) |

### Data Fetching

Uses existing queries -- no new tables or migrations needed:
- `profiles` table: `id`, `full_name`, `branch_id`, `reporting_manager_id`, `is_active`, `organization_id`
- `user_roles` table: `user_id`, `role`
- `branches` table: `id`, `name`, `is_active`

### Tree Construction Logic

1. Group users by `branch_id`
2. Within each branch, identify managers (`branch_manager` role)
3. Under each manager, list agents where `reporting_manager_id` matches
4. Handle edge cases: users with no branch, agents with no manager, empty branches

### UI Design

- Pure CSS/Tailwind tree layout using flexbox (no external library needed)
- Vertical connectors drawn with CSS borders
- Each node is a compact Card with: avatar initial, name, role Badge
- Inactive users shown with reduced opacity
- Responsive: on mobile, the tree scrolls horizontally within a ScrollArea
- Branch nodes use a folder icon, user nodes use avatar initials

