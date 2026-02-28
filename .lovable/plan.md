

# Make Theme Modern and Vibrant

## Problem
The light mode is too white and washed out — white background, white cards, white sidebar, white popovers. Needs more color depth and vibrancy.

## Changes — All in `src/index.css` (`:root` variables)

### 1. Background and surfaces — add depth
- `--background`: Change from near-white `180 5% 98%` to a subtle cool-tinted gray `210 20% 96%`
- `--card`: Change from pure white `0 0% 100%` to a soft warm white `210 15% 99%`
- `--muted`: Shift from neutral gray to a tinted `210 15% 93%`

### 2. Sidebar — make it bold and branded
- `--sidebar-background`: Change from white `0 0% 100%` to a deep dark teal `192 40% 14%` (dark sidebar)
- `--sidebar-foreground`: Light text `180 5% 92%`
- `--sidebar-border`: Dark teal border `192 30% 20%`
- `--sidebar-accent`: Teal-tinted accent `174 40% 22%`
- `--sidebar-accent-foreground`: Bright white/light text

### 3. Borders and inputs — add subtle color
- `--border`: From plain gray `180 5% 85%` to slightly teal-tinted `200 12% 82%`
- `--input`: From gray `180 5% 88%` to tinted `200 10% 86%`

### 4. Shadows — warmer, more visible
- Increase shadow opacity slightly for more depth (from 0.05/0.08 to 0.07/0.12)

### 5. Cards — add a thin colored top accent
- Add a `.card-accent` utility with a 2px top border in primary color for key dashboard cards

This keeps the flat design principle but shifts from "sterile white" to a rich, modern palette with a dark branded sidebar and tinted surfaces.

