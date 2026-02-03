
# Color Scheme & Typography Overhaul Plan

## Overview
This plan addresses the request to fix the color scheme across the entire platform using the provided color palette, ensuring proper contrast (no light-on-light or dark-on-dark text), compact design, and implementing Nunito Sans font family with comfortable font sizes.

---

## Color Palette Reference (from uploaded image)

### Primary Colors (Brand)
| Sequence | Color | Hex | Usage |
|----------|-------|-----|-------|
| 1 | Teal | #01B8AA | Primary brand color ✓ (already used) |
| 2 | Dark Teal | #374649 | Dark backgrounds, text on light |
| 4 | Gold | #F2C80F | Accent/Warning ✓ (already used) |
| 6 | Light Blue | #8AD4EB | Info color ✓ (already used) |
| 8 | Purple/Mauve | #A66999 | Secondary accent |

### Supporting Colors
| Sequence | Color | Hex | Usage |
|----------|-------|-----|-------|
| 9 | Ocean Blue | #3599B8 | Links, interactive elements |
| 10 | Light Gray | #DFBFBF | Muted backgrounds, borders |
| 11 | Sea Green | #4AC5BB | Success states |
| 12 | Dark Gray | #5F6B6D | Muted text |
| 19 | Dark Slate | #28738A | Dark accents |
| 21 | Deep Teal | #168980 | Alternative primary |
| 22 | Dark Forest | #293537 | Footer, dark sections |

### Status Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Coral/Salmon | #BB4A4A | Destructive/Error |
| Gold | #F2C80F | Warning |
| Sea Green | #4AC5BB | Success |

---

## Key Changes Required

### 1. CSS Variables Update (`src/index.css`)

**Light Mode Updates:**
- `--foreground`: Use #374649 (dark teal) for main text — ensures dark text on light backgrounds
- `--muted-foreground`: Use #5F6B6D (dark gray) for secondary text
- `--card`: Pure white #FFFFFF with proper shadows
- `--popover`: White with proper z-index and shadows
- `--destructive`: #BB4A4A (coral/salmon from palette)

**Dark Mode Updates:**
- `--foreground`: Use #DFBFBF or lighter for text on dark backgrounds
- `--card`: Use #293537 (dark forest) for elevated surfaces
- `--background`: Use #22292A or similar dark shade
- Ensure all text colors are light enough for contrast

### 2. Typography System

**Font Configuration:**
- Primary font: Nunito Sans (already configured in `index.html`)
- Font sizes adjusted for comfort:
  - `xs`: 0.75rem (12px) — fine print
  - `sm`: 0.8125rem (13px) — secondary text
  - `base`: 0.875rem (14px) — body text
  - `lg`: 1rem (16px) — emphasis
  - `xl`: 1.125rem (18px) — subheadings
  - `2xl`: 1.375rem (22px) — headings

### 3. Compact Design Adjustments

**Reduce vertical spacing:**
- Card padding: `p-3` instead of `p-4`
- Section gaps: `gap-2` or `gap-3` instead of `gap-4`
- Page margins: `py-3` instead of `py-4`
- Form element heights: Consistent `h-9` or `h-10`

### 4. Dropdown & Popover Fixes

**Ensure proper styling:**
- Solid background (not transparent)
- High z-index (z-50 or higher)
- Proper border and shadow
- Good contrast between dropdown background and text

---

## Files to Modify

### Core Styling Files

1. **`src/index.css`** — Main theme variables and utility classes
   - Update all CSS custom properties with new palette colors
   - Ensure HSL values calculated correctly
   - Add compact utility classes

2. **`tailwind.config.ts`** — Tailwind configuration
   - Update font sizes for comfort
   - Ensure color mappings are correct

### UI Component Files

3. **`src/components/ui/select.tsx`** — Dropdown backgrounds
4. **`src/components/ui/dropdown-menu.tsx`** — Menu backgrounds
5. **`src/components/ui/popover.tsx`** — Popover backgrounds
6. **`src/components/ui/dialog.tsx`** — Modal backgrounds
7. **`src/components/ui/card.tsx`** — Card styling

### Page-Specific Files (Compact adjustments)

8. **`src/pages/Dashboard.tsx`** — Compact hero section, tighter metrics grid
9. **`src/pages/Landing.tsx`** — Updated palette colors
10. **`src/pages/Auth.tsx`** — Form styling, contrast fixes
11. **`src/components/Layout.tsx`** — Header and navigation
12. **`src/components/AppSidebar.tsx`** — Sidebar styling
13. **`src/components/dashboard/MetricCard.tsx`** — Card compact styling

---

## Technical Implementation Details

### New CSS Variables (Light Mode)
```css
:root {
  /* Background & Surface */
  --background: 180 5% 98%;        /* Very light gray */
  --foreground: 192 16% 27%;       /* #374649 - Dark teal for text */
  
  /* Cards - Pure white */
  --card: 0 0% 100%;
  --card-foreground: 192 16% 27%;  /* Dark teal */
  
  /* Muted - Secondary text */
  --muted: 180 5% 95%;
  --muted-foreground: 192 7% 40%;  /* #5F6B6D */
  
  /* Primary - Brand Teal */
  --primary: 174 99% 36%;          /* #01B8AA */
  --primary-foreground: 0 0% 100%; /* White text on teal */
  
  /* Destructive - Coral */
  --destructive: 0 43% 51%;        /* #BB4A4A */
  
  /* Popover - Solid white with shadows */
  --popover: 0 0% 100%;
  --popover-foreground: 192 16% 27%;
  
  /* Border - Light, visible */
  --border: 180 5% 85%;
}
```

### Font Size Adjustments
```typescript
fontSize: {
  xs: ['0.75rem', { lineHeight: '1.4' }],    // 12px
  sm: ['0.8125rem', { lineHeight: '1.5' }],  // 13px  
  base: ['0.875rem', { lineHeight: '1.5' }], // 14px (reduced from 15px)
  lg: ['1rem', { lineHeight: '1.5' }],       // 16px
  xl: ['1.125rem', { lineHeight: '1.3' }],   // 18px
  '2xl': ['1.375rem', { lineHeight: '1.3' }],// 22px
  '3xl': ['1.625rem', { lineHeight: '1.2' }],// 26px
  '4xl': ['2rem', { lineHeight: '1.1' }],    // 32px
}
```

### Dropdown Fix Pattern
```tsx
<SelectContent className="bg-card border-border shadow-lg z-50">
  <SelectItem className="text-foreground hover:bg-muted">
    ...
  </SelectItem>
</SelectContent>
```

---

## Contrast Verification Checklist

| Element | Background | Text Color | Ratio |
|---------|------------|------------|-------|
| Body | Light gray (#F8F9FA) | Dark teal (#374649) | ✓ Good |
| Card | White | Dark teal (#374649) | ✓ Good |
| Primary button | Teal (#01B8AA) | White | ✓ Good |
| Muted text | Light bg | Dark gray (#5F6B6D) | ✓ Good |
| Dark mode body | Dark (#22292A) | Light (#DFBFBF) | ✓ Good |
| Dropdown | White | Dark teal | ✓ Good |

---

## Summary of Changes

1. **Color contrast fixes** — Ensure text is always readable with dark-on-light or light-on-dark
2. **Palette alignment** — Use provided hex colors consistently
3. **Typography comfort** — Slightly smaller, comfortable font sizes with Nunito Sans
4. **Compact layout** — Reduced padding and margins across all pages
5. **Dropdown visibility** — Solid backgrounds, proper shadows, high z-index
6. **Dark mode polish** — Proper contrast and surface colors
