
# WhatsApp OTP via Exotel Integration

## What Changes

Replace the placeholder SMS logic in the `send-otp` backend function with Exotel's WhatsApp API, so users receive their OTP on WhatsApp instead of SMS.

## Required Secrets

You'll need to provide **5 secrets** from your Exotel dashboard:

| Secret | Where to find it |
|---|---|
| `EXOTEL_API_KEY` | Exotel Dashboard > API Settings |
| `EXOTEL_API_TOKEN` | Exotel Dashboard > API Settings |
| `EXOTEL_SID` | Exotel Dashboard > Account SID |
| `EXOTEL_SUBDOMAIN` | Your Exotel API subdomain (e.g. `api.exotel.com`) |
| `WHATSAPP_FROM_NUMBER` | Your registered WhatsApp business number |

## Technical Details

### 1. Add secrets (5 new secrets)

Store the Exotel credentials securely so the backend function can access them.

### 2. Update `supabase/functions/send-otp/index.ts`

Replace the placeholder phone branch (lines 88-93) with an Exotel WhatsApp API call:

- Import bcrypt for hashing OTP before storage (enhanced security per your documentation)
- When `identifier_type === "phone"`:
  - Hash the OTP with bcrypt before storing in the database
  - Format the phone number (strip non-digits, ensure proper format for Exotel -- digits only, no "+" prefix)
  - Call Exotel's WhatsApp API:
    - Endpoint: `https://{EXOTEL_SUBDOMAIN}/v2/accounts/{EXOTEL_SID}/messages`
    - Auth: Basic auth with `EXOTEL_API_KEY:EXOTEL_API_TOKEN`
    - Payload uses the approved `psotp1` template with the OTP in body and button components
  - Throw error if WhatsApp send fails

### 3. Update `supabase/functions/verify-otp/index.ts`

Since the OTP will now be stored as a bcrypt hash for phone verification:

- Import bcrypt
- When `identifier_type === "phone"`, fetch the latest unverified/unexpired OTP for that phone (without matching on plaintext code)
- Compare submitted code against the stored hash using bcrypt
- Add attempt tracking: increment an `attempts` counter, reject if attempts >= 5

Note: Email OTP will continue working as-is (plaintext match) to avoid breaking existing flow.

### 4. Database migration

Add an `attempts` column to `otp_verifications` table:

```sql
ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0;
```

### 5. No frontend changes needed

The existing `Auth.tsx` already sends the correct `identifier_type: "phone"` and calls `send-otp` / `verify-otp` properly. The success toast will say "Verification code sent to your phone" which is accurate for WhatsApp delivery.

## Steps in order

1. Add the 5 Exotel secrets
2. Run database migration to add `attempts` column
3. Update `send-otp` edge function with WhatsApp API call
4. Update `verify-otp` edge function with bcrypt comparison and attempt tracking
5. Deploy and test with a real phone number
