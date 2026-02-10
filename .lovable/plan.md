

## Fix App Tour Stability and Navigation

### Problems Identified

1. **Duplicate state instances**: Every call to `useAppTour()` creates independent state. Both `AppTour` and `TourTriggerButton` call it, resulting in two separate tour state machines that don't share state. This causes flickering and unpredictable behavior.

2. **Tooltip positioning race conditions**: The current delay-based approach (500ms + 1000ms retry) is fragile. If the target element isn't rendered yet or shifts position during page transitions, the tooltip jumps around.

3. **No smooth backward navigation across pages**: Going "Back" across page boundaries works functionally, but the loading overlay + positioning delays cause a jarring experience.

### Solution

#### 1. Convert tour state to a shared context (core fix)

Create a `TourContext` so all components share a single tour state instance instead of creating duplicates.

**New file: `src/contexts/TourContext.tsx`**
- Move all state from `useAppTour` into a React Context provider
- Export a `TourProvider` wrapper and a `useAppTour` hook that reads from context
- Place `TourProvider` in the app tree (inside `Layout` or `Dashboard`)

**Update: `src/hooks/useAppTour.ts`**
- Re-export the hook from the new context so existing imports keep working

#### 2. Improve tooltip positioning with MutationObserver

**Update: `src/components/AppTour.tsx`**
- Replace the fixed 500ms/1000ms timers with a `MutationObserver` that watches for the target element to appear in the DOM
- Once found, position immediately with a single `requestAnimationFrame` call
- Add a `ResizeObserver` on the target element to reposition if it changes size
- Set a 3-second maximum wait before showing a "skip this step" fallback

#### 3. Stabilize page transitions

**Update: `src/contexts/TourContext.tsx` (in the provider)**
- When navigating between pages, don't dismiss the loading overlay until the target element for the new step is actually present in the DOM (not just after a timeout)
- Use a polling check (every 100ms, max 3 seconds) for the target selector after route change

#### 4. Minor UX improvements
- On the last step (step 12), the "Back" button already works -- no change needed there
- Add `will-change: transform` to the tooltip for smoother animations
- Clear highlight classes more reliably on step change

### Files Changed

| File | Action |
|------|--------|
| `src/contexts/TourContext.tsx` | Create -- shared tour state provider |
| `src/hooks/useAppTour.ts` | Simplify -- re-export from context |
| `src/components/AppTour.tsx` | Update -- MutationObserver positioning, stable transitions |
| `src/pages/Dashboard.tsx` | Update -- wrap with `TourProvider` (or add to Layout) |

### Technical Notes

- The `MutationObserver` approach replaces arbitrary timeouts with event-driven detection, eliminating the root cause of flickering
- The shared context ensures `AppTour`, `TourTriggerButton`, and any future consumers all read/write the same state
- No new dependencies are needed
