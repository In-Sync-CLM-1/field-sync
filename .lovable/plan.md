

# Verify Both Email and Phone During Registration and User Creation

## Overview
Currently, registration lets users choose either email OR phone for OTP verification. This plan changes the flow so **both** email and phone are verified sequentially -- first one channel, then the other -- before registration completes. For admin-created users, OTPs are sent automatically to both channels for verification.

## Changes

### 1. Make phone number mandatory during registration
- Update the `signUpSchema` in `Auth.tsx` to require phone (remove `.optional()`)
- Phone field label changes from "Phone (for OTP verification) - Optional if verifying via email" to just "Phone"

### 2. Change registration flow: verify both channels sequentially
Instead of the current "pick one" verification method screen, the new flow is:

```text
[Details Form] --> [Verify Phone via WhatsApp OTP] --> [Verify Email OTP] --> [Complete Registration]
```

- Remove the "verify-method" step entirely
- Add new registration steps: `'details' | 'otp-phone' | 'otp-email' | 'complete'`
- After details submission, automatically send WhatsApp OTP to phone
- After phone OTP verified, automatically send email OTP
- After both verified, complete registration
- Track verification state with `phoneVerified` and `emailVerified` booleans

### 3. Admin user creation: send OTPs after account creation
When an admin creates a user via the `create-user` edge function:
- After user is created successfully, the frontend (Users.tsx) automatically sends OTPs to both the new user's email and phone via `send-public-otp`
- Display a notification that verification codes have been sent to the new user
- The new user will need to verify these codes when they first log in (or the admin can relay them)

**Alternative (simpler) approach for admin-created users**: Since admins are trusted and already set `email_confirm: true`, we can instead mark admin-created users as pre-verified by inserting verified OTP records for both channels directly in the `create-user` edge function. This avoids requiring the new user to verify separately.

### 4. Files to modify

**`src/pages/Auth.tsx`**:
- Make phone required in schema
- Replace `RegistrationStep` type with `'details' | 'otp-phone' | 'otp-email' | 'complete'`
- Remove `verificationType` state and the "verify-method" UI
- Add `phoneVerified` / `emailVerified` state
- After details submit: send WhatsApp OTP, show phone OTP screen
- After phone verified: send email OTP, show email OTP screen  
- After email verified: call `completeRegistration()`
- Update `renderRegistrationStep()` with two OTP screens instead of method picker

**`supabase/functions/create-user/index.ts`**:
- After successfully creating the user and assigning role, call the OTP send logic for both email and phone
- Insert pre-verified OTP records (since admin trusts the data), OR send actual OTPs to both channels so the user verifies on first login

### 5. UI Flow

Registration steps become:
1. **Details** -- fill name, email, phone, password, org (phone is now required)
2. **Verify Phone** -- "We sent a code to your WhatsApp" + 6-digit input
3. **Verify Email** -- "We sent a code to your email" + 6-digit input  
4. **Complete** -- success screen, redirect

Each OTP screen shows a back button, resend option, and the target identifier.

## Technical Details

- The `send-public-otp` function already supports both `channel: "whatsapp"` and `channel: "email"`, so no backend changes needed for OTP sending/verification
- Phone validation regex already exists in the schema, just needs `.optional()` removed
- The OTP screens reuse the existing `InputOTP` component and verification logic
- For admin-created users, the `create-user` edge function will invoke `send-public-otp` internally (via fetch to the function URL) for both channels after user creation
