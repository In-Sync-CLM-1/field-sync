

# Facelift: Remove Gradients, Fix Overflow, Replace "In-Sync" Text with Logo

## Three Tasks

### 1. Remove All Gradients from the App UI

Replace gradient-based CSS utilities with flat, solid-color alternatives. The user explicitly said "without using gradients."

**Edit `src/index.css`:**
- `.page-gradient::before` — remove the radial gradient, use plain `bg-background`
- `.header-gradient-bar` — replace gradient with solid `bg-primary`
- `.gradient-text-primary` / `.gradient-text-accent` — replace with solid `text-primary`
- `.btn-gradient-primary` — replace gradient with solid `bg-primary`
- `.hero-gradient` — replace gradient background with solid `bg-muted` with `border-primary/20` left accent
- `.hero-gradient::before` — remove the floating radial gradient orb
- `.gradient-primary`, `.gradient-accent`, `.gradient-brand` — replace with solid primary color
- `.xp-bar-fill` — solid primary instead of gradient
- `.progress-gradient::after` — solid primary
- `.gaming-accent-bar` — solid primary
- `.rank-gold`, `.rank-silver`, `.rank-bronze` — solid flat colors instead of gradients

**Edit `tailwind.config.ts`:**
- Remove `backgroundImage` gradient entries (`gradient-primary`, `gradient-accent`, `gradient-gaming`, `shimmer-gradient`)

### 2. Fix Header Overflow on Leads Page

The screenshots show the org badge "In-Sync" overlapping with the count text and action buttons.

**Edit `src/pages/Leads.tsx`:**
- Change the header layout from single-row `flex justify-between` to a stacked/wrapped layout on mobile
- Wrap the action buttons `(+ Add Lead, Upload, Sync)` to the next line on small screens using `flex-wrap`
- Make the org badge + count row more compact

### 3. Replace All "In-Sync" / "InSync" Text with the Logo Icon

The `in-sync-logo.png` already exists. Replace text references with the logo image across all pages.

**Files to edit:**

| File | Change |
|------|--------|
| `src/pages/Leads.tsx` | Replace `{currentOrganization.name}` badge with logo `<img>` (when org name matches "In-Sync") — actually, replace the org name badge with a small logo icon everywhere |
| `src/pages/Dashboard.tsx` | Same pattern — any org name display should use logo |
| `src/components/TrialBanner.tsx` | Replace "InSync" text with logo inline |
| `src/pages/SubscriptionExpired.tsx` | Replace "InSync" text references with logo |
| `src/pages/Auth.tsx` | Replace "InSync" text with logo where it appears in UI copy |
| `src/pages/Onboarding.tsx` | Replace "InSync" alt text / label references |
| `index.html` | Update `<title>` tag (keep as-is since it's metadata, not visible UI) |

### Technical Details

- The logo import path is `@/assets/in-sync-logo.png` (circular icon logo)
- For inline text replacement, use `<img src={logo} className="h-4 w-4 inline" />` to keep it compact
- The `insync-logo-color.png` is used on Landing/Auth/Onboarding — those are fine as full logos
- For the org badge in headers, replace `{currentOrganization.name}` with the logo when the name is the brand name
- All CSS gradient classes will be converted to solid flat colors maintaining the same hue

