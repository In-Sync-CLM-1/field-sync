
# Remove "See How It Works" Button from Landing Page

## Summary
Simplify the hero section Call-to-Action by removing the "See How It Works" button and video dialog, keeping only the primary "Start 14-Day Free Trial" button.

---

## Changes

### File: `src/pages/Landing.tsx`

**1. Remove Video State**
- Remove the `showVideoDialog` state variable since the video dialog will no longer be needed

**2. Remove Unused Imports**
- Remove the `Play` and `X` icons from lucide-react imports (they're only used for the video button and dialog)
- Keep the `Dialog, DialogContent, DialogHeader, DialogTitle` imports removed as well

**3. Simplify Hero CTA Section (Lines 161-178)**
- Remove the secondary "See How It Works" button entirely
- Keep the primary "Start 14-Day Free Trial" button
- Center the single CTA button instead of flex row layout

**4. Remove Video Dialog Component (Lines 271-306)**
- Remove the entire Video Tutorial Dialog at the bottom of the component

---

## Visual Result

**Before:**
```text
[Start 14-Day Free Trial →]  [▷ See How It Works]
```

**After:**
```text
[Start 14-Day Free Trial →]
```

The landing page will have a cleaner, more focused call-to-action directing all users to start their trial immediately.
