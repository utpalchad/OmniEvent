# OmniEvent

PactAI — Autonomous Multi-Vendor Event Negotiation & PayPal Escrow Protocol.

A viewport-first React SPA with six animated stages: event configuration, calendar planning, curated vendor selection, AI negotiation, an itemized payment ledger, and PayPal Sandbox checkout/refund workflows.

## Run locally

Requires Node.js 20.19+.

```bash
npm install
cp .env.example .env
npm run dev:all
```

Open http://localhost:5173. The frontend runs on port 5173 and the API runs on port 8000. To run only the frontend demo, use `npm run dev`; it falls back to the bundled curated vendor catalogue and local demo negotiation when the API is unavailable.

## Environment

Copy `.env.example` to `.env`. `VITE_API_URL` points to the API. `VITE_PAYPAL_CLIENT_ID` is the public PayPal Sandbox client ID. `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are server-only credentials and must never be exposed to the browser.

## Payment note

A standard PayPal Checkout capture pays the configured merchant. The milestone ledger in this hackathon prototype is an orchestration record, not a regulated escrow account or custodied balance. Do not represent it as legally held escrow without the relevant PayPal product approval, agreements, and compliant funds flow.

## Stack

React, Vite, Tailwind CSS, Framer Motion, Lucide, AG Grid, PayPal React SDK v6, Express.

## Build

```bash
npm run build
npm run preview
```
