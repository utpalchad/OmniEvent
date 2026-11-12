# PactAI · Autonomous Event Negotiation

A five-step React/Vite frontend for planning an event, selecting vendors, modeling floor-safe bundle negotiations, and reviewing a live payment-allocation ledger.

## Run locally
Requires Node.js 20.19+.
```bash
npm install
npm run dev
```

## Vendor portal
Routes: `/vendor`, `/vendor/register`, `/vendor/login`, `/vendor/forgot-password`, `/vendor/onboarding`, `/vendor/dashboard`, `/vendor/shop`, `/vendor/services`, `/vendor/enquiries`, `/vendor/bookings`, `/vendor/negotiations`, `/vendor/earnings`, and `/vendor/settings`.

The portal uses Supabase Auth and Postgres only when the two browser-safe variables below are set. It deliberately does not fall back to an insecure localStorage account system.

1. Create a Supabase project and add the Render URL plus local URL to Authentication → URL Configuration.
2. In Supabase SQL Editor run `supabase/vendor_portal.sql`.
3. Create a private or public `vendor-media` Storage bucket as appropriate for the product; the SQL contains a vendor-owned object policy.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Render, then redeploy. Never expose `service_role` keys.
5. Enable email confirmations and password recovery in Supabase Auth.

The tables and RLS policies make each vendor responsible only for their own profile and services. Published shops/services can be queried by customer marketplace code from the same database; existing customer catalogue demo data remains separate and clearly demo-only until that query is connected.

## Existing customer flow
The five-stage customer experience is unchanged. Its current negotiation, payment preview, and local vendor catalogue remain client-side demos.

## Deploy
The `main` branch auto-deploys to the Render static service using `npm install --no-audit --no-fund && npm run build`; output is `dist`.