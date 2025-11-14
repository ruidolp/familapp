# Subscription Module Documentation

## Overview

This document describes the subscription management module - a domain-agnostic system for managing subscription plans, user capabilities, resource limits, trials, and linked users.

## Features

- ✅ **Multiple Plan Support**: Configure unlimited plans (FREE, PREMIUM, FAMILIAR, etc.)
- ✅ **Capability Management**: Enable/disable features per plan
- ✅ **Resource Limits**: Set quantitative limits per plan
- ✅ **Automatic Trials**: 7-day free trial on sign-up (configurable)
- ✅ **User Linking**: Share subscriptions with others (couples, families)
- ✅ **Multi-currency Support**: Built-in support for 14+ currencies
- ✅ **Multi-platform Payments**: Web (Stripe), iOS (Apple), Android (Google)
- ✅ **Sandbox Mode**: Test flows without real payments
- ✅ **Session Integration**: Subscription data cached in NextAuth session

## Database Schema

The module uses 8 tables:

1. **subscription_plans**: Available plans (FREE, PREMIUM, FAMILIAR)
2. **plan_capabilities**: Features enabled/disabled per plan
3. **plan_limits**: Resource quantity limits per plan
4. **user_subscriptions**: User's active subscription
5. **linked_users**: User linking relationships
6. **invitation_codes**: Invitation codes for linking
7. **subscription_history**: Audit log of all changes
8. **payment_products**: Pricing by plan/platform/currency

## Installation & Setup

### 1. Install Dependencies

Already installed:
```bash
npm install kysely pg @dinero.js/currencies
npm install -D @types/pg kysely-codegen
```

### 2. Run Database Migrations

Execute the SQL migrations in order:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d your_database

# Run migrations
\i src/infrastructure/database/migrations/001_create_subscriptions_tables.sql
\i src/infrastructure/database/migrations/002_seed_subscriptions_data.sql
```

### 3. Configure Environment Variables

Copy the subscription variables from `.env.example` to your `.env`:

```bash
# Subscription Config
TRIAL_DAYS="7"
GRACE_PERIOD_DAYS="3"
INVITATION_EXPIRY_DAYS="30"
DEFAULT_CURRENCY="USD"
PAYMENT_MODE="sandbox"  # sandbox | production
AUTO_TRIAL_ENABLED="true"

# Payment Providers (Production)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
APPLE_SHARED_SECRET=""
GOOGLE_SERVICE_ACCOUNT_KEY=""

# WhatsApp Sharing (Optional)
WHATSAPP_SHARE_NUMBER=""
```

### 4. Verify TypeScript Compilation

```bash
npx tsc --noEmit
```

## Usage

### Server Components & API Routes

```typescript
import { auth } from '@/infrastructure/lib/auth'
import { getUserActivePlan, hasCapability, canCreateResource } from '@/application/services/subscriptions'

// Get user's active plan
const session = await auth()
const plan = await getUserActivePlan(session.user.id)

// Check if user has a capability
const canExport = await hasCapability(session.user.id, 'export_data')

// Check if user can create a resource
const { allowed, limit, current } = await canCreateResource(
  session.user.id,
  'projects',
  currentProjectCount
)
```

### Using Session Data (Fastest - No DB Query)

```typescript
import { auth } from '@/infrastructure/lib/auth'

const session = await auth()

// Access plan data from session (cached)
const planSlug = session.user.subscription.planSlug // 'free' | 'premium' | 'familiar'
const capabilities = session.user.subscription.capabilities // ['export_data', 'advanced_reports']
const limits = session.user.subscription.limits // { projects: 10, storage_mb: 5000 }

// Check capability without DB query
if (session.user.subscription.capabilities.includes('export_data')) {
  // Allow export
}

// Check limit without DB query
const projectLimit = session.user.subscription.limits.projects
if (currentProjects < projectLimit) {
  // Allow creation
}
```

**Note**: Session data is cached for the session duration (~30 min). For real-time checks after plan changes, use the service functions above.

## API Endpoints

### Subscription Management

```bash
# Get subscription status
GET /api/subscriptions/status

# Upgrade plan
POST /api/subscriptions/upgrade
Body: { planSlug: "premium", period: "monthly", platform: "web" }

# Cancel subscription
POST /api/subscriptions/cancel
```

### Invitation & Linking

```bash
# Generate invitation code
POST /api/subscriptions/invitations
Body: { maxUses: 1, expiresInDays: 30 }

# Accept invitation
POST /api/subscriptions/invitations/accept
Body: { code: "ABC123XYZ" }

# Get linked users
GET /api/subscriptions/linked-users

# Unlink user
DELETE /api/subscriptions/linked-users/:userId
```

### Sandbox Payments (Testing)

```bash
# Initiate checkout (returns sandbox URL)
POST /api/subscriptions/upgrade
→ Returns: { checkoutUrl: "/api/payments/sandbox/checkout?..." }

# User visits checkout URL and clicks "Simulate Payment Success"
# This triggers webhook:
POST /api/webhooks/sandbox
Body: { eventType: "payment.succeeded", userId, planSlug, period }
```

## Configuration

### Adding a New Plan

1. Insert plan into database:
```sql
INSERT INTO subscription_plans (slug, name, description, trial_days, max_linked_users, active)
VALUES ('enterprise', 'Enterprise', 'For large teams', 7, 10, true);
```

2. Add capabilities:
```sql
INSERT INTO plan_capabilities (plan_id, capability_key, enabled)
SELECT id, 'bulk_operations', true
FROM subscription_plans WHERE slug = 'enterprise';
```

3. Add limits:
```sql
INSERT INTO plan_limits (plan_id, resource_key, max_quantity)
SELECT id, 'projects', NULL  -- NULL = unlimited
FROM subscription_plans WHERE slug = 'enterprise';
```

4. Add pricing:
```sql
INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id)
SELECT id, 'web', 'monthly', 'USD', 19.99, 'enterprise_monthly_usd'
FROM subscription_plans WHERE slug = 'enterprise';
```

### Adding a New Capability

Simply insert into `plan_capabilities` for each plan that should have it:

```sql
INSERT INTO plan_capabilities (plan_id, capability_key, enabled)
SELECT id, 'new_feature_name', true
FROM subscription_plans WHERE slug IN ('premium', 'familiar');
```

Then in your code:
```typescript
const canUseFeature = await hasCapability(userId, 'new_feature_name')
```

### Adding a New Resource Limit

Insert into `plan_limits`:

```sql
INSERT INTO plan_limits (plan_id, resource_key, max_quantity)
VALUES
  ((SELECT id FROM subscription_plans WHERE slug = 'free'), 'new_resource', 5),
  ((SELECT id FROM subscription_plans WHERE slug = 'premium'), 'new_resource', 50),
  ((SELECT id FROM subscription_plans WHERE slug = 'familiar'), 'new_resource', NULL); -- unlimited
```

Then in your code:
```typescript
const count = await getCurrentCount(userId, 'new_resource') // Your function
const check = await canCreateResource(userId, 'new_resource', count)

if (!check.allowed) {
  return res.status(403).json({ error: `Limit reached (${check.limit} max)` })
}
```

### Changing Trial Duration

Update the plan:
```sql
UPDATE subscription_plans
SET trial_days = 14
WHERE slug = 'premium';
```

Or via environment variable:
```bash
TRIAL_DAYS="14"
```

### Changing Prices

Update existing product:
```sql
UPDATE payment_products
SET price = 5.99
WHERE plan_id = (SELECT id FROM subscription_plans WHERE slug = 'premium')
  AND period = 'monthly'
  AND currency = 'USD';
```

Or add new currency:
```sql
INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id)
SELECT id, 'web', 'monthly', 'EUR', 4.49, 'premium_monthly_eur'
FROM subscription_plans WHERE slug = 'premium';
```

## Testing Flows

### Test Flow 1: New User Sign-up with Trial

1. Register new user
2. Verify trial started automatically:
```bash
GET /api/subscriptions/status
→ { plan: { planSlug: "premium", status: "trial", trialEndsAt: "..." } }
```
3. Wait 7 days (or manually update DB)
4. Verify downgrade to FREE

### Test Flow 2: Upgrade to Paid Plan

1. As FREE user, call:
```bash
POST /api/subscriptions/upgrade
Body: { planSlug: "premium", period: "monthly" }
→ Returns: { checkoutUrl: "/api/payments/sandbox/checkout?..." }
```
2. Visit checkout URL
3. Click "Simulate Payment Success"
4. Verify upgrade:
```bash
GET /api/subscriptions/status
→ { plan: { planSlug: "premium", status: "active" } }
```

### Test Flow 3: Invite & Link Users

1. As PREMIUM user, generate invitation:
```bash
POST /api/subscriptions/invitations
→ { invitation: { code: "ABC123XYZ" }, invitationUrl, whatsappUrl }
```
2. Share code with another user
3. Other user accepts:
```bash
POST /api/subscriptions/invitations/accept
Body: { code: "ABC123XYZ" }
```
4. Verify linked user has PREMIUM access:
```bash
GET /api/subscriptions/status
→ { plan: { planSlug: "premium", isLinked: true, ownerId: "..." } }
```

## Architecture

### Clean Architecture Layers

```
src/
├── domain/                           # (Not needed - agnostic module)
├── application/
│   └── services/subscriptions/
│       └── subscription.service.ts   # Business logic
├── infrastructure/
│   ├── database/
│   │   ├── queries/
│   │   │   ├── subscription-plan.queries.ts
│   │   │   ├── subscription.queries.ts
│   │   │   ├── invitation.queries.ts
│   │   │   └── subscription-history.queries.ts
│   │   ├── types.ts                 # Database types
│   │   └── migrations/              # SQL scripts
│   ├── config/
│   │   ├── currencies.ts            # Multi-currency support
│   │   └── subscription.config.ts   # Module config
│   └── lib/
│       └── auth.ts                  # Extended with subscription
└── app/api/
    ├── subscriptions/               # API routes
    ├── payments/sandbox/            # Sandbox checkout
    └── webhooks/sandbox/            # Sandbox webhook
```

### Key Services

**subscription.service.ts** exports:
- `getUserActivePlan(userId)` - Get effective plan
- `hasCapability(userId, capability)` - Check capability
- `canCreateResource(userId, resource, current)` - Check limit
- `startTrial(userId, planSlug)` - Start trial
- `upgradePlan(...)` - Upgrade to paid
- `cancelSubscription(userId)` - Cancel subscription
- `generateInvitation(ownerId)` - Create invitation
- `acceptInvitation(userId, code)` - Accept invitation
- `getUserLinkedUsers(ownerId)` - Get linked users
- `unlinkUserFromPlan(ownerId, linkedId)` - Unlink user

## Troubleshooting

### TypeScript Errors on session.user.subscription

The module extends NextAuth types. If you see errors, ensure:
1. `src/types/next-auth.d.ts` exists
2. Run `npx tsc --noEmit` to verify
3. Restart TypeScript server in your IDE

### Subscription Not Updating in Session

Session data is cached. To force refresh:
1. Sign out and sign in again, OR
2. Use service functions directly (they query DB)

### Sandbox Checkout Not Working

Verify:
1. `PAYMENT_MODE="sandbox"` in `.env`
2. User is authenticated
3. Plan exists in database

### Invitation Code Invalid

Check:
1. Code hasn't expired (`expires_at`)
2. Code hasn't reached `max_uses`
3. User isn't already linked to another plan

## Production Readiness

### Before Going to Production

- [ ] Set `PAYMENT_MODE="production"`
- [ ] Configure Stripe/Apple/Google API keys
- [ ] Set up webhook endpoints for real providers
- [ ] Implement webhook signature verification
- [ ] Set up cron jobs for trial expiration
- [ ] Add monitoring for failed payments
- [ ] Test currency conversions
- [ ] Implement email notifications

### Security Checklist

- [ ] Webhook endpoints validate signatures
- [ ] API routes check authentication
- [ ] Only owners can unlink users
- [ ] Circular linking is prevented
- [ ] Platform subscription IDs are unique

## Support

For questions or issues related to this module:
1. Check this documentation
2. Review `src/application/services/subscriptions/subscription.service.ts`
3. Check audit log: `SELECT * FROM subscription_history WHERE user_id = '...'`
4. Enable debug logging: `debug: true` in auth config

## License

Part of the WApp project.
