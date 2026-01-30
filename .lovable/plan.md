
## Automated Trial Expiration System

This plan implements an automated mechanism to transition organizations from `trial` to `expired` status when their `trial_ends_at` date passes.

---

### Overview

The solution uses a scheduled edge function triggered by a PostgreSQL cron job. Every hour, the function checks all organizations in `trial` status and updates those whose trial period has ended to `expired` status.

```text
┌─────────────────────────────────────────────────────────────┐
│                    Cron Job (Hourly)                        │
│                         pg_cron                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Edge Function: expire-trials                   │
│  - Queries organizations with trial status                  │
│  - Checks if trial_ends_at < now()                          │
│  - Updates subscription_status to 'expired'                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Organizations Table                        │
│  subscription_status: 'trial' → 'expired'                   │
└─────────────────────────────────────────────────────────────┘
```

---

### Implementation Steps

**Step 1: Create the Edge Function**

Create a new edge function `supabase/functions/expire-trials/index.ts` that:
- Uses the service role key to bypass RLS
- Queries all organizations where `subscription_status = 'trial'` and `trial_ends_at < now()`
- Updates their `subscription_status` to `'expired'`
- Logs the number of organizations expired for monitoring
- Returns a summary of the operation

**Step 2: Update Configuration**

Add the new function to `supabase/config.toml` with `verify_jwt = false` (since it will be called by the cron job using the anon key).

**Step 3: Enable Database Extensions**

Run a SQL migration to enable the required extensions:
- `pg_cron` - for scheduling
- `pg_net` - for making HTTP calls to the edge function

**Step 4: Create the Cron Job**

Set up a cron job that runs hourly to call the expire-trials edge function. The job will:
- Run every hour at minute 0 (`0 * * * *`)
- Call the edge function endpoint via HTTP POST
- Include proper authorization headers

---

### Technical Details

**Edge Function Logic:**
```
1. Initialize Supabase admin client with service role key
2. Query: SELECT id, name FROM organizations 
          WHERE subscription_status = 'trial' 
          AND trial_ends_at < now()
3. For each organization found:
   - Update subscription_status to 'expired'
   - Log the organization ID and name
4. Return count of expired organizations
```

**Cron Schedule:**
- Frequency: Every hour
- Pattern: `0 * * * *` (at minute 0 of every hour)
- This ensures trials are expired within 1 hour of their end time

**Security Considerations:**
- Edge function uses service role key for database access
- JWT verification is disabled since the function is called by the database cron
- Authorization header with anon key is included in cron HTTP request

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/expire-trials/index.ts` | Create new edge function |
| `supabase/config.toml` | Add function configuration |
| Database migration | Enable pg_cron/pg_net and create cron job |

---

### Outcome

After implementation:
- Organizations with expired trials will automatically transition to `expired` status within 1 hour
- The `SubscriptionGate` component (already implemented) will block access for expired organizations
- Users will be redirected to the upgrade-only UI at `/subscription-expired`
- Admins can monitor expired organizations in the database
