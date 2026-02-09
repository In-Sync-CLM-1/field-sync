

# Exotel SMS Integration for OTP Delivery

## What Will Change

The send-otp backend function will be updated to actually send SMS messages via Exotel when a user chooses phone verification during registration.

## Required Credentials

You will need to provide 4 secrets from your Exotel dashboard (Settings > API Settings):

1. **EXOTEL_API_KEY** -- Your API Key (SID)
2. **EXOTEL_API_TOKEN** -- Your API Token
3. **EXOTEL_SID** -- Your Account SID (e.g., "yourcompany1")
4. **EXOTEL_SENDER_ID** -- Your ExoPhone number or Sender ID header (e.g., "INSYNC" or a virtual number)

## Technical Details

### File: `supabase/functions/send-otp/index.ts`

Replace the placeholder phone branch (lines 88-93) with an actual Exotel API call:

```text
POST https://<EXOTEL_API_KEY>:<EXOTEL_API_TOKEN>@api.in.exotel.com/v1/Accounts/<EXOTEL_SID>/Sms/send
```

Parameters:
- `From`: The EXOTEL_SENDER_ID
- `To`: The user's phone number (with country code prefixed if not present)
- `Body`: "Your InSync verification code is: {code}. Valid for 10 minutes."

Authentication: HTTP Basic Auth using API Key and API Token.

The function will:
1. Read all 4 Exotel secrets from environment variables
2. Format the phone number (ensure +91 prefix for Indian numbers)
3. Make a POST request to Exotel's SMS API
4. Log success/failure and throw an error if the SMS fails to send

### No other files change
- The frontend already handles phone OTP flow correctly
- The `otp_verifications` table and `verify-otp` function already work

## Steps

1. Securely store the 4 Exotel credentials
2. Update the `send-otp` edge function with the Exotel API call
3. Deploy and test with a real phone number

