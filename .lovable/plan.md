
# Improve Text Readability on Landing Page

## Summary
Update the landing page text colors from dark slate tones to lighter, more readable colors that ensure proper contrast against the dark background.

---

## Changes

### File: `src/pages/Landing.tsx`

**1. Hero Section - Subheadline (Line 154)**
- Change: `text-slate-400` → `text-slate-200`
- Makes the description text more readable against the dark background

**2. Hero Section - Trust Text (Line 170)**
- Change: `text-slate-500` → `text-slate-300`
- Ensures the pricing/trial info is clearly visible

**3. Features Section - Feature Descriptions (Line 187)**
- Change: `text-slate-400` → `text-slate-300`
- Improves readability of feature cards

**4. Pricing Section - Subtitle (Lines 199-200)**
- Change: `text-slate-400` → `text-slate-300`
- Better contrast for the pricing subtitle

**5. Pricing Section - Price Unit (Line 210)**
- Change: `text-slate-400` → `text-slate-300`
- Makes "/user/month" more visible

**6. Footer - Copyright (Line 247-248)**
- Change: `text-slate-400` → `text-slate-300`
- Improves footer text visibility

**7. Footer - Links (Line 251)**
- Change: `text-slate-500` → `text-slate-400`
- Better readability for footer links

---

## Color Mapping Summary

| Current Color | New Color | Usage |
|--------------|-----------|-------|
| `text-slate-500` | `text-slate-300` | Trust text, footer links |
| `text-slate-400` | `text-slate-200` or `text-slate-300` | Subheadlines, descriptions |

This ensures all text maintains the flat design aesthetic while being clearly readable on the dark background.
