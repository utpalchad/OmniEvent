# PactAI · AI-Assisted Event Negotiation

A five-step React/Vite event-planning marketplace. Supabase handles authentication, PostgreSQL, Row Level Security and storage. The AI negotiator creates customer opening proposals; vendors must review and respond before a price is agreed.

## Run locally
Requires Node.js 20.19+.

```bash
npm install
npm run dev
```

## Render frontend
The `main` branch auto-deploys to the Render Static Site.

- Build: `npm install --no-audit --no-fund && npm run build`
- Publish directory: `dist`

Set these browser-safe values in Render → Environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the Supabase publishable key can be used here)

Never put an OpenAI key, Supabase secret key or service-role key in Vite variables or browser code.

## Supabase database setup
Apply migrations in this order, only if they have not already been applied:

1. `supabase/vendor_portal.sql`
2. `supabase/003_rls_storage_setup.sql`
3. `supabase/004_customer_event_enquiries.sql`
4. `supabase/005_ai_negotiator.sql`

Storage buckets: `vendor-assets` and `service-images` are public-read with owner-only writes; `vendor-private` is private.

## Deploy the AI negotiator
The Edge Function source is `supabase/functions/negotiate-bundle/index.ts`.

1. In Supabase Dashboard → Edge Functions, create a function named `negotiate-bundle`.
2. Paste the contents of that TypeScript file into the Dashboard editor and deploy it. Keep JWT verification enabled; it requires a signed-in customer.
3. Open Edge Functions → Secrets and add `OPENAI_API_KEY` with your OpenAI API key.
4. Optional: add `OPENAI_MODEL` with `gpt-5.4-mini`. The function uses this model by default.
5. Never put the OpenAI key or Supabase secret key in the frontend or GitHub.

The function authenticates the customer, checks selected services are published and approved, reads vendor minimum prices server-side, limits each customer to six requests per five minutes, and asks OpenAI for a structured proposal. Vendor minimum prices are never returned to the browser.

## Vendor price controls
When adding a service, the vendor enters a listed price and a private minimum acceptable price. AI proposals cannot fall below the minimum or exceed the listed price. Existing services default to their listed price as the minimum until the vendor sets a lower minimum.

## Negotiation and payment boundaries
The AI creates a customer opening proposal only. It does not contact vendors by itself, accept terms on a vendor's behalf, guarantee availability, or process payments. The customer reviews the draft and sends an enquiry; the vendor must respond before a quote can be treated as agreed. The payment ledger is a planning preview and does not collect funds.

## Portals
Vendor routes include `/vendor/register`, `/vendor/login`, `/vendor/dashboard`, `/vendor/shop`, `/vendor/services` and `/vendor/enquiries`. Customer routes include `/customer/register` and `/customer/login`.
