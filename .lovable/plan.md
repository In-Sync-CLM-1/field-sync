

# Make Help Widget Admin-Only

## Problem
The help widget script (`help-widget.js`) is loaded unconditionally in `index.html` for all users. It should only appear for logged-in admins.

## Changes

### 1. Remove the script from `index.html`
Remove line 39: `<script src="https://go-in-sync.lovable.app/help-widget.js" data-source="field_force_automation"></script>`

### 2. Create `src/components/HelpWidget.tsx`
A component that:
- Checks the user's role via `user_roles` table
- If the user has `admin`, `super_admin`, or `platform_admin` role, dynamically injects the script tag into the DOM
- Cleans up the script on unmount or when role doesn't match

### 3. Add `<HelpWidget />` to `src/components/Layout.tsx`
Place it inside the Layout so it only renders for authenticated users, and the role check gates the actual script injection.

