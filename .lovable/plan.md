

# Add Call & WhatsApp Buttons to Lead Cards

## Edit `src/pages/Leads.tsx`

- Import `MessageSquare` icon from lucide-react
- Add a row of Call and WhatsApp buttons at the bottom of each lead card (after the location/phone/date row)
- **Call button**: Uses `tel:` protocol to open native dialer — `<a href="tel:{mobileNo}">`
- **WhatsApp button**: Uses `https://wa.me/{number}` to open WhatsApp app
- Both buttons use `e.stopPropagation()` to prevent navigating to lead detail when clicking them
- Buttons are disabled when `mobileNo` is not available
- Small icon buttons styled with `variant="outline"` to match the card aesthetic

### Layout
The buttons will appear as a small action row at the bottom-right of each card, next to the existing metadata.

| Action | File |
|--------|------|
| Edit | `src/pages/Leads.tsx` — add Call & WhatsApp action buttons to each lead card |

