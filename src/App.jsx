import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, CalendarDays, Check, CheckCircle2,
  ChevronRight, Clock3, CreditCard, Flower2, HeartHandshake, LockKeyhole, MapPin,
  Minus, Plus, RefreshCw, ShieldCheck, Sparkles, Star, Truck, Utensils, Wallet,
  X, Send, RotateCcw
} from 'lucide-react';
import { PayPalProvider, PayPalOneTimePaymentButton } from '@paypal/react-paypal-js/sdk-v6';
import CalendarPlanner from './components/CalendarPlanner.jsx';
import BudgetGrid from './components/BudgetGrid.jsx';
import { EVENT_TYPES, SERVICE_META, formatMoney, getLocalVendors } from './data/catalog.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const LABELS = ['The occasion', 'Dates & milestones', 'Vendor circle', 'Negotiation', 'Payment ledger', 'Checkout'];
const ICONS = { venue: Building2, catering: Utensils, transport: Truck, decor: Flower2 };
const EASE = [0.22, 1, 0.36, 1];
const transition = { duration: 0.48, ease: EASE };

const plusDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const initialDates = () => ({
  depositDate: plusDays(0),
  auditDate: plusDays(31),
  setupDate: plusDays(44),
  eventDate: plusDays(45),
  releaseDate: plusDays(46)
});
const getPrice = (vendor) => Number(vendor.finalPrice ?? vendor.currentPrice ?? vendor.listedPrice ?? 0);
const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);

async function api(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function Brand() {
  return <div className="brand-lockup"><span className="brand-monogram">p.</span><span className="brand-name">pact<span>ai</span></span><span className="brand-rule" /><span className="brand-note">EVENT PROTOCOL</span></div>;
}

function Progress({ step, onStep }) {
  return <nav className="progress-nav" aria-label="Planning stages">
    <div className="progress-line"><span style={{ width: `${step / 5 * 100}%` }} /></div>
    {LABELS.map((label, i) => <button type="button" key={label} className={`progress-step ${i === step ? 'current' : ''} ${i < step ? 'complete' : ''}`} disabled={i > step} onClick={() => i < step && onStep(i)}>
      <span className="progress-index">{i < step ? <Check size={12} /> : String(i + 1).padStart(2, '0')}</span><span>{label}</span>
    </button>)}
  </nav>;
}

function Heading({ eyebrow, title, detail, aside }) {
  return <div className="stage-heading"><div><span className="eyebrow">{eyebrow}</span><h1 className="display-title">{title}</h1>{detail && <p className="muted">{detail}</p>}</div>{aside && <div>{aside}</div>}</div>;
}

function Footer({ back, next, nextText, disabled = false, note }) {
  return <div className="stage-footer">
    <button type="button" className="text-button" onClick={back}><ArrowLeft size={15} /> Back</button>
    {note && <span className="footer-note">{note}</span>}
    <button type="button" className="button button-dark" onClick={next} disabled={disabled}>{nextText} <ArrowRight size={16} /></button>
  </div>;
}

function ImageMosaic({ eventType, tier }) {
  const pictures = eventType === 'corporate'
    ? ['photo-1511795409834-ef04bbd61622', 'photo-1517457373958-b7bdd4587205', 'photo-1519167758481-83f550bb49b3']
    : eventType === 'memorial'
      ? ['photo-1507504031003-b417219a0fde', 'photo-1497250681960-ef046c08a56e', 'photo-1519741497674-611481863552']
      : ['photo-1519741497674-611481863552', 'photo-1464366400600-7168b8af9bc3', 'photo-1519225421980-715cb0215aed'];
  const image = (id, width = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
  return <div className="image-mosaic">
    <motion.div className="mosaic-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12, ...transition }} whileHover={{ y: -5 }}><img src={image(pictures[0], 950)} alt="An elegant event venue" /></motion.div>
    <motion.div className="mosaic-secondary mosaic-one" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .28, ...transition }} whileHover={{ y: -4 }}><img src={image(pictures[1], 580)} alt="Event table styling" /></motion.div>
    <motion.div className="mosaic-secondary mosaic-two" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4, ...transition }} whileHover={{ y: -4 }}><img src={image(pictures[2], 580)} alt="Floral event details" /></motion.div>
    <div className="bundle-badge"><Sparkles size={14} /><span><small>YOUR BUNDLE TIER</small><strong>{tier}</strong></span></div>
    <span className="mosaic-caption">A GOOD GATHERING, BEAUTIFULLY ORCHESTRATED</span>
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
      <div className="section-label"><b>01</b><strong>What are we gathering for?</strong><small>CHOOSE AN OCCASION</small></div>
      <div className="occasion-cards">
        {EVENT_TYPES.map(event => <motion.button key={event.id} type="button" className={`occasion-card ${config.eventType === event.id ? 'selected' : ''}`} whileHover={{ y: -4 }} whileTap={{ scale: .99 }} onClick={() => setConfig(c => ({ ...c, eventType: event.id }))}>
          <span className="occasion-emoji">{event.icon}</span><strong>{event.label}</strong><small>{event.detail}</small>{config.eventType === event.id && <span className="card-check"><Check size={12} /></span>}
        </motion.button>)}
      </div>
      <div className="section-label"><b>02</b><strong>Choose your service circle</strong><small>ANY COMBINATION</small></div>
      <div className="service-grid">
        {Object.entries(SERVICE_META).map(([key, meta]) => { const Icon = ICONS[key]; const active = config.services.includes(key); return <button key={key} type="button" className={`service-chip ${active ? 'selected' : ''}`} onClick={() => toggle(key)}><Icon size={17} /><span>{meta.label}</span><span className="chip-check">{active ? <Check size={12} /> : <Plus size={12} />}</span></button>; })}
      </div>
      <div className="brief-grid">
        <label className="field"><span>GUEST COUNT</span><input type="number" min="1" max="5000" value={config.guestCount} onChange={e => setConfig(c => ({ ...c, guestCount: e.target.value }))} /></label>
        <label className="field"><span>CITY</span><div className="input-icon"><MapPin size={14} /><input value={config.city} onChange={e => setConfig(c => ({ ...c, city: e.target.value }))} /></div></label>
        <label className="field field-wide"><span>YOUR VISION</span><input value={config.vision} onChange={e => setConfig(c => ({ ...c, vision: e.target.value }))} placeholder="A candlelit garden celebration with thoughtful details…" /></label>
        <label className="field"><span>MAXIMUM TARGET BUDGET · USD</span><div className="input-icon"><b>$</b><input type="number" min="100" value={config.budget} onChange={e => setConfig(c => ({ ...c, budget: e.target.value }))} /></div></label>
      </div>
      <div className="occasion-actions"><span className="fine-print">Bundle tier updates as your service circle grows.</span><button type="button" className="button button-dark" disabled={!config.services.length || !Number(config.guestCount) || !config.city.trim()} onClick={next}>Select dates <ArrowRight size={16} /></button></div>
    </section>
    <aside className="occasion-art"><ImageMosaic eventType={config.eventType} tier={tier} /><div className="art-footnote"><span>01 / 06</span><span>PLAN WITH INTENTION</span></div></aside>
  </div>;
}

function Marketplace({ vendors, selected, onSelect, config, onBack, onContinue }) {
  const chosen = config.services.map(service => vendors.find(v => v.service === service && v.id === selected[service])).filter(Boolean);
  return <div className="stage-body">
    <Heading eyebrow="THE VENDOR CIRCLE · CURATED FOR YOUR BRIEF" title="Good people make good moments." detail={`A considered shortlist for your ${config.eventType} in ${config.city}. Choose one partner in each service.`} aside={<div className="soft-stat"><strong>{vendors.length}</strong><span>CURATED OPTIONS</span></div>} />
    <div className="marketplace-groups">
      {config.services.map(service => {
        const options = vendors.filter(v => v.service === service);
        const Icon = ICONS[service];
        return <section className="market-section" key={service}>
          <div className="market-section-title"><span className="service-icon"><Icon size={17} /></span><div><h3>{SERVICE_META[service]?.label || service}</h3><small>{options.length} matching partners</small></div><span className="market-chosen">{options.length ? 'CHOOSE ONE' : 'NO MATCHES'}</span></div>
          <div className="vendor-options">{options.map(vendor => {
            const active = selected[service] === vendor.id;
            return <motion.button key={vendor.id} type="button" className={`vendor-option ${active ? 'selected' : ''}`} whileHover={{ y: -4 }} whileTap={{ scale: .99 }} onClick={() => onSelect(service, vendor.id)}>
              <img src={vendor.image} alt={vendor.name} />
              <span className="vendor-info"><strong>{vendor.name}</strong><small>{vendor.tag || vendor.city} · up to {Number(vendor.capacity || 0).toLocaleString()} guests</small><span className="vendor-rating"><Star size={11} fill="currentColor" /> {vendor.rating || '4.8'} <b>·</b> {formatMoney(vendor.listedPrice)}</span></span>
              <span className="vendor-select">{active ? <CheckCircle2 size={18} /> : <Plus size={18} />}</span>
            </motion.button>;
          })}</div>
        </section>;
      })}
    </div>
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to dates</button><span className="footer-note">{chosen.length} of {config.services.length} services selected</span><button className="button button-dark" disabled={chosen.length !== config.services.length} onClick={onContinue}>Enter negotiation <ArrowRight size={16} /></button></div>
  </div>;
}

function NegotiationStage({ vendors, round, busy, error, onHarder, onBack, onContinue }) {
  const listPrice = sum(vendors, 'listedPrice');
  const finalPrice = vendors.reduce((s, v) => s + getPrice(v), 0);
  return <div className="stage-body">
    <Heading eyebrow="PACTAI NEGOTIATION ENGINE · LIVE OFFER LOOP" title="Let the terms get better." detail="The agent tests the full service bundle, date flexibility and scope before presenting an agreed quote." aside={<div className="round-stamp"><span>ROUND</span><strong>{String(round).padStart(2, '0')}</strong><small>{busy ? 'WORKING' : 'COMPLETE'}</small></div>} />
    <div className="negotiation-toolbar"><div className="agent-status"><span className={busy ? 'pulse-dot' : 'sage-dot'} />{busy ? 'AGENT IS REASSESSING OFFERS' : 'NEGOTIATION LOOP READY'}</div><span className="mono">BUNDLE / FLOOR-SAFE MODE</span></div>
    <div className="negotiation-cards">
      {vendors.map((vendor, index) => {
        const current = getPrice(vendor);
        const saved = Math.max(0, Number(vendor.listedPrice) - current);
        return <motion.article layout key={vendor.id} className="negotiation-card" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .06, ...transition }}>
          <div className="neg-vendor"><img src={vendor.image} alt="" /><div><small>{SERVICE_META[vendor.service]?.label || vendor.service}</small><strong>{vendor.name}</strong><span><BadgeCheck size={12} /> Partner quote</span></div></div>
          <div className="offer-flow"><div><small>LISTED QUOTE</small><strong>{formatMoney(vendor.listedPrice)}</strong></div><div className="offer-arrow"><ArrowRight size={16} /></div><div><small>PACTAI OFFER</small><strong className="gold-figure">{formatMoney(current)}</strong></div></div>
          <p className="negotiation-reason">{vendor.strategy || 'The agent used the combined service brief and date flexibility to request a sharper package rate.'}</p>
          <div className="neg-card-foot"><span>{vendor.statusLabel || 'Counter-offer accepted'}</span><strong>−{formatMoney(saved)}</strong></div>
        </motion.article>;
      })}
    </div>
    {error && <p className="inline-error">{error}</p>}
    <div className="savings-strip"><div><span>COMBINED LISTED QUOTE</span><strong>{formatMoney(listPrice)}</strong></div><div><span>AGREED BUNDLE</span><strong>{formatMoney(finalPrice)}</strong></div><div><span>NEGOTIATED SAVING</span><strong className="sage-figure">{formatMoney(listPrice - finalPrice)}</strong></div></div>
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to vendors</button><button type="button" className="button button-outline" onClick={onHarder} disabled={busy}><RefreshCw size={14} /> Push AI to bargain harder</button><button type="button" className="button button-dark" onClick={onContinue} disabled={busy}>Inspect payment ledger <ArrowRight size={16} /></button></div>
  </div>;
}

function LedgerStage({ vendors, dates, status, onBack, onContinue }) {
  const listed = sum(vendors, 'listedPrice');
  const agreed = vendors.reduce((s, v) => s + getPrice(v), 0);
  const deposit = Math.round(agreed * .3);
  const midway = Math.round(agreed * .4);
  const final = agreed - deposit - midway;
  return <div className="stage-body">
    <Heading eyebrow="PAYMENT SCHEDULE · VENDOR ALLOCATION" title="Every promise, accounted for." detail="A transparent plan for the proposed payments across the selected vendor circle." aside={<span className="quiet-badge"><ShieldCheck size={13} /> {status}</span>} />
    <div className="ledger-summary">
      <div><small>LISTED TOTAL</small><strong>{formatMoney(listed)}</strong></div><div><small>NEGOTIATED TOTAL</small><strong>{formatMoney(agreed)}</strong></div><div><small>YOU KEEP</small><strong className="sage-figure">{formatMoney(listed - agreed)}</strong></div><div><small>VENDORS</small><strong>{vendors.length}</strong></div>
    </div>
    <div className="milestone-grid">
      {[{ title: 'Initial deposit', date: dates.depositDate, pct: '30%', amount: deposit, detail: 'Proposed funding checkpoint' }, { title: 'Midway audit', date: dates.auditDate, pct: '40%', amount: midway, detail: 'After progress sign-off' }, { title: 'Final release', date: dates.releaseDate, pct: '30%', amount: final, detail: 'After completion review' }].map((item, i) => <div className="milestone-card" key={item.title}><span className="milestone-index">0{i + 1}</span><small>{item.pct} ALLOCATION</small><strong>{item.title}</strong><b>{formatMoney(item.amount)}</b><span>{item.date}</span><em>{item.detail}</em></div>)}
    </div>
    <BudgetGrid vendors={vendors} dates={dates} escrowStatus={status} />
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to negotiation</button><span className="footer-note">Milestone schedule is a planning record.</span><button className="button button-dark" onClick={onContinue}>Proceed to PayPal <ArrowRight size={16} /></button></div>
  </div>;
}

function CheckoutStage({ vendors, dates, quoteId, onBack, onRestart, setStatus, status, setVendors, setSelected }) {
  const [command, setCommand] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [notice, setNotice] = useState('');
  const total = vendors.reduce((s, v) => s + getPrice(v), 0);
  const funded = Boolean(receipt);
  const fundDemo = () => {
    const reference = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    setReceipt({ mode: 'demo', id: reference, at: new Date().toISOString() });
    setStatus('Demo funding recorded · no funds moved');
    setNotice('Demo checkout recorded locally. No PayPal transaction was created and no money moved.');
  };
  const createOrder = async () => {
    const result = await api('/api/create-paypal-order', { quoteId, vendorIds: vendors.map(v => v.id), dates });
    return { orderId: result.orderId || result.orderID || result.id };
  };
  const captureOrder = async (orderId) => {
    const result = await api('/api/capture-paypal-order', { orderID: orderId, quoteId });
    setReceipt({ mode: 'paypal', id: result.captureId || result.id || orderId, orderId, captureId: result.captureId || result.id, at: new Date().toISOString(), capture: result });
    setStatus('PayPal payment captured');
    setNotice('PayPal Sandbox capture confirmed by the backend.');
  };
  const refund = async (event) => {
    event.preventDefault();
    if (!command.trim() || !funded || busy) return;
    setBusy(true); setNotice('');
    const target = vendors.find(v => command.toLowerCase().includes(v.service) || command.toLowerCase().includes(v.name.toLowerCase()) || (v.service === 'transport' && /shuttle|transport/i.test(command)) || (v.service === 'decor' && /floral|decor/i.test(command)));
    if (!target) {
      setNotice('I could not confidently match that request to one selected service. Mention the vendor or service name.');
      setBusy(false);
      return;
    }
    try {
      if (receipt.mode === 'paypal') {
        const result = await api('/api/cancel-and-refund', { command, vendorId: target.id, orderID: receipt.orderId, captureId: receipt.captureId, quoteId });
        const refundId = result.refundId || result.id || 'Refund confirmed';
        setVendors(current => current.map(v => v.id === target.id ? { ...v, refundStatus: 'Refunded via PayPal' } : v));
        setNotice(`PayPal refund submitted: ${refundId}`);
      } else {
        const ref = `DEMO-REFUND-${Date.now().toString(36).toUpperCase()}`;
        setVendors(current => current.map(v => v.id === target.id ? { ...v, refundStatus: 'Demo cancellation · no money moved' } : v));
        setNotice(`Demo cancellation recorded for ${target.name}. Reference: ${ref}. No funds were moved.`);
      }
      setSelected(current => ({ ...current, [target.service]: '' }));
      setStatus(receipt.mode === 'paypal' ? 'Partial refund recorded' : 'Demo cancellation recorded');
      setCommand('');
    } catch (err) {
      setNotice(`Refund request failed: ${err.message}. No refund is reported as completed.`);
    } finally { setBusy(false); }
  };

  const paymentControl = PAYPAL_CLIENT_ID
    ? <PayPalProvider clientId={PAYPAL_CLIENT_ID} environment="sandbox" components={["paypal-payments"]} pageType="checkout">
        <PayPalOneTimePaymentButton createOrder={createOrder} onApprove={({ orderId }) => captureOrder(orderId)} onError={(err) => setNotice(err?.message || 'PayPal checkout could not be completed.')} />
      </PayPalProvider>
    : <button className="button button-dark checkout-demo" type="button" onClick={fundDemo}><Wallet size={16} /> Run demo checkout</button>;

  return <div className="stage-body checkout-stage">
    <Heading eyebrow="PAYPAL SANDBOX · UNIFIED CHECKOUT" title="A considered close to the plan." detail="Review the negotiated bundle, then fund the order in Sandbox or explore the local demo flow." />
    <div className="checkout-layout">
      <section className="panel checkout-panel">
        <div className="checkout-panel-head"><div className="paypal-wordmark">Pay<span>Pal</span></div><span className={funded ? 'status-funded' : 'status-pending'}>{funded ? 'PAYMENT RECORDED' : 'AWAITING CHECKOUT'}</span></div>
        <div className="checkout-total"><small>PROPOSED BUNDLE TOTAL</small><strong>{formatMoney(total)}</strong><span>{vendors.length} selected vendor services · {dates.eventDate}</span></div>
        <div className="checkout-vendors">{vendors.map(v => <div className="checkout-vendor" key={v.id}><span>{SERVICE_META[v.service]?.label || v.service}</span><strong>{v.name}</strong><b>{formatMoney(getPrice(v))}</b></div>)}</div>
        {funded ? <div className="payment-confirmation"><CheckCircle2 size={17} /><div><strong>{receipt.mode === 'paypal' ? 'PayPal capture confirmed' : 'Demo checkout recorded'}</strong><small>Reference: {receipt.id}</small></div></div> : <div className="paypal-action">{paymentControl}<small>{PAYPAL_CLIENT_ID ? 'PayPal Sandbox · secure server capture' : 'Demo mode · no real payment or card charge'}</small></div>}
        <div className="checkout-disclaimer"><LockKeyhole size={14} /><p><strong>Payment clarity.</strong> Standard PayPal Checkout captures funds to the merchant account. This milestone ledger is an orchestration record, not a regulated escrow account or a custodied balance.</p></div>
      </section>
      <aside className="panel refund-panel">
        <div className="refund-heading"><span className="refund-icon"><HeartHandshake size={18} /></span><div><span className="eyebrow">AUTONOMOUS REFUND GUARD</span><h2 className="serif-title">Plans can change.</h2></div></div>
        <p>Describe what needs to be cancelled. PactAI will match the request to a selected vendor service.</p>
        <form onSubmit={refund} className="refund-form"><label htmlFor="refund-command">YOUR REQUEST</label><div className="refund-input"><input id="refund-command" value={command} onChange={e => setCommand(e.target.value)} placeholder="Cancel the guest transport…" disabled={!funded || busy} /><button type="submit" disabled={!funded || busy || !command.trim()} aria-label="Submit refund request">{busy ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}</button></div></form>
        <div className="refund-examples"><button type="button" disabled={!funded} onClick={() => setCommand('Cancel the guest transport and refund that amount')}>Cancel transport</button><button type="button" disabled={!funded} onClick={() => setCommand('Cancel the floral decor service')}>Cancel decor</button></div>
        {!funded && <div className="refund-gate"><LockKeyhole size={13} /> Complete checkout to activate refunds.</div>}
        {notice && <div className="refund-notice">{notice}</div>}
        <div className="refund-foot"><span><i /> REQUEST PARSER READY</span><span>{vendors.filter(v => /refund|cancel/i.test(v.refundStatus || '')).length} REFUNDS / REMOVALS</span></div>
      </aside>
    </div>
    <div className="stage-footer"><button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Back to ledger</button><span className="footer-note"><ShieldCheck size={13} /> Secure by design</span><button className="button button-outline" onClick={onRestart}><RotateCcw size={14} /> Plan another event</button></div>
  </div>;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    eventType: 'wedding', services: ['venue', 'catering', 'decor'],
    guestCount: '120', city: 'New Delhi',
    vision: 'A candlelit garden celebration with thoughtful details.',
    budget: '18000'
  });
  const [dates, setDates] = useState(initialDates);
  const [setupTime, setSetupTime] = useState('09:00');
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState({});
  const [round, setRound] = useState(1);
  const [quoteId, setQuoteId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Awaiting funding');
  const [error, setError] = useState('');

  const go = (target) => { setError(''); setStep(target); };
  const chosen = useMemo(() => config.services.map(service => vendors.find(v => v.service === service && v.id === selected[service])).filter(Boolean), [vendors, selected, config.services]);

  useEffect(() => {
    if (step !== 2 || !vendors.length) return;
    setSelected(current => {
      const next = { ...current };
      config.services.forEach(service => {
        const candidates = vendors.filter(v => v.service === service);
        if (!candidates.some(v => v.id === next[service])) next[service] = candidates[0]?.id || '';
      });
      return next;
    });
  }, [step, vendors, config.services]);

  const loadVendors = async () => {
    setBusy(true); setError('');
    try {
      const result = await api('/api/plan-event', { ...config, guestCount: Number(config.guestCount), budget: Number(config.budget), event_date: dates.eventDate, services: config.services });
      const remote = Array.isArray(result.vendors) && result.vendors.length ? result.vendors : getLocalVendors(config.eventType, config.services, config.city);
      setVendors(remote.map(v => ({ ...v, listedPrice: Number(v.listedPrice ?? v.price ?? 0), serviceLabel: SERVICE_META[v.service]?.label || v.service })));
    } catch {
      setVendors(getLocalVendors(config.eventType, config.services, config.city).map(v => ({ ...v, serviceLabel: SERVICE_META[v.service]?.label || v.service })));
    } finally {
      setSelected({}); setBusy(false); go(2);
    }
  };

  const negotiate = async (harder = false) => {
    const nextRound = harder ? round + 1 : 1;
    const base = chosen.map(v => ({ ...v, listedPrice: Number(v.listedPrice), finalPrice: getPrice(v) || Number(v.listedPrice) }));
    if (!base.length) return;
    setBusy(true); setError('');
    try {
      const result = await api('/api/negotiate', { vendors: base, round: nextRound, harder, config: { eventType: config.eventType, services: config.services, eventDate: dates.eventDate, city: config.city } });
      if (!Array.isArray(result.vendors) || !result.vendors.length) throw new Error('Negotiation service returned no offers.');
      setQuoteId(result.quoteId || null);
      setVendors(current => current.map(v => result.vendors.find(n => n.id === v.id) ? { ...v, ...result.vendors.find(n => n.id === v.id) } : v));
    } catch {
      setQuoteId(null);
      const updates = base.map((vendor, index) => {
        const floor = Number(vendor.listedPrice) * (0.80 + (index % 3) * 0.025);
        const discount = Math.min(0.20, 0.09 + nextRound * 0.025 + (config.services.length - 1) * 0.012);
        const finalPrice = Math.round(Math.max(floor, Number(vendor.listedPrice) * (1 - discount)));
        return { ...vendor, currentPrice: finalPrice, finalPrice, savings: Number(vendor.listedPrice) - finalPrice, statusLabel: 'Modeled floor respected', strategy: nextRound === 1 ? 'Used the multi-service bundle and flexible event date to request a stronger package rate.' : `Iteration ${nextRound}: Re-tested the bundle and reduced scope friction while respecting the modeled floor.` };
      });
      setVendors(current => current.map(v => updates.find(u => u.id === v.id) || v));
    } finally { setRound(nextRound); setBusy(false); }
  };

  const launchNegotiation = async () => { await negotiate(false); go(3); };
  const restart = () => {
    setStep(0); setDates(initialDates()); setVendors([]); setSelected({}); setRound(1); setQuoteId(null); setStatus('Awaiting funding'); setError('');
    setConfig({ eventType: 'wedding', services: ['venue', 'catering', 'decor'], guestCount: '120', city: 'New Delhi', vision: 'A candlelit garden celebration with thoughtful details.', budget: '18000' });
  };

  return <div className="app-shell">
    <header className="app-header"><Brand /><div className="header-meta"><span className="header-dot" /> AUTONOMOUS EVENT COMMERCE <i>·</i> PAYPAL HACKATHON BUILD</div><div className="header-trust"><ShieldCheck size={14} /> PRIVATE BY DESIGN</div></header>
    <Progress step={step} onStep={go} />
    <main className="app-main">
      <AnimatePresence mode="wait" initial={false}>
        <motion.section key={step} className="wizard-stage" initial={{ opacity: 0, y: 20, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: .985 }} transition={transition}>
          {step === 0 && <OccasionStage config={config} setConfig={setConfig} next={() => { setDates(initialDates()); go(1); }} />}
          {step === 1 && <div className="stage-body"><Heading eyebrow="EVENT CALENDAR · SETUP & PAYMENT MILESTONES" title="Choose the moments." detail="Set the event day, vendor setup window and three clear payment checkpoints." /><CalendarPlanner dates={dates} onChange={setDates} setupTime={setupTime} onSetupTimeChange={setSetupTime} /><Footer back={() => go(0)} next={loadVendors} nextText={busy ? 'Finding partners…' : 'Browse curated vendors'} disabled={busy} note="Availability indicators are illustrative demo signals." /></div>}
          {step === 2 && <Marketplace vendors={vendors} selected={selected} onSelect={(service, id) => setSelected(current => ({ ...current, [service]: id }))} config={config} onBack={() => go(1)} onContinue={launchNegotiation} />}
          {step === 3 && <NegotiationStage vendors={chosen} round={round} busy={busy} error={error} onHarder={() => negotiate(true)} onBack={() => go(2)} onContinue={() => go(4)} />}
          {step === 4 && <LedgerStage vendors={chosen} dates={dates} status={status} onBack={() => go(3)} onContinue={() => go(5)} />}
          {step === 5 && <CheckoutStage vendors={chosen} dates={dates} quoteId={quoteId} onBack={() => go(4)} onRestart={restart} status={status} setStatus={setStatus} setVendors={setVendors} setSelected={setSelected} />}
        </motion.section>
      </AnimatePresence>
    </main>
    <footer className="app-footer"><span>© 2026 PACTAI STUDIO</span><span><i /> NEGOTIATION ENGINE ONLINE</span><span>BETTER AGREEMENTS, BEAUTIFULLY MADE <ChevronRight size={12} /></span></footer>
  </div>;
}
