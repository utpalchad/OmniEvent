# PactAI · Autonomous Event Negotiation

A five-step React/Vite frontend for planning an event, selecting vendors, modeling floor-safe bundle negotiations, and reviewing a live payment-allocation ledger.

## Run locally

Requires Node.js 20.19+.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Production build

```bash
npm run build
npm run preview
```

## Five-step experience

1. **The occasion** — photo-led occasion cards, service selection, event brief and budget.
2. **Dates & milestones** — date planning and a Bryntum-friendly milestone timeline shape.
3. **Vendor circle** — curated local demo vendor catalogue with image fallbacks.
4. **Negotiation** — enter a target bundle amount (for example `19000`) or discount (for example `20%`). The client-side offer model proportionally allocates discounts and never drops a vendor below its modeled floor price.
5. **Payment ledger** — AG Grid rows for every selected vendor, 30% / 40% / 30% allocations, dynamic cancel-service controls, and a PayPal Sandbox-style checkout preview.

## Demo and payment boundaries

This repository is intentionally frontend-only. Vendor search, negotiation, cancellation, ledger recalculation and checkout-preview confirmation are simulated locally in the browser. The PayPal preview does **not** create a PayPal order, charge a card, capture funds, or issue an actual refund.

A production PayPal Sandbox integration requires a configured PayPal client ID plus secure order creation/capture endpoints. Do not put a PayPal client secret in frontend code or a `VITE_*` variable. The milestone ledger is an orchestration record, **not** a regulated escrow account or custodied balance.

## Deploy

The `main` branch is connected to the Render Static Site service. Each commit triggers a new build using:

```bash
npm install --no-audit --no-fund && npm run build
```

Published directory: `dist`.

## Stack

React · Vite · Tailwind CSS v4 · Lucide · AG Grid Community · date-fns

## Project structure

- `src/App.jsx` — five-step wizard, local negotiation engine, live refund controls and PayPal preview modal
- `src/components/CalendarPlanner.jsx` — event/setup/milestone calendar
- `src/components/BudgetGrid.jsx` — AG Grid vendor ledger and payment allocations
- `src/data/catalog.js` — occasion photo data, event types, service metadata and local vendor catalogue
- `src/index.css` — warm cream / forest-green visual system and responsive layout
- `src/main.jsx` — React entry point
- `vite.config.js` — Vite, React and Tailwind configuration
