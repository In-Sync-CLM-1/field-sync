
# New Landing Page - Complete Rebuild

## Overview
Create a brand new one-page landing page from scratch that showcases In-Sync Field Force with all specified features, pricing, and trial information.

---

## Brand Elements to Include
- **Logo**: `insync-logo-color.png`
- **Colors**: Slate-950 (dark background), Lime-400 (accent)
- **Pricing**: ₹99/user/month
- **Trial**: 14-day free trial

---

## Page Structure

```text
┌─────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR                                             │
│  [Logo + In-Sync Field Force]              [Sign In Button] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO SECTION                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "14-Day Free Trial" Badge                          │   │
│  │                                                     │   │
│  │  Your Field. Your Control.                         │   │
│  │                                                     │   │
│  │  Track visits, boost performance, close more       │   │
│  │  policies with real-time field sales management.   │   │
│  │                                                     │   │
│  │  [Start 14-Day Free Trial]   [See How It Works]    │   │
│  │                                                     │   │
│  │  ₹99/user/month after trial · No credit card       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FEATURES SECTION (6 Feature Cards)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ GPS Visit    │  │ Performance  │  │ Team         │     │
│  │ Tracking     │  │ Analytics    │  │ Management   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Daily        │  │ Real-Time    │  │ Secure &     │     │
│  │ Planning     │  │ Sync         │  │ Reliable     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRICING SECTION                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Simple, Transparent Pricing                        │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────┐         │   │
│  │  │  ₹99 /user /month                     │         │   │
│  │  │                                       │         │   │
│  │  │  ✓ 14-day free trial                  │         │   │
│  │  │  ✓ All features included              │         │   │
│  │  │  ✓ Unlimited team members             │         │   │
│  │  │  ✓ Cancel anytime                     │         │   │
│  │  │                                       │         │   │
│  │  │  [Start 14-Day Free Trial →]          │         │   │
│  │  └───────────────────────────────────────┘         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                     │
│  [Logo] © 2025 In-Sync Field Force | Privacy | Terms        │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File Changes
| File | Action |
|------|--------|
| `src/pages/Landing.tsx` | Replace entirely with new design |

### Design Specifications

**Background**
- Dark gradient: `slate-950 → slate-900 → slate-950`
- Subtle grid pattern overlay
- Lime accent glow at top

**Navigation**
- Logo (h-14 mobile, h-20 desktop)
- Brand name with lime accent
- Ghost-style Sign In button

**Hero Section**
- Badge: "14-Day Free Trial" with lime accent
- Headline: Large, bold, lime-accented
- Subheadline: Slate-400 text
- Two CTA buttons (primary lime, secondary outline)
- Trust text with pricing teaser

**Features Grid**
- 6 cards in 2x3 (mobile) or 3x2 (desktop) layout
- Each card: icon, title, description
- Hover effects with lime border glow

**Pricing Section**
- Centered card with lime border accent
- Large ₹99 price display
- Checkmark list of benefits
- CTA button

**Footer**
- Logo, copyright, navigation links

### The 6 Features
1. **GPS Visit Tracking** - MapPin icon
2. **Performance Analytics** - BarChart3 icon
3. **Team Management** - Users icon
4. **Daily Planning** - Target icon
5. **Real-Time Sync** - Clock icon
6. **Secure & Reliable** - Shield icon

---

## Code Structure

The new component will be structured as:

```tsx
const Landing = () => {
  const features = [...]; // 6 features array
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950...">
      {/* Background elements */}
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav>...</nav>
        
        {/* Hero Section */}
        <section>...</section>
        
        {/* Features Section */}
        <section>...</section>
        
        {/* Pricing Section */}
        <section>...</section>
        
        {/* Footer */}
        <footer>...</footer>
      </div>
    </div>
  );
};
```

---

## Key Differences from Current Page

| Aspect | Current | New |
|--------|---------|-----|
| Trial messaging | "Start Free Trial" | "Start 14-Day Free Trial" |
| Pricing display | Not shown prominently | Dedicated section with ₹99/user/month |
| Hero trust text | Generic | Includes pricing + trial duration |
| Pricing section | None | Full pricing card with benefits |
| Overall focus | Feature-heavy | Balanced features + pricing |

---

## Summary
This creates a fresh, focused one-page landing that clearly communicates:
- The 14-day free trial offer
- ₹99/user/month pricing
- All 6 key features
- Clear call-to-action throughout

The design maintains the dark slate-950/lime-400 brand aesthetic while presenting the information in a cleaner, more sales-focused layout.
