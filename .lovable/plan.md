
# Make the Users Page Tour Step More Exciting

## What Changes
The current tour step on the Users page is generic -- it just highlights the page header with a plain message. We'll make it more engaging and actionable by:

1. **Targeting the "Add User" button directly** instead of the generic header, so the user's eye is drawn exactly where they need to click.
2. **Rewriting the tour copy** to be energetic and inspiring -- "Build Your Dream Team" with motivational language.
3. **Adding a `data-tour` attribute to the Add User button** so the tooltip points right at it.

## Technical Details

### File: `src/pages/Users.tsx`
- Add `data-tour="add-user-button"` to the "Add User" `<Button>` element (around line 464).

### File: `src/hooks/useAppTour.ts`
- Update the `users-page` tour step (lines 59-66):
  - Change `target` from `[data-tour="users-header"]` to `[data-tour="add-user-button"]`
  - Change `title` to something like: `"Build Your Dream Team!"`
  - Change `description` to something like: `"This is where the magic begins! Tap this button to add your first 3 rockstar team members and supercharge your sales force."`
  - Keep `position: 'bottom'`

### File: `src/components/AppTour.tsx`
- Update the page indicators array (line 188) to include 'Users' between 'Dashboard' and 'Planning' since it's now a distinct tour page: `['Dashboard', 'Users', 'Planning', 'Prospects']`

These are small, focused changes -- just copy updates and one added HTML attribute.
