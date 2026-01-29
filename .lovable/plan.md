
# Update Dashboard Colors to Brand Palette

## Problem
The current Dashboard uses a rainbow color scheme (violet, pink, cyan, lime) which looks unprofessional and doesn't match the established brand identity. The screenshot shows:
- Rainbow gradient header bar
- Multi-colored metric card borders (red, purple, blue, green)
- Rainbow quick action buttons
- Various bright neon colors clashing

## Brand Color Palette
According to the brand guidelines, we should use:
- **Primary (Teal):** #01B8AA
- **Light Blue:** #8AD4EB  
- **Purple:** #A66999
- **Gold:** #F2C80F
- **Background:** Slate-950 dark aesthetic (or light mode equivalent)

## Solution Overview
Replace the current "gaming neon" color system with the professional brand palette, creating a cohesive, modern look with consistent teal-focused theming.

---

## Files to Modify

### 1. `src/index.css` - Core CSS Variables

Replace the current color definitions with brand-aligned colors:

| Current Variable | Current Color | New Color | Hex |
|-----------------|---------------|-----------|-----|
| `--primary` | Electric Violet | Teal | #01B8AA |
| `--accent` | Lime Green | Gold | #F2C80F |
| `--info` | Cyan | Light Blue | #8AD4EB |
| `--neon-pink` | Neon Pink | Purple | #A66999 |
| `--neon-cyan` | Neon Cyan | Light Blue | #8AD4EB |
| `--neon-violet` | Neon Violet | Teal | #01B8AA |
| `--neon-lime` | Neon Lime | Gold | #F2C80F |

**Additional changes:**
- Update gradient utilities to use brand colors
- Simplify the header gradient bar to use teal-to-purple (not rainbow)
- Update glow/shadow utilities to use teal

### 2. `src/pages/Dashboard.tsx` - Metric Card Colors

Update the accent colors for metric cards to use a cohesive palette:

| Metric | Current | New |
|--------|---------|-----|
| Visits Today | `primary` (violet) | `primary` (teal) |
| This Week | `info` (cyan) | `info` (light blue) |
| Active Visits | `warning` (amber) | `warning` (gold) |
| Total Leads | `accent` (lime) | `accent` (gold) |

Update Quick Action button classes for consistent styling.

### 3. `src/components/dashboard/MetricCard.tsx` - No Changes Needed

The component already uses the CSS variables, so updating the CSS will automatically apply new colors.

---

## Color Mapping Details

**HSL Conversions for CSS:**
```text
Teal #01B8AA      → 174 99% 36%
Light Blue #8AD4EB → 197 73% 73%
Purple #A66999    → 319 24% 62%
Gold #F2C80F      → 48 93% 50%
```

**Gradient Updates:**
- Header bar: Teal → Purple (subtle, professional)
- Hero section: Teal gradient backgrounds
- Button primary: Solid teal or teal-to-purple gradient

---

## Visual Impact

**Before:**
- Rainbow gradient header
- Clashing neon colors (violet, pink, cyan, lime)
- Gaming aesthetic that looks unprofessional

**After:**
- Clean teal-purple gradient header
- Cohesive brand colors throughout
- Professional, modern appearance
- Consistent color hierarchy (teal for primary, gold for accents)

---

## Implementation Steps

1. Update CSS color variables in `:root` and `.dark` sections
2. Update gradient utilities to use new brand colors
3. Simplify header gradient bar
4. Update Dashboard metric card accent colors
5. Update Quick Action button styling
6. Update any other affected components
