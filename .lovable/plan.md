

# Hide Scrollbars on Mobile and Tablet

## What Changes

Add CSS rules to hide all scrollbars (both native and custom) on screens smaller than 1024px (mobile + tablet breakpoints), while keeping scroll functionality intact.

## Changes

### `src/index.css` -- Add global scrollbar-hide rules

Add the following CSS at the end of the base layer or as a global rule:

```css
@media (max-width: 1023px) {
  * {
    scrollbar-width: none;           /* Firefox */
    -ms-overflow-style: none;        /* IE/Edge */
  }
  *::-webkit-scrollbar {
    display: none;                   /* Chrome, Safari, Opera */
  }
}
```

This uses `max-width: 1023px` which covers all devices below the `lg` Tailwind breakpoint (mobile and tablet). Content remains scrollable -- only the visible scrollbar is hidden.

No other files need to change.

