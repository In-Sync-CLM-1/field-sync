

# Remove "Log Call" & "Log WhatsApp" Buttons + Native Calling/WhatsApp Answer

## Task 1: Remove crossed-out buttons

### Edit `src/pages/LeadDetail.tsx`
- Remove the "Log Call" button (line 294-296) and "Log WhatsApp" button (line 297-299) from the quick actions section
- Keep "Call", "WhatsApp", and "Add Note" buttons

## Task 2: Native Call & WhatsApp — Already Implemented!

Good news: **both features already work exactly as you described.**

- **Call button**: Uses `tel:` protocol (`window.location.href = 'tel:...'`) — this opens the phone's native dialer with the number pre-filled, ready to dial with one tap.
- **WhatsApp button**: Uses `https://wa.me/...` — this opens the WhatsApp app directly and starts/opens a conversation thread with that number.

Both work on mobile devices (Android & iOS) out of the box. On desktop, the Call button will try to open a calling app (like FaceTime, Skype), and WhatsApp will open WhatsApp Web or the desktop app.

## Files
| Action | File |
|--------|------|
| Edit | `src/pages/LeadDetail.tsx` — remove "Log Call" and "Log WhatsApp" buttons |

