

# Fix "Your Field." Text Readability

## Problem
The words "Your Field." in the hero heading use `text-[#01B8AA]` (teal) which appears as dark-colored text against the dark background, making it hard to read.

## Solution
Change "Your Field." span to use `text-white` for clear, flat-color readability while keeping the rest of the heading styling intact.

### File: `src/pages/Landing.tsx`

**Current:**
```jsx
<span className="text-[#01B8AA]" style={{ textShadow: '...' }}>Your Field.</span>
```

**Updated:**
```jsx
<span className="text-white">Your Field.</span>
```

Remove the teal color and glow text shadow, replacing with a single flat white color for maximum readability.

