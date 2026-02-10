

## Fix App Tour Stability and Navigation Issues

### Problems Identified

1. **Sidebar step (step 5) breaks on mobile**: The sidebar uses `collapsible="offcanvas"`, meaning it's hidden off-screen on mobile. The tour tries to highlight `[data-tour="sidebar"]` but it's not visible, causing the tooltip to either not appear or position incorrectly.

2. **MutationObserver fires excessively**: The observer watches all DOM changes on `document.body` with `{ childList: true, subtree: true }`. Every tiny DOM change triggers `updatePositionForTarget`, causing constant re-renders and flickering.

3. **Highlight z-index conflict with overlay**: The tour highlight has `z-index: 100` (in CSS) but the overlay is at `z-[99]`. The highlighted element sits above the overlay, but the tooltip is at `z-[100]` -- the same level as the highlight. This creates visual inconsistency and the highlighted element can intercept clicks.

4. **No scroll-into-view for off-screen targets**: If a target element (like "recent-visits" at the bottom of the page) is below the fold, the tooltip positions off-screen or at the edge.

5. **Back navigation across pages shows jarring "Navigating..." loader**: The loading overlay appears even for fast transitions, creating a poor experience.

### Solution

#### 1. Fix sidebar step for mobile
- Before highlighting the sidebar step, programmatically open the sidebar (if it's collapsed/offcanvas)
- Add a small delay to let the sidebar animate open before positioning the tooltip
- Close the sidebar when moving away from that step

#### 2. Throttle MutationObserver updates
- Add a debounce (150ms) to the MutationObserver callback so it doesn't fire on every micro-DOM change
- Once the target is found and positioned, disconnect the MutationObserver (keep only ResizeObserver)

#### 3. Fix z-index layering
- Set overlay to `z-[100]`
- Set highlighted element to `z-[101]` via inline style in JS (not just CSS class)
- Set tooltip to `z-[102]`

#### 4. Scroll target into view
- Before positioning, call `target.scrollIntoView({ behavior: 'smooth', block: 'center' })` 
- Wait for scroll to settle (200ms) before computing position

#### 5. Improve page transition UX
- Remove the full-screen "Navigating..." overlay
- Instead, show a subtle inline loading state within the tooltip itself
- Only show loading if element isn't found within 300ms (skip loader for fast transitions)

### Files Changed

| File | Action | Changes |
|------|--------|---------|
| `src/components/AppTour.tsx` | Update | Debounce MutationObserver, scroll-into-view, fix z-index, improve transition UX |
| `src/contexts/TourContext.tsx` | Update | Add sidebar open/close logic for sidebar step, export sidebar control |
| `src/index.css` | Update | Fix tour-highlight z-index to work with new layering |

### Technical Details

**Sidebar control**: Import `useSidebar` from the sidebar component to programmatically toggle the sidebar open/closed when the tour reaches the sidebar step. In `TourContext`, detect when current step targets `[data-tour="sidebar"]` and call `setOpen(true)`.

**MutationObserver debounce pattern**:
```typescript
let debounceTimer: number;
const mo = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    const el = document.querySelector(selector);
    if (el) {
      updatePositionForTarget(el);
      mo.disconnect(); // Stop observing once found
    }
  }, 150);
});
```

**Scroll-into-view before positioning**:
```typescript
target.scrollIntoView({ behavior: 'smooth', block: 'center' });
setTimeout(() => {
  setPosition(computePosition(target, currentStepData.position));
  setTargetFound(true);
}, 250);
```

