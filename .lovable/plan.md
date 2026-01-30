

## Razorpay Checkout Integration Plan

This plan implements a complete Razorpay subscription checkout flow, enabling users to upgrade from trial to paid subscriptions directly from the UpgradeDialog and SubscriptionExpired page.

---

### Overview

The integration follows Razorpay's subscription flow:
1. Create a Razorpay Plan (one-time setup, representing the ₹99/user/month pricing)
2. Create a Customer when they initiate checkout
3. Create a Subscription for the customer with quantity based on user count
4. Open Razorpay Checkout with the subscription ID
5. Handle payment success/failure via webhooks (already implemented)

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         User Clicks "Upgrade Now"                    │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Edge Function: create-razorpay-subscription             │
│  1. Create Razorpay Customer (if not exists)                         │
│  2. Create Subscription with plan_id + quantity                      │
│  3. Return subscription_id to frontend                               │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Frontend: Open Razorpay Checkout                  │
│  - Pass subscription_id from step above                              │
│  - User completes payment                                            │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌─────────────────┐             ┌─────────────────┐
          │  Payment Success │             │  Payment Failed  │
          └─────────────────┘             └─────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│              razorpay-webhook (already exists)                       │
│  - subscription.activated -> update org status to 'active'          │
│  - payment.failed -> update org status to 'past_due'                │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Steps

**Step 1: Create Razorpay Plan (One-time Database Setup)**

Run a SQL migration to store the Razorpay plan_id in the subscription_plans table. This requires:
- Adding a `razorpay_plan_id` column to the `subscription_plans` table
- The actual Razorpay plan must be created manually in Razorpay Dashboard (or via API during first use)

**Step 2: Create Edge Function for Subscription Creation**

Create `supabase/functions/create-razorpay-subscription/index.ts` that:
- Accepts organization_id and user email as input
- Creates or retrieves a Razorpay customer
- Creates a Razorpay subscription with:
  - `plan_id`: The Razorpay plan ID (stored in subscription_plans table)
  - `quantity`: Number of active users in the organization
  - `notes.organization_id`: Links back to our organization
  - `customer_notify`: Set to true for email notifications
- Updates organization with `razorpay_customer_id`
- Returns the `subscription_id` for checkout

**Step 3: Add Razorpay Checkout Script**

Update `index.html` to load the Razorpay checkout script:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**Step 4: Create useRazorpayCheckout Hook**

Create `src/hooks/useRazorpayCheckout.ts` that:
- Exposes an `initiateCheckout` function
- Calls the edge function to create the subscription
- Opens Razorpay checkout modal with the subscription_id
- Handles success callback (show toast, refresh page)
- Handles failure callback (show error message)

**Step 5: Update UpgradeDialog Component**

Modify `src/components/UpgradeDialog.tsx` to:
- Import and use the `useRazorpayCheckout` hook
- Replace the TODO placeholder with actual checkout logic
- Pass organization ID and user email to the checkout function

**Step 6: Update SubscriptionExpired Page**

Modify `src/pages/SubscriptionExpired.tsx` to:
- Import and use the `useRazorpayCheckout` hook
- Replace the TODO placeholder with actual checkout logic
- Handle successful payment by redirecting to dashboard

**Step 7: Update Edge Function Configuration**

Add the new function to `supabase/config.toml` with appropriate JWT settings.

---

### Technical Details

**Edge Function: create-razorpay-subscription**

```text
Input:
  - organization_id: UUID
  - email: string (user's email for Razorpay customer)
  - name: string (organization name)

Process:
  1. Fetch organization and subscription plan from database
  2. Check if razorpay_customer_id exists on organization
     - If not, create customer via Razorpay API
     - Store razorpay_customer_id in organization
  3. Create subscription via Razorpay API:
     - plan_id: from subscription_plans.razorpay_plan_id
     - quantity: organization.user_count (minimum 1)
     - customer_id: razorpay_customer_id
     - notes: { organization_id }
  4. Return subscription_id

Output:
  - subscription_id: string (for checkout)
  - key_id: string (Razorpay public key)
```

**Razorpay Checkout Options:**

```text
{
  key: RAZORPAY_KEY_ID (public key),
  subscription_id: from edge function response,
  name: "InSync",
  description: "Pro Plan - Monthly Subscription",
  prefill: {
    name: organization.name,
    email: user.email
  },
  notes: {
    organization_id: organization.id
  },
  theme: {
    color: "#0891b2" (primary brand color)
  },
  handler: function(response) {
    // Payment successful - webhook handles the rest
  }
}
```

**Security Considerations:**
- Edge function uses service role key for database updates
- Razorpay API calls use RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (already configured)
- Webhook signature verification (already implemented)
- Frontend only receives subscription_id, never sees secret keys

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/create-razorpay-subscription/index.ts` | Create new edge function |
| `src/hooks/useRazorpayCheckout.ts` | Create checkout hook |
| `src/components/UpgradeDialog.tsx` | Update to use checkout hook |
| `src/pages/SubscriptionExpired.tsx` | Update to use checkout hook |
| `index.html` | Add Razorpay script tag |
| `supabase/config.toml` | Add function configuration |
| Database migration | Add razorpay_plan_id column to subscription_plans |

---

### Required Razorpay Setup

Before the integration works, a Razorpay Plan needs to be created in the Razorpay Dashboard:

1. Go to Razorpay Dashboard > Products > Subscriptions > Plans
2. Create a new plan:
   - Name: "InSync Pro Plan"
   - Period: Monthly
   - Amount: ₹99 (per unit)
   - Description: "Full access to InSync Field Force Automation"
3. Copy the `plan_id` (e.g., `plan_XXXXXXXXXXXXX`)
4. Update the `subscription_plans` table with this `razorpay_plan_id`

---

### Outcome

After implementation:
- Users can click "Upgrade Now" from either the UpgradeDialog or SubscriptionExpired page
- Razorpay checkout opens with subscription details and calculated pricing
- On successful payment:
  - Razorpay webhook updates organization status to 'active'
  - User is redirected to dashboard
  - Invoice is automatically generated
- On failed payment:
  - Error message is displayed
  - User can retry

