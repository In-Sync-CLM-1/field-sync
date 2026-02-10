
# Fix WhatsApp OTP Template Language Code

## Problem
The edge function uses language code `"en_US"` but the WhatsApp template is configured with language `"English"` which maps to `"en"` in the Meta/Exotel API.

## Change
In `supabase/functions/send-public-otp/index.ts`, line 45:

Change:
```
language: { code: "en_US" }
```
To:
```
language: { code: "en" }
```

That's the only change needed. Everything else (template name `"otp"`, body parameter, copy-code button parameter) matches the screenshot's "Copy code" delivery setup.

## After Fix
- Re-deploy the function
- Re-test sending OTP to 7738919680
