# OmniEvent · PactAI

**PactAI — Autonomous Multi-Vendor Event Negotiation & PayPal Escrow Protocol**

A six-stage, viewport-first React experience for planning an event, choosing a curated vendor circle, watching bundle negotiation, reviewing milestone allocations, and exploring a PayPal Sandbox checkout/refund flow.

## Run locally

Requires Node.js 20.19+ (Node 22 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:5173.

The frontend works immediately in demo mode. It uses a bundled vendor catalogue and a local, deterministic negotiation fallback when the optional API is unavailable.

## Production build

```bash
npm run build
npm run preview
```

## Publish with GitHub Pages

A GitHub Actions workflow at `.github/workflows/deploy-pages.yml` builds and publishes the static frontend whenever `main` is updated.

One-time repository setting:
1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` or run **Actions → Deploy PactAI to GitHub Pages → Run workflow**.

The public static demo URL will be:

https://utpalchad.github.io/OmniEvent/

The demo does not need secrets. To connect a hosted API, add `VITE_API_URL` and `VITE_PAYPAL_CLIENT_ID` as GitHub Actions repository variables. The API must implement the routes used in `src/App.jsx`:

- `POST /api/plan-event`
- `POST /api/negotiate`
- `POST /api/create-paypal-order`
- `POST /api/capture-paypal-order`
- `POST /api/cancel-and-refund`

The public PayPal client ID can be a build variable; keep `PAYPAL_CLIENT_SECRET` on the backend only. Never put a PayPal secret in a `VITE_*` variable or commit it to Git.

## Important payment distinction

The static demo records simulated funding/cancellation locally and moves no money. A real PayPal Checkout capture pays the configured merchant; the milestone ledger is an orchestration record, **not a regulated escrow account or custodied balance**. Any real escrow-like funds flow requires the appropriate PayPal product approval, legal structure, and compliant backend handling.

## Stack

React · Vite · Tailwind CSS v4 · Framer Motion · Lucide · AG Grid Community · date-fns · PayPal React SDK v6

## Project structure

- `src/App.jsx` — six-stage wizard, negotiation and checkout flow
- `src/components/CalendarPlanner.jsx` — event/setup/milestone calendar
- `src/components/BudgetGrid.jsx` — AG Grid vendor ledger
- `src/data/catalog.js` — curated local vendor catalogue
- `src/index.css` — warm editorial design system
- `src/main.jsx` — React entry point
- `vite.config.js` — Vite, React, Tailwind and GitHub Pages base path
