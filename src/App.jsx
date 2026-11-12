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
import { EVENT_TYPES, SERVICE_META, formatMoney } from './data/catalog.js';
import { supabase } from './lib/supabase.js';

// Customer events and vendor enquiries are persisted in Supabase. Negotiation figures
// remain planning estimates until each vendor confirms their quote; payments are not processed here.
const LABELS = ['The occasion', 'Dates & milestones', 'Vendor circle', 'Negotiation', 'Payment ledger'];
const ICONS = {
  venue: Building2, catering: Utensils, transport: Truck, decor: Flower2,
  photography: Camera, makeup: Brush, mehendi: Hand, entertainment: Music2,
  cake: CakeSlice, planner: ClipboardList, fashion: Shirt,
  sound_lighting: Music2, security: ShieldCheck, rentals: Truck
};
const SERVICE_SHORT = {
  venue: 'venue', catering: 'catering', transport: 'transport', decor: 'decor',
  photography: 'photography', makeup: 'makeup', mehendi: 'Mehendi',
  entertainment: 'DJ', cake: 'cake', planner: 'planner', fashion: 'fashion',
  sound_lighting: 'sound & lighting', security: 'security', rentals: 'rentals'
};

const initialDates = () => ({
  depositDate: '2026-12-13',
  auditDate: '2026-12-20',
  setupDate: '2026-12-26',
  eventDate: '2026-12-27',
  releaseDate: '2026-12-28'
});
const getPrice = (vendor) => Number(vendor.finalPrice ?? vendor.currentPrice ?? vendor.listedPrice ?? 0);
const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const initials = (name = '') => String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'PA';

function modelVendor(vendor) {
  const listedPrice = Number(vendor.listedPrice || 0);
  return {
    ...vendor,
    listedPrice,
    floorPrice: listedPrice,
    finalPrice: listedPrice,
    currentPrice: listedPrice,
    serviceLabel: SERVICE_META[vendor.service]?.label || vendor.service,
    strategy: 'Awaiting an AI-generated customer proposal.',
    negotiationMessage: '',
    statusLabel: 'Vendor review required'
  };
}


const serviceForCategory = (category = '') => {
  const value = String(category).toLowerCase();
  if (value.includes('venue')) return 'venue';
  if (value.includes('cater') || value.includes('food')) return 'catering';
  if (value.includes('security') || value.includes('safety')) return 'security';
  if (value.includes('rental') || value.includes('furniture')) return 'rentals';
  if (value.includes('sound') || value.includes('lighting') || value.includes('audio') || value.includes('av')) return 'sound_lighting';
  if (value.includes('photo') || value.includes('video') || value.includes('cinema')) return 'photography';
  if (value.includes('decor') || value.includes('floral')) return 'decor';
  if (value.includes('makeup') || value.includes('beauty') || value.includes('styling')) return 'makeup';
  if (value.includes('mehendi') || value.includes('henna')) return 'mehendi';
  if (value.includes('dj') || value.includes('entertain') || value.includes('music') || value.includes('band')) return 'entertainment';
  if (value.includes('transport') || value.includes('car') || value.includes('shuttle')) return 'transport';
  if (value.includes('cake') || value.includes('dessert')) return 'cake';
  if (value.includes('planner') || value.includes('coordination')) return 'planner';
  if (value.includes('fashion') || value.includes('bridal') || value.includes('invitation')) return 'fashion';
  return null;
};

function mapMarketplaceService(row) {
  const service = serviceForCategory(row.category);
  if (!service) return null;
  return modelVendor({
    id: row.id, serviceId: row.id, vendorId: row.vendor_id, service,
    serviceName: row.name, name: row.business_name || 'Event professional',
    city: row.city || '', tag: row.category || row.name,
    image: row.cover_url || row.logo_url || '', rating: Number(row.rating || 0) || null, capacity: null,
    blurb: row.description || '', listedPrice: Number(row.price || 0),
    currencyCode: row.currency_code || 'INR', priceMinor: Number(row.price_minor || 0),
    availabilityDates: row.availability_dates || []
  });
}

function parseTarget(value, listedTotal) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (raw.includes('%')) {
    const pct = Number(raw.replace(/[%\s,]/g, ''));
    if (!Number.isFinite(pct) || pct < 0 || pct > 80) return null;
    return listedTotal * (1 - pct / 100);
  }
  const amount = Number(raw.replace(/[₹$,\s]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
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
        <label className="field"><span>MAXIMUM TARGET BUDGET · INR</span><div className="input-icon"><b>₹</b><input type="number" min="100" value={config.budget} onChange={e => setConfig(current => ({ ...current, budget: e.target.value }))} /></div></label>
      </div>
      <div className="occasion-actions"><span className="fine-print">Bundle tier updates as your service circle grows.</span><button type="button" className="button button-dark" disabled={!config.services.length || !Number(config.guestCount) || !config.city.trim()} onClick={next}>Select dates <ArrowRight size={16} /></button></div>
    </section>
    <aside className="occasion-art"><ImageMosaic eventType={config.eventType} tier={tier} /><div className="art-footnote"><span>01 / 05</span><span>PLAN WITH INTENTION</span></div></aside>
  </div>;
}

function Marketplace({ vendors, selected, onSelect, config, onBack, onContinue, marketplaceMessage, marketplaceLoading }) {
  const chosenCount = config.services.filter(service => vendors.some(vendor => vendor.service === service && vendor.id === selected[service])).length;
  return <div className="stage-body">
    <Heading eyebrow="THE VENDOR CIRCLE · CURATED FOR YOUR BRIEF" title="Find your people."
      detail={'A considered shortlist for your ' + config.eventType + ' in ' + config.city + '. Explore the collection, compare each partner and choose the right fit.'}
      aside={<div className="soft-stat"><strong>{vendors.length}</strong><span>CURATED OPTIONS</span></div>} />
    {marketplaceMessage && <div className="vp-message" role="status">{marketplaceMessage}</div>}
    {marketplaceLoading && <div className="vp-message" role="status">Loading approved vendor services from Supabase…</div>}
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
                <span className="vendor-info"><strong>{vendor.name}</strong><small>{vendor.serviceName || vendor.tag || vendor.city}{vendor.city ? ' · ' + vendor.city : ''}</small><span className="vendor-rating">{vendor.rating ? <><Star size={11} fill="currentColor" /> {vendor.rating} <b>·</b></> : 'STARTING AT'} {formatMoney(vendor.listedPrice)}</span></span>
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

function NegotiationStage({ vendors, round, busy, target, setTarget, onTargetNegotiate, onHarder, onBack, onContinue, aiSummary, aiError, customer }) {
  const listPrice = sum(vendors, 'listedPrice');
  const finalPrice = vendors.reduce((total, vendor) => total + getPrice(vendor), 0);
  const saving = Math.max(0, listPrice - finalPrice);
  const proposalReady = round > 0;
  return <div className="stage-body">
    <Heading eyebrow="AI NEGOTIATION COPILOT · CUSTOMER PROPOSAL" title="Shape your opening offer."
      detail="PactAI uses AI to draft a respectful opening proposal for each selected vendor. Every suggested amount stays between that vendor's listed price and their private minimum acceptable price. Vendors must still review and respond."
      aside={<div className="round-stamp"><span>AI DRAFT</span><strong>{String(round).padStart(2, '0')}</strong><small>{busy ? 'THINKING' : proposalReady ? 'READY' : 'NOT STARTED'}</small></div>} />
    <div className="negotiation-toolbar"><div className="agent-status"><span className="sage-dot" />{busy ? 'PACTAI IS PREPARING YOUR PROPOSAL' : proposalReady ? 'AI PROPOSAL READY · AWAITING VENDOR REVIEW' : 'READY TO GENERATE AN AI PROPOSAL'}</div><span className="mono">AI-ASSISTED · NOT AN ACCEPTED QUOTE</span></div>
    {!customer && <div className="vp-message" role="status">Sign in with a customer account to use the AI negotiator. <a href="/customer/login">Customer sign in</a></div>}
    {aiError && <div className="vp-message" role="alert">{aiError}</div>}
    {aiSummary && <div className="panel negotiation-ai-summary"><span className="eyebrow">PACTAI'S NEGOTIATION STRATEGY</span><p>{aiSummary}</p></div>}
    <div className="negotiation-target panel">
      <label htmlFor="target-budget"><span className="eyebrow">YOUR TARGET BUNDLE BUDGET (₹) OR DESIRED DISCOUNT (%)</span>
        <input id="target-budget" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 19000 or 15%" />
      </label>
      <p>AI considers the event brief and the minimum price each vendor has authorised. A target below those minimums cannot be promised.</p>
      <button type="button" className="button button-dark" disabled={busy || !vendors.length || !customer} onClick={onTargetNegotiate}><Sparkles size={15} /> {busy ? 'Preparing proposal…' : proposalReady ? 'Regenerate AI proposal' : 'Generate AI proposal'}</button>
      {proposalReady && <button type="button" className="button button-outline" disabled={busy || !customer} onClick={onHarder}><RefreshCw size={14} /> Ask for a firmer proposal</button>}
    </div>
    <div className="negotiation-cards">
      {vendors.map(vendor => {
        const current = getPrice(vendor);
        const saved = Math.max(0, Number(vendor.listedPrice) - current);
        return <article key={vendor.id} className="negotiation-card">
          <div className="neg-vendor"><VendorAvatar vendor={vendor} className="neg-avatar" /><div><small>{SERVICE_META[vendor.service]?.label || vendor.service}</small><strong>{vendor.name}</strong><span><BadgeCheck size={12} /> {proposalReady ? 'AI-drafted proposal · vendor confirmation required' : 'Listed price · awaiting AI proposal'}</span></div></div>
          <div className="offer-flow"><div><small>LISTED PRICE</small><strong>{formatMoney(vendor.listedPrice)}</strong></div><div className="offer-arrow"><ArrowRight size={16} /></div><div><small>{proposalReady ? 'AI PROPOSED PRICE' : 'NOT YET PROPOSED'}</small><strong className="gold-figure">{proposalReady ? formatMoney(current) : '—'}</strong></div></div>
          {proposalReady && <><p className="negotiation-reason">{vendor.strategy}</p><div className="negotiation-reason"><strong>Suggested message to vendor:</strong><p>{vendor.negotiationMessage}</p></div><div className="neg-card-foot"><span>POTENTIAL DIFFERENCE · NOT CONFIRMED SAVINGS</span><strong>−{formatMoney(saved)}</strong></div></>}
        </article>;
      })}
    </div>
    <div className="savings-strip"><div><span>COMBINED LISTED PRICE</span><strong>{formatMoney(listPrice)}</strong></div>
      <div><span>{proposalReady ? 'AI PROPOSED BUNDLE' : 'BUNDLE PRICE'}</span><strong>{formatMoney(proposalReady ? finalPrice : listPrice)}</strong></div>
      <div><span>POTENTIAL DIFFERENCE</span><strong className="sage-figure">{formatMoney(proposalReady ? saving : 0)}</strong></div></div>
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to vendors</button>
      <span className="footer-note">No vendor has accepted these proposals. Final prices require vendor confirmation.</span>
      <button type="button" className="button button-dark" onClick={onContinue} disabled={busy || !proposalReady}>Review proposals <ArrowRight size={16} /></button>
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

function LedgerStage({ vendors, dates, status, onBack, onCancelVendor, cancelNotice, onSendEnquiries, requestReference, requestMessage, requestBusy, customer }) {
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
      <div><small>PROPOSED TOTAL</small><strong>{formatMoney(agreed)}</strong></div>
      <div><small>POTENTIAL DIFFERENCE</small><strong className="sage-figure">{formatMoney(listed - agreed)}</strong></div>
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
      <p>Remove a selected service from the proposal. The planning ledger and milestone estimates update; no payment is collected at this stage.</p>
      <div className="refund-examples">
        {vendors.map(vendor => <button type="button" key={vendor.id} onClick={() => onCancelVendor(vendor)}>
          <X size={12} /> Cancel {SERVICE_SHORT[vendor.service] || vendor.service}
        </button>)}
        {!vendors.length && <span className="refund-empty">No active vendor services remain in this bundle.</span>}
      </div>
      {cancelNotice && <div className="refund-notice" role="status">{cancelNotice}</div>}
      <div className="refund-foot"><span><i /> CLIENT-SIDE GUARD ACTIVE</span><span>{vendors.length} ACTIVE SERVICES</span></div>
    </section>
    {requestReference && <div className="payment-confirmation"><CheckCircle2 size={17} /><div><strong>Event and vendor enquiries saved</strong><small>Reference: {requestReference}</small></div></div>}
    {requestMessage && <div className="vp-message" role="status">{requestMessage}{!customer && <> <a href="/customer/login">Customer sign in / register</a></>}</div>}
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to negotiation</button>
      <span className="footer-note">Planning estimates only. Vendors must confirm availability and final quotes; no payment is collected here.</span>
      <button type="button" className="button button-dark" onClick={onSendEnquiries} disabled={!vendors.length || requestBusy || Boolean(requestReference)}>{requestBusy ? 'Saving requests…' : requestReference ? 'Enquiries sent' : 'Send vendor enquiries'} <ArrowRight size={16} /></button>
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

  // Supabase has no always-on Node startup process in this Vite static app.
  // The first frontend boot invokes the server-side, idempotent seed function.
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.functions.invoke('demo-seed', { body: { action: 'seed' } })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.warn('PactAI demo seed did not run:', error.message);
        else console.info('PactAI demo seed:', data?.seeded || data);
      })
      .catch(error => {
        if (active) console.warn('PactAI demo seed did not run:', error);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) setCustomer(data.user || null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setCustomer(session?.user || null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const [config, setConfig] = useState({
    eventType: 'corporate', services: ['venue', 'catering', 'decor', 'photography', 'sound_lighting', 'entertainment', 'security', 'rentals'],
    guestCount: '300', city: 'New Delhi',
    vision: 'Annual Tech Gala 2026 — a premium year-end technology celebration with keynote moments, dinner, live entertainment and an awards programme.', budget: '400000'
  });
  const [dates, setDates] = useState(initialDates);
  const [setupTime, setSetupTime] = useState('09:00');
  const [vendors, setVendors] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [marketplaceMessage, setMarketplaceMessage] = useState('');
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [requestReference, setRequestReference] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);
  const [selected, setSelected] = useState({});
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState('330000');
  const [negotiationSummary, setNegotiationSummary] = useState('');
  const [negotiationError, setNegotiationError] = useState('');
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

  const loadVendors = async () => {
    setMarketplaceLoading(true);
    setMarketplaceMessage('');
    setVendors([]);
    setSelected({});
    if (!supabase) {
      setMarketplaceMessage('The marketplace needs Supabase configuration. Check the Render environment variables.');
      setMarketplaceLoading(false);
      go(2);
      return;
    }
    const { data, error } = await supabase.from('marketplace_services').select('*').order('created_at', { ascending: false });
    if (error) {
      setMarketplaceMessage('Could not load live services: ' + error.message);
      setMarketplaceLoading(false);
      go(2);
      return;
    }
    const mapped = (data || []).map(mapMarketplaceService).filter(vendor => vendor && config.services.includes(vendor.service));
    const wantedCity = config.city.trim().toLowerCase();
    const cityMatches = wantedCity ? mapped.filter(vendor => vendor.city.toLowerCase().includes(wantedCity) || wantedCity.includes(vendor.city.toLowerCase())) : mapped;
    const visible = cityMatches.length ? cityMatches : mapped;
    const nextSelected = {};
    config.services.forEach(service => {
      const first = visible.find(vendor => vendor.service === service);
      if (first) nextSelected[service] = first.id;
    });
    setVendors(visible);
    setSelected(nextSelected);
    setMarketplaceMessage(visible.length
      ? (cityMatches.length ? 'Showing approved, published services from Supabase.' : 'No services matched that city exactly. Other approved cities are shown with their listed locations.')
      : 'No approved, published vendor services are available yet. Add a vendor service, publish the shop, and have an administrator approve the vendor in Supabase.');
    setRound(0);
    setTarget('330000');
    setNegotiationSummary('');
    setNegotiationError('');
    setCancelNotice('');
    setRequestReference('');
    setRequestMessage('');
    setMarketplaceLoading(false);
    go(2);
  };

  const updateSelection = (service, id) => setSelected(current => ({ ...current, [service]: id }));

  const runNegotiation = async (harder = false) => {
    if (!chosen.length) return;
    if (!customer) {
      setNegotiationError('Sign in with a customer account before generating an AI proposal.');
      return;
    }
    setBusy(true);
    setNegotiationError('');
    setNegotiationSummary('');
    const nextRound = round + 1;
    try {
      const { data, error } = await supabase.functions.invoke('negotiate-bundle', {
        body: {
          service_ids: chosen.map(vendor => vendor.serviceId || vendor.id),
          target: String(target || '').trim(),
          revision: nextRound,
          stronger: harder,
          event: {
            event_type: config.eventType,
            city: config.city,
            guest_count: Number(config.guestCount),
            event_date: dates.eventDate,
            vision: config.vision
          }
        }
      });
      if (error) throw new Error(data?.error || error.message || 'The AI negotiator could not be reached.');
      if (!data || !Array.isArray(data.recommendations)) throw new Error('The AI negotiator returned an invalid proposal. Please try again.');
      const recommendations = new Map(data.recommendations.map(item => [item.service_id, item]));
      const expectedIds = chosen.map(vendor => vendor.serviceId || vendor.id);
      if (expectedIds.some(id => !recommendations.has(id))) throw new Error('The AI proposal did not include every selected service. Please regenerate it.');
      setVendors(current => current.map(vendor => {
        const item = recommendations.get(vendor.serviceId || vendor.id);
        if (!item) return vendor;
        const proposedPrice = Number(item.proposed_price);
        return {
          ...vendor,
          currentPrice: proposedPrice,
          finalPrice: proposedPrice,
          savings: Math.max(0, Number(vendor.listedPrice) - proposedPrice),
          strategy: item.rationale,
          negotiationMessage: item.message,
          statusLabel: 'AI proposal · awaiting vendor review'
        };
      }));
      setRound(nextRound);
      setNegotiationSummary(data.summary || 'AI-generated opening proposals are ready for your review.');
      setStatus('AI proposal · awaiting vendor review');
    } catch (error) {
      setNegotiationError(error.message || 'Unable to generate a proposal. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const startNegotiation = () => {
    setNegotiationSummary('');
    setNegotiationError('');
    go(3);
    void runNegotiation(false);
  };

  const sendEnquiries = async () => {
    setRequestMessage('');
    if (!supabase) { setRequestMessage('Supabase is not configured on the deployed app.'); return; }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setRequestMessage('Sign in or create a customer account before sending enquiries.');
      return;
    }
    if (!chosen.length) { setRequestMessage('Select at least one live vendor service first.'); return; }
    setRequestBusy(true);
    try {
      const selections = chosen.map(vendor => ({
        service_id: vendor.serviceId || vendor.id,
        vendor_id: vendor.vendorId,
        proposed_price: getPrice(vendor),
        message: 'PactAI event enquiry: ' + config.eventType + ' in ' + config.city + '. Guests: ' + config.guestCount + '. Event date: ' + dates.eventDate + '. Budget: ' + config.budget + '. Brief: ' + config.vision + '. AI-assisted customer opening proposal: ' + formatMoney(getPrice(vendor)) + '. ' + (vendor.negotiationMessage || 'Please review this proposal and share your quote.') + ' This is a proposal only and is not a vendor-approved price.'
      }));
      const { data, error } = await supabase.rpc('submit_customer_event', {
        p_event: {
          event_type: config.eventType, city: config.city, guest_count: config.guestCount,
          event_date: dates.eventDate, budget: config.budget, vision: config.vision,
          dates, agreed_total: total
        },
        p_selections: selections
      });
      if (error) throw error;
      setRequestReference(data);
      setRequestMessage('Your event plan and ' + selections.length + ' vendor enquiries have been saved. Vendors can now see the requests in their portal.');
      setStatus('Enquiries saved to Supabase');
    } catch (error) {
      setRequestMessage(error.message || 'Unable to send enquiries. Please try again.');
    } finally {
      setRequestBusy(false);
    }
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
    setTarget('330000');
    setNegotiationSummary('');
    setNegotiationError('');
    setStatus('Awaiting funding');
    setCancelNotice('');
    setPaymentReference('');
    setPaypalOpen(false);
    setConfig({
      eventType: 'corporate',
      services: ['venue', 'catering', 'decor', 'photography', 'sound_lighting', 'entertainment', 'security', 'rentals'],
      guestCount: '300',
      city: 'New Delhi',
      vision: 'Annual Tech Gala 2026 — a premium year-end technology celebration with keynote moments, dinner, live entertainment and an awards programme.',
      budget: '400000'
    });
  };

  const total = chosen.reduce((amount, vendor) => amount + getPrice(vendor), 0);
  const initialDeposit = Math.round(total * .3);

  return <div className="app-shell">
    <header className="app-header"><Brand /><div className="header-meta"><span className="header-dot" /><Sparkles size={13} /> AUTONOMOUS EVENT COMMERCE <i>·</i> SUPABASE MARKETPLACE</div><a className="header-trust" href="/customer/login">{customer ? 'Customer account' : 'Customer sign in'}</a></header>
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
          {step === 2 && <Marketplace vendors={vendors} selected={selected} onSelect={updateSelection} config={config} onBack={() => go(1)} onContinue={startNegotiation} marketplaceMessage={marketplaceMessage} marketplaceLoading={marketplaceLoading} />}
          {step === 3 && <NegotiationStage vendors={chosen} round={round} busy={busy} target={target} setTarget={setTarget} onTargetNegotiate={() => runNegotiation(false)} onHarder={() => runNegotiation(true)} onBack={() => go(2)} onContinue={() => go(4)} aiSummary={negotiationSummary} aiError={negotiationError} customer={customer} />}
          {step === 4 && <LedgerStage vendors={chosen} dates={dates} status={status} onBack={() => go(3)} onCancelVendor={cancelVendor} cancelNotice={cancelNotice} onSendEnquiries={sendEnquiries} requestReference={requestReference} requestMessage={requestMessage} requestBusy={requestBusy} customer={customer} />}
        </motion.section>
      </AnimatePresence>
    </main>
    <footer className="app-footer"><span>© 2026 PACTAI STUDIO</span><span><i /> SUPABASE-PERSISTED VENDOR ENQUIRIES · NEGOTIATION ESTIMATES</span><span>BETTER AGREEMENTS, BEAUTIFULLY MADE <ChevronRight size={12} /></span></footer>
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
