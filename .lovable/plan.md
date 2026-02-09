

# Landing Page Redesign

Complete rewrite of `src/pages/Landing.tsx` to match the uploaded HTML design. This is a significant upgrade from the current simple layout to a full, multi-section marketing page.

## New Sections (in order)

1. **Sticky Navbar** -- Logo + nav links (Features, Who It's For, Pricing, FAQ) + "Start Free Trial" CTA. Scrolls to become translucent with backdrop blur.

2. **Hero** -- Two-column layout (text left, phone mockup right). Badge "Built for Insurance Field Teams", headline "Track Every Visit. Close More Policies.", descriptive subtitle, dual CTAs, and proof stats (500+ agents, 40% fewer missed follow-ups, 3x faster reporting). Right side: animated phone mockup showing a dashboard with stats and schedule, plus floating cards.

3. **Trust Bar** -- Horizontal strip with 4 trust indicators: Built for Indian teams, Enterprise-grade security, Works Offline, Setup in 10 Min.

4. **How It Works** -- 3-step process (Invite Team, Log Visits, Managers See Everything) with numbered circles and connecting line.

5. **Features** -- 6 feature cards in a 3-column grid with colored icon backgrounds, detailed descriptions covering GPS tracking, analytics, daily planning, prospect management, offline mode, and role-based access.

6. **Gamification** -- Two-column: text left describing commission/badge system, right side showing Bronze/Silver/Gold badge cards with hover effects.

7. **Who It's For (Use Cases)** -- 3 role cards: Sales Officer, Branch Manager, Admin/Leadership.

8. **Testimonials** -- 3 testimonial cards with star ratings, quotes, author avatars and details.

9. **Pricing** -- Single "Field Force Pro" card with "Most Popular" badge, Rs 99/user/month, 8 feature checkmarks, CTA button.

10. **FAQ** -- 6 questions in a 2-column grid covering offline support, multi-branch tracking, security, setup time, insurance categories, and GPS verification.

11. **Final CTA** -- Closing section with headline, subtitle, and dual CTA buttons.

12. **Footer** -- Copyright line with company name "ECR Technical Innovations Pvt. Ltd." and links.

## Technical Approach

- **Single file change**: Rewrite `src/pages/Landing.tsx` entirely
- **Styling**: Tailwind CSS classes + inline styles for gradients/shadows (matching the CSS variables from the HTML)
- **Fonts**: Add Google Fonts link for "DM Sans" and "Playfair Display" in `index.html`
- **Animations**: Intersection Observer for scroll-triggered fade-in animations, CSS keyframe float animation for phone mockup cards, sticky nav scroll detection via `useEffect`
- **Navigation**: All CTA buttons route to `/auth` via React Router's `useNavigate`; anchor links use smooth scroll via `scrollIntoView`
- **Responsive**: Single column on mobile (hide phone mockup), stack grids to 1-column below 900px
- **Existing assets**: Continue using `insync-logo-color.png` for the logo; remove dependency on `landing-bg.jpg` (the new design uses CSS gradients for background)
- **Color palette**: `#0B1A1E` deep bg, `#12282E` card bg, `#01B8AA` primary, `#FD625E` coral, `#F2C80F` yellow, `#FE9666` orange, `#8AD4EB` blue

