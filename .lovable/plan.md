

## Fix: WhatsApp OTP Not Delivering

### Root Cause
Two mismatches between the code and your Exotel template configuration:

1. **Wrong template name**: Code sends `psotp1`, but your Exotel template is named `otp`
2. **Possible language code mismatch**: Code sends `en_US`, but your template may use `en` (English)
3. **Extra button component**: Code sends a URL button parameter, but your template appears to only have a body text with one parameter (`{{1}}`)

### Changes

**File: `supabase/functions/send-public-otp/index.ts`**

Update the WhatsApp message payload to match your actual Exotel template:

- Change template name from `"psotp1"` to `"otp"`
- Change language from `"en_US"` to `"en"` 
- Remove the URL button component (index 0) since your template only has a body parameter
- Keep the body component with the OTP code as parameter `{{1}}`

### After Deployment

Once deployed, the function will automatically be available. You can test by requesting an OTP on the auth page to verify WhatsApp delivery works.

