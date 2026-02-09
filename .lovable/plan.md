

# Increase All Font Sizes by 2px

## What Changes

Every font size in the Tailwind config will be bumped up by 2px, and the base body font size in CSS will be updated to match.

## Changes

### 1. `tailwind.config.ts` -- Update fontSize scale

| Token | Current | New |
|-------|---------|-----|
| xs | 0.75rem (12px) | 0.875rem (14px) |
| sm | 0.8125rem (13px) | 0.9375rem (15px) |
| base | 0.875rem (14px) | 1rem (16px) |
| lg | 1rem (16px) | 1.125rem (18px) |
| xl | 1.125rem (18px) | 1.25rem (20px) |
| 2xl | 1.375rem (22px) | 1.5rem (24px) |
| 3xl | 1.625rem (26px) | 1.75rem (28px) |
| 4xl | 2rem (32px) | 2.125rem (34px) |

### 2. `src/index.css` -- Update body base font-size

Change `font-size: 0.875rem` (14px) to `font-size: 1rem` (16px) to match the new `base` size.

### No other changes needed

All components use Tailwind's `text-xs`, `text-sm`, `text-base`, etc. classes, so updating the scale in one place propagates everywhere automatically.
