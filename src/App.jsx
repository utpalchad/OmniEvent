import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, CalendarDays, Camera, CakeSlice,
  Check, CheckCircle2, ChevronRight, ClipboardList, Clock3, CreditCard, Flower2,
  Hand, HeartHandshake, LockKeyhole, MapPin, Music2, Plus, RefreshCw, ShieldCheck,
  Shirt, Sparkles, Star, Truck, Utensils, Wallet, Brush, X, Send
} from 'lucide-react';
import CalendarPlanner from './components/CalendarPlanner.jsx';
import BudgetGrid from './components/BudgetGrid.jsx';
import { EVENT_TYPES, SERVICE_META, formatMoney, getLocalVendors } from './data/catalog.js';

// PactAI is intentionally frontend-only in this build. Negotiation, cancellation,
// payment preview and ledger allocation are deterministic client-side simulations.
const LABELS = ['The occasion', 'Dates & milestones', 'Vendor circle', 'Negotiation', 'Payment ledger'];
const ICONS = {
  venue: Building2, catering: Utensils, transport: Truck, decor: Flower2,
  photography: Camera, makeup: Brush, mehendi: Hand, entertainment: Music2,
  cake: CakeSlice, planner: ClipboardList, fashion: Shirt
};
const SERVICE_SHORT = {
  venue: 'venue', catering: 'catering', transport: 'transport', decor: 'decor',
  photography: 'photography', makeup: 'makeup', mehendi: 'Mehendi',
  entertainment: 'DJ', cake: 'cake', planner: 'planner', fashion: 'fashion'
};
const FLOOR_RATES = {
  venue: .78, catering: .80, decor: .76, photography: .80, makeup: .79,
  mehendi: .78, entertainment: .74, transport: .80, cake: .78, planner: .79, fashion: .82
};
const NEGOTIATION_REASONS = {
  venue: 'Off-peak Sunday date unlocked a 17% estate discount; flexible access hours reduced the venue package rate.',
  catering: 'Multi-event package rate applied; menu planning and service staffing were consolidated into one booking.',
  decor: 'Combined stage, floral and mandap scope removed duplicate installation and strike-down charges.',
  photography: 'Multi-day coverage package reduced crew deployment and post-production overhead.',
  makeup: 'Group booking rate applied across the wedding party, with one coordinated on-location setup.',
  mehendi: 'Bridal-plus-guest booking unlocked a station package rate and shared artist travel.',
  entertainment: '6-service bundle waived equipment & travel fees; DJ, sound and lighting were priced as one package.',
  transport: 'Round-trip shuttle blocks were combined, reducing dead mileage and dispatch overhead.',
  cake: 'Tiered cake and dessert-table scope was bundled under one production and delivery window.',
  planner: 'Multi-function coordination rate applied after consolidating the run-of-show and vendor check-ins.',
  fashion: 'Wedding-party fittings were grouped into one appointment and styling package.'
};

const plusDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const initialDates = () => ({
  depositDate: plusDays(0), auditDate: plusDays(31), setupDate: plusDays(44),
  eventDate: plusDays(45), releaseDate: plusDays(46)
});
const getPrice = (vendor) => Number(vendor.finalPrice ?? vendor.currentPrice ?? vendor.listedPrice ?? 0);
const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const initials = (name = '') => String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'PA';

function modelVendor(vendor) {
  const listedPrice = Number(vendor.listedPrice || 0);
  const floorPrice = Math.ceil(listedPrice * (FLOOR_RATES[vendor.service] || .79));
  return {
    ...vendor, listedPrice, floorPrice, finalPrice: listedPrice, currentPrice: listedPrice,
    serviceLabel: SERVICE_META[vendor.service]?.label || vendor.service,
    strategy: NEGOTIATION_REASONS[vendor.service] || 'A coordinated package rate was applied after reviewing the selected event scope.',
    statusLabel: 'Modeled floor respected'
  };
}

function parseTarget(value, listedTotal) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (raw.includes('%')) {
    const pct = Number(raw.replace(/[%\s,]/g, ''));
    if (!Number.isFinite(pct) || pct < 0 || pct > 80) return null;
    return listedTotal * (1 - pct / 100);
  }
  const amount = Number(raw.replace(/[$,\s]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

// Distributes a requested bundle price proportionally across vendor discount
// headroom. No result can move below that vendor's modeled floor price.
function buildOffers(vendors, targetValue, round, harder = false) {
  const listedTotal = sum(vendors, 'listedPrice');
  const floorTotal = sum(vendors, 'floorPrice');
  const currentTotal = vendors.reduce((total, vendor) => total + getPrice(vendor), 0);
  let desired = parseTarget(targetValue, listedTotal);
  if (desired === null) desired = currentTotal * (1 - Math.min(.12, .025 * Math.max(1, round)));
  if (harder) desired *= .985;
  desired = Math.min(listedTotal, Math.max(floorTotal, desired));
  const discountRoom = Math.max(0, listedTotal - floorTotal);
  const pressure = discountRoom ? Math.max(0, Math.min(1, (listedTotal - desired) / discountRoom)) : 1;

  return vendors.map(vendor => {
    const floor = Number(vendor.floorPrice || Math.ceil(vendor.listedPrice * .79));
    const headroom = Math.max(0, Number(vendor.listedPrice) - floor);
    const finalPrice = Math.max(floor, Math.min(Number(vendor.listedPrice), Math.round(Number(vendor.listedPrice) - headroom * pressure)));
    return {
      ...vendor, currentPrice: finalPrice, finalPrice,
      savings: Number(vendor.listedPrice) - finalPrice,
      strategy: NEGOTIATION_REASONS[vendor.service] || vendor.strategy,
      statusLabel: 'Modeled floor respected'
    };
  });
}

function Brand() {
  return <div className="brand-lockup"><span className="brand-monogram">p.</span><span className="brand-name">pact<span>ai</span></span><span className="brand-rule" /><span className="brand-note">EVENT PROTOCOL</span></div>;
}

function Progress({ step, onStep }) {
  return <nav className="progress-nav" aria-label="Five planning stages">
    <div className="progress-line"><span style={{ width: (step / 4 * 100) + '%' }} /></div>
    {LABELS.map((label, index) => <button type="button" key={label}
      className={'progress-step ' + (index === step ? 'current ' : '') + (index < step ? 'complete' : '')}
      disabled={index > step} onClick={() => index < step && onStep(index)}>
      <span className="progress-index">{index < step ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span>
      <span className="progress-label">{label}</span>
    </button>)}
  </nav>;
}

function Heading({ eyebrow, title, detail, aside }) {
  return <div className="stage-heading">
    <div><span className="eyebrow">{eyebrow}</span><h1 className="display-title">{title}</h1>{detail && <p className="muted">{detail}</p>}</div>
    {aside && <div>{aside}</div>}
  </div>;
}

function Footer({ back, next, nextText, disabled = false, note }) {
  return <div className="stage-footer">
    <button type="button" className="text-button" onClick={back}><ArrowLeft size={15} /> Back</button>
    {note && <span className="footer-note">{note}</span>}
    <button type="button" className="button button-dark" onClick={next} disabled={disabled}>{nextText} <ArrowRight size={16} /></button>
  </div>;
}

function VendorAvatar({ vendor, className = 'vendor-image' }) {
  const [failed, setFailed] = useState(!vendor.image);
  if (failed) return <span className={className + ' avatar-fallback'} aria-label={vendor.name + ' initials'}>{initials(vendor.name)}</span>;
  return <img className={className} src={vendor.image} alt={vendor.name} loading="lazy"
    onError={() => setFailed(true)} />;
}

function ImageMosaic({ eventType, tier }) {
  const pictures = eventType === 'corporate'
    ? ['photo-1511795409834-ef04bbd61622', 'photo-1517457373958-b7bdd4587205', 'photo-1519167758481-83f550bb49b3']
    : ['photo-1519741497674-611481863552', 'photo-1464366400600-7168b8af9bc3', 'photo-1519225421980-715cb0215aed'];
  const image = (id, width = 800) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + width + '&q=85';
  return <div className="image-mosaic">
    <div className="mosaic-hero"><img src={image(pictures[0], 950)} alt="An elegant event venue" /></div>
    <div className="mosaic-secondary mosaic-one"><img src={image(pictures[1], 580)} alt="Event table styling" /></div>
    <div className="mosaic-secondary mosaic-two"><img src={image(pictures[2], 580)} alt="Floral event details" /></div>
    <div className="bundle-badge"><Sparkles size={14} /><span><small>YOUR BUNDLE TIER</small><strong>{tier}</strong></span></div>
    <div className="mosaic-floating-note"><span className="floating-note-top"><Sparkles size={12} /> THE PACTAI TOUCH</span><strong>Every detail, in rhythm.</strong><small>One brief. A better way to gather.</small></div>
    <span className="mosaic-caption">A GOOD GATHERING, BEAUTIFULLY ORCHESTRATED</span>
  </div>;
}


/* Reusable photo tile with a safe, local visual fallback for broken image URLs. */
function SelectionPhoto({ src, alt, className = '' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallback = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85';
  return <div className={'selection-photo-frame ' + className}>
    {imageFailed
      ? <div className="selection-photo-fallback"><Sparkles size={18} /><span>{alt}</span></div>
      : <img src={src || fallback} alt={alt} loading="lazy" onError={() => setImageFailed(true)} />}
    <span className="selection-photo-caption">{alt}</span>
  </div>;
}

function OccasionStage({ config, setConfig, next }) {
  const tier = config.services.length >= 3 ? 'Mega-bundle' : config.services.length === 2 ? 'Bundle bargain' : 'Standard';
  const toggle = (service) => setConfig(current => ({
    ...current,
    services: current.services.includes(service) ? current.services.filter(item => item !== service) : [...current.services, service]
  }));
  return <div className="occasion-layout stage-body">
    <section className="occasion-form">
      <div className="overline"><span /> AUTONOMOUS EVENT NEGOTIATION</div>
      <h1 className="hero-title">Moments that move people.<em>Orchestrated by autonomous AI.</em></h1>
      <p className="hero-lede">One brief. A circle of exceptional vendors. A smarter way to bring every detail together.</p>
      <div className="hero-scroll-cue"><span className="hero-scroll-line" /><span>SCROLL TO COMPOSE YOUR MOMENT</span><span className="hero-scroll-count">01 — 05</span></div>
      <div className="section-label"><b>01</b><strong>What are we gathering for?</strong><small>CHOOSE AN OCCASION</small></div>
      {['Wedding & ceremonies', 'Family & social', 'Corporate & professional'].map((group, groupIndex) => <section className="occasion-group" key={group}>
        <div className="occasion-group-heading"><span>0{groupIndex + 1}</span><strong>{group}</strong><small>{EVENT_TYPES.filter(event => event.group === group).length} OCCASION TYPES</small></div>
        <div className="occasion-cards">
          {EVENT_TYPES.filter(event => event.group === group).map(event => <div className="occasion-choice" key={event.id}>
            <motion.button
              type="button"
              className={'occasion-card ' + (config.eventType === event.id ? 'selected' : '')}
              aria-pressed={config.eventType === event.id}
              whileHover={{ y: -3 }}
              whileTap={{ scale: .985 }}
              onClick={() => setConfig(current => ({ ...current, eventType: event.id }))}
            >
              <span className="occasion-choice-title"><span className="occasion-choice-icon">{event.icon}</span><strong>{event.label}</strong>
                {config.eventType === event.id && <span className="card-check"><Check size={12} /></span>}
              </span>
              <small>{event.detail}</small>
            </motion.button>
            {/* Each occasion photo sits directly below its own selection button. */}
            <SelectionPhoto src={event.photo} alt={event.label} className="occasion-choice-image" />
          </div>)}
        </div>
      </section>)}
      <div className="section-label"><b>02</b><strong>Build your service circle</strong><small>SELECT EVERYTHING YOU NEED</small></div>
      <div className="service-grid">
        {Object.entries(SERVICE_META).map(([key, meta]) => {
          const Icon = ICONS[key] || Sparkles;
          const active = config.services.includes(key);
          return <div className="service-choice" key={key}>
            <motion.button
              type="button"
              className={'service-chip ' + (active ? 'selected' : '')}
              onClick={() => toggle(key)}
              aria-pressed={active}
              whileHover={{ y: -3 }}
              whileTap={{ scale: .985 }}
            >
              <span className="service-chip-icon"><Icon size={18} /></span>
              <span className="service-chip-copy"><strong>{meta.label}</strong><small>{meta.short}</small></span>
              <span className="chip-check">{active ? <Check size={13} /> : <Plus size={13} />}</span>
            </motion.button>
            {/* Service-specific photo is paired beneath its corresponding chip. */}
            <SelectionPhoto src={meta.photo} alt={meta.label} className="service-choice-image" />
          </div>;
        })}
      </div>
      <div className="brief-grid">
        <label className="field"><span>GUEST COUNT</span><input type="number" min="1" max="5000" value={config.guestCount} onChange={e => setConfig(current => ({ ...current, guestCount: e.target.value }))} /></label>
        <label className="field"><span>CITY</span><div className="input-icon"><MapPin size={14} /><input value={config.city} onChange={e => setConfig(current => ({ ...current, city: e.target.value }))} /></div></label>
        <label className="field field-wide"><span>YOUR VISION</span><input value={config.vision} onChange={e => setConfig(current => ({ ...current, vision: e.target.value }))} placeholder="A candlelit garden celebration with thoughtful details…" /></label>
        <label className="field"><span>MAXIMUM TARGET BUDGET · USD</span><div className="input-icon"><b>$</b><input type="number" min="100" value={config.budget} onChange={e => setConfig(current => ({ ...current, budget: e.target.value }))} /></div></label>
      </div>
      <div className="occasion-actions"><span className="fine-print">Bundle tier updates as your service circle grows.</span><button type="button" className="button button-dark" disabled={!config.services.length || !Number(config.guestCount) || !config.city.trim()} onClick={next}>Select dates <ArrowRight size={16} /></button></div>
    </section>
    <aside className="occasion-art"><ImageMosaic eventType={config.eventType} tier={tier} /><div className="art-footnote"><span>01 / 05</span><span>PLAN WITH INTENTION</span></div></aside>
  </div>;
}

function Marketplace({ vendors, selected, onSelect, config, onBack, onContinue }) {
  const chosenCount = config.services.filter(service => vendors.some(vendor => vendor.service === service && vendor.id === selected[service])).length;
  return <div className="stage-body">
    <Heading eyebrow="THE VENDOR CIRCLE · CURATED FOR YOUR BRIEF" title="Find your people."
      detail={'A considered shortlist for your ' + config.eventType + ' in ' + config.city + '. Explore the collection, compare each partner and choose the right fit.'}
      aside={<div className="soft-stat"><strong>{vendors.length}</strong><span>CURATED OPTIONS</span></div>} />
    <div className="marketplace-groups">
      {config.services.map(service => {
        const options = vendors.filter(vendor => vendor.service === service);
        const Icon = ICONS[service] || Sparkles;
        return <section className="market-section" key={service}>
          <div className="market-section-title"><span className="service-icon"><Icon size={17} /></span><div><h3>{SERVICE_META[service]?.label || service}</h3><small>{options.length} matching partners</small></div><span className="market-chosen">{options.length ? 'SWIPE TO EXPLORE' : 'NO MATCHES'}</span></div>
          <div className="vendor-options" aria-label={(SERVICE_META[service]?.label || service) + ' vendor collection'}>
            {options.map((vendor, index) => {
              const active = selected[service] === vendor.id;
              return <motion.button key={vendor.id} type="button" className={'vendor-option ' + (active ? 'selected' : '')} whileHover={{ y: -5 }} whileTap={{ scale: .985 }} onClick={() => onSelect(service, vendor.id)}>
                <VendorAvatar vendor={vendor} className="vendor-image" />
                <span className="vendor-card-index">{String(index + 1).padStart(2, '0')} / {String(options.length).padStart(2, '0')}</span>
                <span className="vendor-info"><strong>{vendor.name}</strong><small>{vendor.tag || vendor.city} · up to {Number(vendor.capacity || 0).toLocaleString()} guests</small><span className="vendor-rating"><Star size={11} fill="currentColor" /> {vendor.rating || '4.8'} <b>·</b> {formatMoney(vendor.listedPrice)}</span></span>
                <span className="vendor-select">{active ? <CheckCircle2 size={18} /> : <Plus size={18} />}</span>
              </motion.button>;
            })}
          </div>
        </section>;
      })}
    </div>
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to dates</button>
      <span className="footer-note">{chosenCount} of {config.services.length} services selected</span>
      <button className="button button-dark" disabled={chosenCount !== config.services.length} onClick={onContinue}>Enter negotiation <ArrowRight size={16} /></button>
    </div>
  </div>;
}

function NegotiationStage({ vendors, round, busy, target, setTarget, onTargetNegotiate, onHarder, onBack, onContinue }) {
  const listPrice = sum(vendors, 'listedPrice');
  const finalPrice = vendors.reduce((total, vendor) => total + getPrice(vendor), 0);
  const saving = listPrice - finalPrice;
  return <div className="stage-body">
    <Heading eyebrow="PACTAI NEGOTIATION ENGINE · FLOOR-SAFE OFFERS" title="Let the terms get better."
      detail="Set a bundle amount or discount target. PactAI spreads the requested saving across your selected vendors without crossing a modeled vendor floor."
      aside={<div className="round-stamp"><span>ROUND</span><strong>{String(round).padStart(2, '0')}</strong><small>{busy ? 'WORKING' : 'READY'}</small></div>} />
    <div className="negotiation-toolbar"><div className="agent-status"><span className="sage-dot" />{busy ? 'AGENT IS REASSESSING OFFERS' : 'NEGOTIATION LOOP READY'}</div><span className="mono">BUNDLE / FLOOR-SAFE MODE</span></div>
    <div className="negotiation-target panel">
      <label htmlFor="target-budget"><span className="eyebrow">YOUR TARGET BUNDLE BUDGET ($) OR DESIRED DISCOUNT (%)</span>
        <input id="target-budget" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 19000 or 20%" />
      </label>
      <p>Enter <strong>$19,000</strong> for a bundle target or <strong>20%</strong> for a desired discount. Offers stop at each vendor's modeled floor.</p>
      <button type="button" className="button button-dark" disabled={busy || !vendors.length} onClick={onTargetNegotiate}><Sparkles size={15} /> Negotiate Near Target</button>
    </div>
    <div className="negotiation-cards">
      {vendors.map(vendor => {
        const current = getPrice(vendor);
        const saved = Math.max(0, Number(vendor.listedPrice) - current);
        return <article key={vendor.id} className="negotiation-card">
          <div className="neg-vendor"><VendorAvatar vendor={vendor} className="neg-avatar" /><div><small>{SERVICE_META[vendor.service]?.label || vendor.service}</small><strong>{vendor.name}</strong><span><BadgeCheck size={12} /> {vendor.statusLabel || 'Modeled floor respected'}</span></div></div>
          <div className="offer-flow"><div><small>LISTED QUOTE</small><strong>{formatMoney(vendor.listedPrice)}</strong></div><div className="offer-arrow"><ArrowRight size={16} /></div><div><small>PACTAI OFFER</small><strong className="gold-figure">{formatMoney(current)}</strong></div></div>
          <p className="negotiation-reason">{vendor.strategy || NEGOTIATION_REASONS[vendor.service]}</p>
          <div className="neg-card-foot"><span>NEGOTIATED SAVING</span><strong>−{formatMoney(saved)}</strong></div>
        </article>;
      })}
    </div>
    <div className="savings-strip"><div><span>COMBINED LISTED QUOTE</span><strong>{formatMoney(listPrice)}</strong></div>
      <div><span>AGREED BUNDLE</span><strong>{formatMoney(finalPrice)}</strong></div>
      <div><span>NEGOTIATED SAVING</span><strong className="sage-figure">{formatMoney(saving)}</strong></div></div>
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to vendors</button>
      <button type="button" className="button button-outline" onClick={onHarder} disabled={busy}><RefreshCw size={14} /> Push AI to bargain harder</button>
      <button type="button" className="button button-dark" onClick={onContinue} disabled={busy}>Inspect payment ledger <ArrowRight size={16} /></button>
    </div>
  </div>;
}

function PayPalPreviewModal({ total, deposit, vendors, onClose, onConfirm }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="paypal-preview-modal" role="dialog" aria-modal="true" aria-labelledby="paypal-preview-title">
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close checkout preview"><X size={18} /></button>
      <div className="checkout-panel-head"><div className="paypal-wordmark">Pay<span>Pal</span></div><span className="sandbox-tag">SANDBOX PREVIEW</span></div>
      <div className="paypal-preview-icon"><CreditCard size={24} /></div>
      <span className="eyebrow">INITIAL DEPOSIT · 30%</span>
      <h2 id="paypal-preview-title" className="serif-title">Review your first payment.</h2>
      <div className="preview-amount">{formatMoney(deposit)}</div>
      <p className="muted-copy">This client-side preview shows the amount that would be sent to a PayPal Sandbox checkout. It does not create an order or move money.</p>
      <div className="preview-vendor-list">{vendors.map(vendor => <div key={vendor.id}><span>{vendor.name}</span><strong>{formatMoney(getPrice(vendor))}</strong></div>)}</div>
      <div className="preview-total"><span>Negotiated bundle</span><strong>{formatMoney(total)}</strong></div>
      <div className="checkout-disclaimer"><LockKeyhole size={14} /><p>Demo only. A real PayPal Sandbox order requires a configured client ID and secure order creation/capture integration. This preview never charges a card.</p></div>
      <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Go back</button><button type="button" className="button button-dark" onClick={onConfirm}>Confirm demo preview <ArrowRight size={15} /></button></div>
    </section>
  </div>;
}

function LedgerStage({ vendors, dates, status, onBack, onCancelVendor, cancelNotice, onOpenPayPal, paymentReference }) {
  const listed = sum(vendors, 'listedPrice');
  const agreed = vendors.reduce((total, vendor) => total + getPrice(vendor), 0);
  const deposit = Math.round(agreed * .3);
  const midway = Math.round(agreed * .4);
  const final = agreed - deposit - midway;
  return <div className="stage-body">
    <Heading eyebrow="PAYMENT SCHEDULE · VENDOR ALLOCATION" title="Every promise, accounted for."
      detail="The ledger recalculates from the active vendor circle. Cancelling a service removes its row and reallocates all three checkpoints."
      aside={<span className="quiet-badge"><ShieldCheck size={13} /> {status}</span>} />
    <div className="ledger-summary">
      <div><small>LISTED TOTAL</small><strong>{formatMoney(listed)}</strong></div>
      <div><small>NEGOTIATED TOTAL</small><strong>{formatMoney(agreed)}</strong></div>
      <div><small>YOU KEEP</small><strong className="sage-figure">{formatMoney(listed - agreed)}</strong></div>
      <div><small>ACTIVE VENDORS</small><strong>{vendors.length}</strong></div>
    </div>
    <div className="milestone-grid">
      {[{ title: 'Initial deposit', date: dates.depositDate, pct: '30%', amount: deposit, detail: 'Proposed funding checkpoint' },
        { title: 'Midway audit', date: dates.auditDate, pct: '40%', amount: midway, detail: 'After progress sign-off' },
        { title: 'Final release', date: dates.releaseDate, pct: '30%', amount: final, detail: 'After completion review' }].map((item, index) =>
        <div className="milestone-card" key={item.title}><span className="milestone-index">0{index + 1}</span><small>{item.pct} ALLOCATION</small><strong>{item.title}</strong><b>{formatMoney(item.amount)}</b><span>{item.date}</span><em>{item.detail}</em></div>)}
    </div>
    <BudgetGrid vendors={vendors} dates={dates} escrowStatus={status} />
    <section className="refund-guard panel">
      <div className="refund-heading"><span className="refund-icon"><HeartHandshake size={18} /></span><div><span className="eyebrow">AUTONOMOUS REFUND GUARD</span><h2 className="serif-title">Plans can change.</h2></div></div>
      <p>Remove a selected service from the bundle. The transaction ledger, negotiated total and milestone allocations update immediately in this demo.</p>
      <div className="refund-examples">
        {vendors.map(vendor => <button type="button" key={vendor.id} onClick={() => onCancelVendor(vendor)}>
          <X size={12} /> Cancel {SERVICE_SHORT[vendor.service] || vendor.service}
        </button>)}
        {!vendors.length && <span className="refund-empty">No active vendor services remain in this bundle.</span>}
      </div>
      {cancelNotice && <div className="refund-notice" role="status">{cancelNotice}</div>}
      <div className="refund-foot"><span><i /> CLIENT-SIDE GUARD ACTIVE</span><span>{vendors.length} ACTIVE SERVICES</span></div>
    </section>
    {paymentReference && <div className="payment-confirmation"><CheckCircle2 size={17} /><div><strong>Sandbox preview confirmed</strong><small>{paymentReference} · no funds moved</small></div></div>}
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to negotiation</button>
      <span className="footer-note">Milestone schedule is a planning record, not a custodial escrow balance.</span>
      <button type="button" className="button button-dark" onClick={onOpenPayPal} disabled={!vendors.length}><Wallet size={16} /> Pay Initial Deposit with PayPal</button>
    </div>
  </div>;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [curtainPhase, setCurtainPhase] = useState('idle');
  const transitionTimers = useRef([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => () => {
    transitionTimers.current.forEach(timer => window.clearTimeout(timer));
  }, []);
  const [config, setConfig] = useState({
    eventType: 'wedding', services: ['venue', 'catering', 'decor', 'photography', 'mehendi', 'entertainment'],
    guestCount: '120', city: 'New Delhi',
    vision: 'A candlelit garden celebration with thoughtful details.', budget: '18000'
  });
  const [dates, setDates] = useState(initialDates);
  const [setupTime, setSetupTime] = useState('09:00');
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState({});
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState('19000');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Awaiting funding');
  const [cancelNotice, setCancelNotice] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paypalOpen, setPaypalOpen] = useState(false);

  // Step navigation: cover with the forest-green curtain, change stage,
  // then reveal. Reduced-motion users receive an immediate, non-animated change.
  const go = (targetStep) => {
    transitionTimers.current.forEach(timer => window.clearTimeout(timer));
    if (prefersReducedMotion) {
      setStep(targetStep);
      setCurtainPhase('idle');
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    setCurtainPhase('cover');
    transitionTimers.current = [
      window.setTimeout(() => {
        setStep(targetStep);
        setCurtainPhase('reveal');
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 360),
      window.setTimeout(() => setCurtainPhase('idle'), 1050)
    ];
  };

  const chosen = useMemo(() => config.services
    .map(service => vendors.find(vendor => vendor.service === service && vendor.id === selected[service]))
    .filter(Boolean), [vendors, selected, config.services]);

  const loadVendors = () => {
    const local = getLocalVendors(config.eventType, config.services, config.city).map(modelVendor);
    const nextSelected = {};
    config.services.forEach(service => {
      const first = local.find(vendor => vendor.service === service);
      if (first) nextSelected[service] = first.id;
    });
    setVendors(local);
    setSelected(nextSelected);
    setRound(0);
    setTarget('19000');
    setCancelNotice('');
    go(2);
  };

  const updateSelection = (service, id) => setSelected(current => ({ ...current, [service]: id }));

  const runNegotiation = (harder = false) => {
    if (!chosen.length) return;
    setBusy(true);
    const nextRound = round + 1;
    const updates = buildOffers(chosen, target, nextRound, harder);
    setVendors(current => current.map(vendor => updates.find(update => update.id === vendor.id) || vendor));
    setRound(nextRound);
    setStatus('Locally modeled offers');
    setBusy(false);
  };

  const startNegotiation = () => {
    runNegotiation(false);
    go(3);
  };

  const cancelVendor = (vendor) => {
    setSelected(current => ({ ...current, [vendor.service]: '' }));
    setConfig(current => ({ ...current, services: current.services.filter(service => service !== vendor.service) }));
    setCancelNotice(vendor.name + ' removed. The ledger total and 30% / 40% / 30% checkpoints have been recalculated.');
    setPaymentReference('');
    setStatus('Bundle updated locally');
  };

  const confirmPreview = () => {
    const ref = 'PPACT-SBX-' + Date.now().toString(36).toUpperCase();
    setPaymentReference(ref);
    setStatus('Sandbox preview recorded · no funds moved');
    setPaypalOpen(false);
  };

  const restart = () => {
    go(0);
    setDates(initialDates());
    setVendors([]);
    setSelected({});
    setRound(0);
    setTarget('19000');
    setStatus('Awaiting funding');
    setCancelNotice('');
    setPaymentReference('');
    setPaypalOpen(false);
    setConfig({
      eventType: 'wedding', services: ['venue', 'catering', 'decor', 'photography', 'mehendi', 'entertainment'],
      guestCount: '120', city: 'New Delhi', vision: 'A candlelit garden celebration with thoughtful details.', budget: '18000'
    });
  };

  const total = chosen.reduce((amount, vendor) => amount + getPrice(vendor), 0);
  const initialDeposit = Math.round(total * .3);

  return <div className="app-shell">
    <header className="app-header"><Brand /><div className="header-meta"><span className="header-dot" /><Sparkles size={13} /> AUTONOMOUS EVENT COMMERCE <i>·</i> PAYPAL HACKATHON BUILD</div><div className="header-trust"><ShieldCheck size={14} /> PRIVATE BY DESIGN</div></header>
    <Progress step={step} onStep={go} />
    <main className="app-main">
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={step}
          className="wizard-stage"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 22, scale: .992, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -14, scale: .995, filter: 'blur(3px)' }}
          transition={{ duration: prefersReducedMotion ? 0 : .42, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 0 && <OccasionStage config={config} setConfig={setConfig} next={() => { setDates(initialDates()); go(1); }} />}
          {step === 1 && <div className="stage-body"><Heading eyebrow="EVENT CALENDAR · SETUP & PAYMENT MILESTONES" title="Choose the moments." detail="Set the event day, vendor setup window and three clear payment checkpoints." /><CalendarPlanner dates={dates} onChange={setDates} setupTime={setupTime} onSetupTimeChange={setSetupTime} /><Footer back={() => go(0)} next={loadVendors} nextText="Browse curated vendors" note="Availability indicators are illustrative demo signals." /></div>}
          {step === 2 && <Marketplace vendors={vendors} selected={selected} onSelect={updateSelection} config={config} onBack={() => go(1)} onContinue={startNegotiation} />}
          {step === 3 && <NegotiationStage vendors={chosen} round={round} busy={busy} target={target} setTarget={setTarget} onTargetNegotiate={() => runNegotiation(false)} onHarder={() => runNegotiation(true)} onBack={() => go(2)} onContinue={() => go(4)} />}
          {step === 4 && <LedgerStage vendors={chosen} dates={dates} status={status} onBack={() => go(3)} onCancelVendor={cancelVendor} cancelNotice={cancelNotice} onOpenPayPal={() => setPaypalOpen(true)} paymentReference={paymentReference} />}
        </motion.section>
      </AnimatePresence>
    </main>
    <footer className="app-footer"><span>© 2026 PACTAI STUDIO</span><span><i /> CLIENT-SIDE NEGOTIATION DEMO</span><span>BETTER AGREEMENTS, BEAUTIFULLY MADE <ChevronRight size={12} /></span></footer>
    <AnimatePresence>
      {curtainPhase !== 'idle' && <motion.div
        className="transition-curtain"
        key="pactai-transition-curtain"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: curtainPhase === 'cover' ? 1 : 0 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: curtainPhase === 'cover' ? .34 : .56, ease: [0.76, 0, 0.24, 1] }}
        style={{ transformOrigin: curtainPhase === 'cover' ? 'bottom' : 'top' }}
        aria-hidden="true"
      >
        <div className="curtain-brand">p<span>.</span></div>
        <div className="curtain-message">MAKE IT A MOMENT<small>PACTAI · EVENT PROTOCOL</small></div>
        <div className="curtain-orbit orbit-a" /><div className="curtain-orbit orbit-b" />
      </motion.div>}
    </AnimatePresence>
    {paypalOpen && <PayPalPreviewModal total={total} deposit={initialDeposit} vendors={chosen} onClose={() => setPaypalOpen(false)} onConfirm={confirmPreview} />}
  </div>;
}
