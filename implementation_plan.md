# Marketplace Subscription Flow Redesign

This plan outlines the architecture for making the Xentra People Marketplace App Details page the primary, database-driven subscription entry point.

## Open Questions
- To securely fetch plans from `marketplace.app_plans` via the frontend/Next.js server without exposing the schema, we must create a new secure RPC (e.g., `get_app_plans`). Since I cannot execute SQL against your database directly, I will provide the SQL script for this RPC. Is this acceptable?
- In `/api/stripe/checkout/route.ts`, if the UI passes the `marketplace.app_plans.id` (UUID), it currently tries to query the legacy V5 `public.plans` table. Should I modify `route.ts` to securely check `marketplace.app_plans` (via RPC) for the `plan_code` mapping, or should the frontend simply pass the `plan_code` (e.g. `'starter'`) which `route.ts` already knows how to resolve via `STRIPE_PRODUCT_MAP`?

## Proposed Changes

---

### SQL RPCs

#### [NEW] `scratch/get_app_plans_rpc.sql`
A secure `SECURITY DEFINER` RPC to allow the Next.js server to fetch active plans from the restricted `marketplace.app_plans` schema.

---

### Data Fetching

#### [MODIFY] `src/lib/marketplace-data.ts`
- Update `getPublishedMarketplaceAppBySlug` and `getPublishedMarketplaceApps` to use the new `get_app_plans` RPC instead of the blocked `.schema('marketplace').from('app_plans')` call.
- This will properly populate the `MarketplaceApp.pricingPlans` array which is currently failing silently.

---

### UI Components

#### [MODIFY] `src/components/marketplace/AppDetailsView.tsx`
- Replace the hardcoded `isAvailable ? "Subscribe" : "Pre-Subscribe"` button in the header.
- Use `subscriptions.get_company_subscriptions()` to make the button subscription-aware.
- If an active subscription exists for `xentra-people`, display **"Launch Xentra"**.
- If no active subscription exists, display **"Subscribe"** and trigger the checkout flow using the actual `pricingPlans` fetched from the database.

#### [MODIFY] `src/components/marketplace/AppPlansSection.tsx`
- Refactor to accept the `app.pricingPlans` dynamically from the database.
- Remove hardcoded Basic/Starter plan details.
- Render the `Xentra Plus` plan dynamically using the `name`, `price`, and `billing_interval` from `marketplace.app_plans`.
- Wire the "Select Plan" button to invoke the checkout API with the correct plan identifiers.

---

### API Integration

#### [MODIFY] `src/app/api/stripe/checkout/route.ts`
- Implement the "minimum required API integration" to securely accept the `marketplace.app_plans` UUID.
- Map the provided UUID to the corresponding `plan_code` securely (using an RPC if necessary, or by accepting `plan_code` directly from the client if preferred).

## Verification Plan
### Manual Verification
1. I will provide the SQL RPC script for you to execute in the Supabase SQL Editor.
2. I will apply the React/Next.js changes.
3. You will verify the UI renders the correct database-driven price/name in the Marketplace.
4. You will click "Subscribe" and confirm it successfully routes to Stripe Checkout with the correct `planId`.
5. You will verify that a subscribed user sees "Launch Xentra" instead of "Subscribe".
