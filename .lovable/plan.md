
# Consolidate 3 OTP Functions into 1

## Current Problem
There are 3 separate edge functions for OTP:
- `send-otp` -- sends email OTP (plain text, insecure)
- `send-public-otp` -- sends WhatsApp OTP + verifies (bcrypt, secure)
- `verify-otp` -- verifies email OTP (plain text, insecure)

This creates duplication, inconsistent security (email uses plain text, WhatsApp uses bcrypt), and maintenance overhead.

## Plan

### 1. Create a single unified `send-public-otp` function
Keep `send-public-otp` as the sole function, extending it to handle both channels:

- **Send OTP**: `{ action: "send", channel: "whatsapp" | "email", phone?: string, email?: string }`
  - WhatsApp: sends via Exotel (already working)
  - Email: sends via Resend (ported from `send-otp`)
  - Both use bcrypt hashing for security

- **Verify OTP**: `{ action: "verify", phone?: string, email?: string, otp: string }`
  - Unified bcrypt verification for both channels
  - 5-attempt limit, 10-minute expiry

### 2. Update `Auth.tsx` frontend calls
- Replace `supabase.functions.invoke('send-otp', ...)` with `supabase.functions.invoke('send-public-otp', { body: { action: "send", channel: "email", email: ... } })`
- Replace `supabase.functions.invoke('verify-otp', ...)` with `supabase.functions.invoke('send-public-otp', { body: { action: "verify", email: ..., otp: ... } })`

### 3. Delete the redundant functions
- Delete `supabase/functions/send-otp/index.ts`
- Delete `supabase/functions/verify-otp/index.ts`
- Remove their entries from `supabase/config.toml` if present

## Technical Details

### Unified function interface:

```
// SEND
POST send-public-otp
{ action: "send", channel: "whatsapp", phone: "9876543210" }
{ action: "send", channel: "email", email: "user@example.com" }

// VERIFY
POST send-public-otp
{ action: "verify", phone: "9876543210", otp: "123456" }
{ action: "verify", email: "user@example.com", otp: "123456" }
```

### Email sending addition
- Import Resend in `send-public-otp`
- Port the email HTML template from existing `send-otp`
- Use bcrypt hashing (already in place for WhatsApp)

### Files changed
- `supabase/functions/send-public-otp/index.ts` -- add email channel support
- `src/pages/Auth.tsx` -- update all 3 function invocations to use `send-public-otp`
- `supabase/functions/send-otp/` -- delete entirely
- `supabase/functions/verify-otp/` -- delete entirely
