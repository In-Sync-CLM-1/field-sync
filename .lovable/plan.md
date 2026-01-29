

# Fully Automated Field Force Automation Platform

## Overview

Transform the InSync Field Force application into a fully automated self-service SaaS platform where:
- Users can sign up, create their own organization, and start using the app immediately
- 14-day free trial activates automatically
- Razorpay handles subscription payments with automatic renewal
- Subscription expiry blocks access completely until payment is made
- Platform admins (In-Sync team) have a dedicated console to manage all clients

## Current State Analysis

### What Exists
- Self-registration with organization creation/selection
- Organization-based multi-tenancy with `organization_id` filtering
- Feature flags system (`services_enabled`, `subscription_active`, `usage_limits`)
- Role-based access control with `platform_admin` role
- Edge functions for secure user management
- Trial pricing displayed on landing page (14-day, ₹99/user/month)

### What's Missing
- Trial period tracking (no `trial_ends_at` field)
- Payment gateway integration (Razorpay)
- Subscription management tables and logic
- Automatic subscription blocking
- Welcome/onboarding flow for new organizations
- Platform Admin Console for managing all clients
- Billing history and invoice generation

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           IN-SYNC MASTER CONTROLLER                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  Organization A │    │  Organization B │    │  Organization C │   ...    │
│  │  (Client 1)     │    │  (Client 2)     │    │  (Client 3)     │          │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘          │
│           │                      │                      │                    │
│           └──────────────────────┼──────────────────────┘                    │
│                                  ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                    SHARED PLATFORM SERVICES                        │      │
│  ├───────────────────────────────────────────────────────────────────┤      │
│  │  - Master Database & Schema                                        │      │
│  │  - User Authentication & Authorization                             │      │
│  │  - Subscription & Billing (Razorpay)                              │      │
│  │  - Feature Enablement per Organization                             │      │
│  │  - Data Backup & Recovery                                          │      │
│  │  - Security & Compliance                                           │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                    PLATFORM ADMIN CONSOLE                          │      │
│  │  (/platform-admin/*) - Accessible only to platform_admin role     │      │
│  ├───────────────────────────────────────────────────────────────────┤      │
│  │  - Dashboard: All organizations, subscriptions, revenue            │      │
│  │  - Organizations: View/Edit/Activate/Deactivate                    │      │
│  │  - Subscriptions: Manage plans, trials, payments                   │      │
│  │  - Feature Flags: Enable/disable features per organization         │      │
│  │  - Billing: View all transactions, generate invoices               │      │
│  │  - Users: View all users across organizations                      │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Database Schema Updates

**New Tables**

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Define available plans (Free Trial, Basic, etc.) |
| `organization_subscriptions` | Track subscription status per organization |
| `payment_transactions` | Store Razorpay payment records |
| `invoices` | Generated invoices for billing |

**Modifications to `organizations` table**

| Column | Type | Purpose |
|--------|------|---------|
| `trial_ends_at` | timestamp | When the 14-day trial expires |
| `subscription_status` | enum | 'trial', 'active', 'expired', 'cancelled' |
| `razorpay_customer_id` | text | Link to Razorpay customer |
| `billing_email` | text | Email for billing notifications |
| `billing_address` | jsonb | GST, address details |

**Schema SQL (Key Parts)**

```sql
-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');

-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_per_user NUMERIC(10,2) NOT NULL, -- ₹99
  billing_cycle TEXT DEFAULT 'monthly',
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add to organizations
ALTER TABLE organizations ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN subscription_status subscription_status DEFAULT 'trial';
ALTER TABLE organizations ADD COLUMN razorpay_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN razorpay_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN billing_email TEXT;
ALTER TABLE organizations ADD COLUMN billing_address JSONB;
ALTER TABLE organizations ADD COLUMN user_count INTEGER DEFAULT 0;

-- Payment transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  razorpay_payment_id TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  payment_method TEXT,
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  billing_period_start DATE,
  billing_period_end DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 2: Self-Service Registration Flow

**Enhanced Registration Process**

1. User fills registration form (Name, Email, Company Name, Phone)
2. Organization created with `trial_ends_at = now() + 14 days`
3. User gets `admin` role automatically
4. Welcome email sent with getting started guide
5. User redirected to onboarding wizard

**Files to Modify**
- `src/pages/Auth.tsx` - Update registration to set trial period
- Create `src/pages/Onboarding.tsx` - Step-by-step setup wizard

**Onboarding Steps**
1. Company profile setup (Logo, Industry, Address)
2. First user invitation
3. First lead/prospect creation
4. First visit logging
5. Dashboard tour

### Phase 3: Subscription Management

**Razorpay Integration Architecture**

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Edge Functions  │     │    Razorpay     │
│   (React)       │────▶│   (Supabase)      │────▶│    API          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        ▼
        │               ┌──────────────────┐
        └──────────────▶│    Database      │
                        │    (Supabase)    │
                        └──────────────────┘
```

**Edge Functions to Create**

| Function | Purpose |
|----------|---------|
| `create-razorpay-subscription` | Create subscription when trial ends |
| `razorpay-webhook` | Handle payment events from Razorpay |
| `check-subscription-status` | Verify if org can access app |
| `generate-invoice` | Create invoice PDFs |
| `send-billing-reminder` | Send payment due emails |

**Subscription Flow**

1. Trial Period (14 days):
   - Full access to all features
   - Banner showing "X days left in trial"
   - Prompt to add payment method

2. Trial Expiring (3 days before):
   - Email reminder to add payment
   - In-app notification

3. Trial Expired:
   - Redirect to subscription page
   - Must add Razorpay payment to continue
   - Show subscription options

4. Active Subscription:
   - Full access
   - Monthly auto-billing via Razorpay
   - Invoice generated automatically

5. Payment Failed:
   - Immediate block on access
   - Email notification to billing admin
   - Redirect to payment update page

### Phase 4: Access Control & Blocking

**Subscription Guard Component**

Create `src/components/SubscriptionGuard.tsx` to wrap protected routes:

```typescript
// Checks subscription status before allowing access
// If expired: Redirect to /subscription/expired
// If trial ending: Show warning banner
// If active: Render children normally
```

**Blocked State UI**

Create `src/pages/SubscriptionExpired.tsx`:
- Clear message about expired subscription
- Current user count and amount due
- Razorpay payment button
- Contact support option

### Phase 5: Platform Admin Console

**New Routes**

| Route | Component | Purpose |
|-------|-----------|---------|
| `/platform-admin` | PlatformDashboard | Overview of all orgs, revenue, metrics |
| `/platform-admin/organizations` | PlatformOrganizations | List/manage all organizations |
| `/platform-admin/organizations/:id` | PlatformOrgDetail | Single org details, edit, features |
| `/platform-admin/subscriptions` | PlatformSubscriptions | All subscriptions, status, issues |
| `/platform-admin/billing` | PlatformBilling | Revenue, transactions, invoices |
| `/platform-admin/users` | PlatformUsers | All users across all orgs |
| `/platform-admin/settings` | PlatformSettings | System-wide settings, plans |

**Platform Dashboard Features**

- Total organizations (active, trial, churned)
- Monthly recurring revenue (MRR)
- New signups this week/month
- Organizations with expiring trials
- Failed payments needing attention
- User growth chart

**Organization Management**

- View all organization details
- Enable/disable features per org
- Extend trials manually
- Suspend/reactivate accounts
- View all users in organization
- Access organization data for support

### Phase 6: Automated Processes

**Cron Jobs (Edge Functions with pg_cron)**

| Job | Schedule | Action |
|-----|----------|--------|
| `check-trial-expiry` | Daily at 9 AM | Email orgs with 3 days left |
| `expire-trials` | Daily at midnight | Set expired status for overdue |
| `process-renewals` | Daily at midnight | Trigger Razorpay renewals |
| `send-payment-reminders` | Daily at 10 AM | Email failed payment orgs |
| `generate-monthly-invoices` | 1st of month | Create invoices for all |

**Automated Email Triggers**

| Trigger | Email |
|---------|-------|
| New signup | Welcome + getting started guide |
| Trial 3 days left | Trial expiring reminder |
| Trial expired | Subscription required notice |
| Payment successful | Receipt + invoice |
| Payment failed | Update payment method |
| Feature enabled | Feature announcement |

### Phase 7: File Structure

**New Files to Create**

```text
src/
├── pages/
│   ├── Onboarding.tsx                    # First-time setup wizard
│   ├── SubscriptionExpired.tsx           # Blocked access page
│   ├── Subscription.tsx                  # Payment/plan management
│   └── platform-admin/
│       ├── PlatformDashboard.tsx         # Admin overview
│       ├── PlatformOrganizations.tsx     # Org management
│       ├── PlatformOrgDetail.tsx         # Single org view
│       ├── PlatformSubscriptions.tsx     # Subscription management
│       ├── PlatformBilling.tsx           # Revenue/invoices
│       ├── PlatformUsers.tsx             # All users
│       └── PlatformSettings.tsx          # System settings
├── components/
│   ├── SubscriptionGuard.tsx             # Route protection
│   ├── TrialBanner.tsx                   # Trial warning banner
│   ├── PaymentModal.tsx                  # Razorpay payment
│   └── OnboardingWizard.tsx              # Setup steps
├── hooks/
│   ├── useSubscription.ts                # Subscription status
│   └── usePlatformAdmin.ts               # Admin data access
└── services/
    └── razorpay.ts                       # Razorpay integration

supabase/functions/
├── create-razorpay-subscription/         # Create subscription
├── razorpay-webhook/                     # Handle webhooks
├── check-subscription-status/            # Verify access
├── generate-invoice/                     # Create invoices
├── send-billing-reminder/                # Email reminders
├── expire-trials/                        # Scheduled trial expiry
└── process-renewals/                     # Scheduled renewals
```

## Implementation Order

| Phase | Description | Estimated Work |
|-------|-------------|----------------|
| 1 | Database schema updates | 1 session |
| 2 | Registration + Trial setup | 1 session |
| 3 | Razorpay integration + Edge functions | 2-3 sessions |
| 4 | Subscription blocking + UI | 1 session |
| 5 | Platform Admin Console (all pages) | 3-4 sessions |
| 6 | Automated jobs + Emails | 2 sessions |
| 7 | Testing + Polish | 1-2 sessions |

## Prerequisites

Before starting implementation:

1. **Razorpay Account Setup**
   - Create Razorpay account at razorpay.com
   - Get API Key ID and Secret from Dashboard
   - Set up webhook endpoint URL
   - Add these as secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

2. **Email Service (Resend)**
   - Already mentioned in memory - set up for billing emails
   - Add `RESEND_API_KEY` secret

## Security Considerations

- All payment operations through server-side edge functions only
- Webhook signature verification for Razorpay callbacks
- Platform admin routes protected by role check
- Organization data isolation via RLS policies
- Subscription status verified server-side, not client-side

## Summary

This automation plan transforms InSync into a fully self-service SaaS platform with:

- Zero-touch user registration and onboarding
- Automatic 14-day trial with expiry tracking
- Razorpay payment integration with automatic billing
- Complete access blocking for expired subscriptions
- Dedicated platform admin console for client management
- Automated billing, invoicing, and reminder emails

