

## Fix: Wrong WhatsApp Template Name

### Problem
The edge function sends the template name `"psotp1"` (line 46 of `send-public-otp/index.ts`), but your Exotel/Meta dashboard shows the approved Authentication template is named **"otp"**. Exotel accepts the request (returns 202) but silently fails delivery because the template name doesn't exist.

### Solution
A single-line change in `supabase/functions/send-public-otp/index.ts`:

- **Line 46**: Change `name: "psotp1"` to `name: "otp"`

### Technical Details

The template "otp" in your Exotel dashboard:
- Category: Authentication
- Language: English
- Status: Active - quality pending
- Body: `"{{1}} is your verification code. For your security..."`

The `components` array structure (body param + URL button param) and `language.code: "en_US"` will remain unchanged since these match the Authentication template format.

### After the fix
- Redeploy the `send-public-otp` edge function (automatic)
- Test OTP delivery end-to-end on the `/auth` page

