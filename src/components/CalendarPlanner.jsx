import React, { useMemo, useState } from 'react';
import { addMonths, addHours, format, isBefore, isAfter, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, startOfDay, parseISO } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LockKeyhole, Sparkles } from 'lucide-react';

const ROLES = [
  { key: 'eventDate', label: 'Event day', detail: 'The day everyone gathers' },
  { key: 'setupDate', label: 'Setup window', detail: 'Vendor access & installation' },
  { key: 'depositDate', label: 'Deposit', detail: 'Initial funding checkpoint' },
  { key: 'auditDate', label: 'Midway audit', detail: 'Progress sign-off' },
  { key: 'releaseDate', label: 'Final release', detail: 'Completion milestone' }
];
const safeDate = value => value ? parseISO(`${value}T12:00:00`) : new Date();
const isoDate = date => format(date, 'yyyy-MM-dd');

export default function CalendarPlanner({ dates, onChange, setupTime, onSetupTimeChange }) {
  const [activeRole, setActiveRole] = useState('eventDate');
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(safeDate(dates.eventDate)));
  const today = startOfDay(new Date());
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);
  const previousRole = { auditDate: 'depositDate', setupDate: 'auditDate', eventDate: 'setupDate', releaseDate: 'eventDate' }[activeRole];
  const minimumDate = previousRole ? safeDate(dates[previousRole]) : today;
  const followingRole = { depositDate: 'auditDate', auditDate: 'setupDate', setupDate: 'eventDate', eventDate: 'releaseDate' }[activeRole];
  const maximumDate = followingRole ? safeDate(dates[followingRole]) : null;
  const selectDay = day => {
    const selected = startOfDay(day);
    if (isBefore(selected, today) || isBefore(selected, startOfDay(minimumDate)) || (maximumDate && isAfter(selected, startOfDay(maximumDate)))) return;
    onChange({ ...dates, [activeRole]: isoDate(day) });
  };
  const toSlot = (id, name, startDate, vendor) => ({
    id, name, startDate,
    endDate: format(addHours(new Date(startDate), 1), "yyyy-MM-dd'T'HH:mm:ss"),
    vendor
  });
  const timeline = [
    toSlot('deposit', 'Initial funding checkpoint', `${dates.depositDate}T12:00:00`, 'PactAI payment plan'),
    toSlot('audit', 'Midway quality audit', `${dates.auditDate}T11:00:00`, 'Selected vendors'),
    toSlot('setup', 'Vendor access & setup', `${dates.setupDate}T${setupTime || '09:00'}:00`, 'Venue + decor teams'),
    toSlot('event', 'Event execution', `${dates.eventDate}T16:00:00`, 'All selected vendors'),
    toSlot('release', 'Final completion review', `${dates.releaseDate}T10:00:00`, 'PactAI payment plan')
  ];
  return <div className="calendar-layout">
    <section className="panel calendar-panel">
      <div className="panel-heading"><div><span className="eyebrow">DATE ARCHITECTURE</span><h3 className="serif-heading">Choose the moments.</h3><p className="muted-copy">Select a milestone, then tap its date on the calendar.</p></div><div className="calendar-icon-wrap"><CalendarDays size={19} /></div></div>
      <div className="role-selector">{ROLES.map(role => <button key={role.key} type="button" onClick={() => setActiveRole(role.key)} className={`role-chip ${activeRole === role.key ? 'active' : ''}`}><span>{role.label}</span><small>{dates[role.key] ? format(safeDate(dates[role.key]), 'MMM d') : 'Choose'}</small></button>)}</div>
      <div className="calendar-topline"><div className="month-label">{format(visibleMonth, 'MMMM yyyy')}</div><div className="calendar-arrows"><button type="button" onClick={() => setVisibleMonth(current => addMonths(current, -1))} aria-label="Previous month"><ChevronLeft size={17} /></button><button type="button" onClick={() => setVisibleMonth(current => addMonths(current, 1))} aria-label="Next month"><ChevronRight size={17} /></button></div></div>
      <div className="calendar-grid">{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => <div key={day} className="calendar-weekday">{day}</div>)}{days.map(day => {
        const dayKey = isoDate(day); const inMonth = isSameMonth(day, visibleMonth); const past = isBefore(startOfDay(day), today); const roles = ROLES.filter(role => dates[role.key] === dayKey); const active = dates[activeRole] === dayKey; const availability = day.getDay() === 0 || day.getDay() === 6 ? 'tight' : day.getDate() % 4 === 0 ? 'limited' : 'open'; const outsideRange = isBefore(startOfDay(day), startOfDay(minimumDate)) || (maximumDate && isAfter(startOfDay(day), startOfDay(maximumDate)));
        return <button key={dayKey} type="button" disabled={!inMonth || past || outsideRange} onClick={() => selectDay(day)} className={`calendar-day ${!inMonth ? 'outside' : ''} ${active ? 'selected' : ''} ${roles.length ? 'has-date' : ''} ${past || outsideRange ? 'past' : ''}`} title={`Illustrative vendor availability: ${availability}`}><span>{format(day, 'd')}</span>{inMonth && !past && !outsideRange && <i className={`availability-dot ${availability}`} />}{roles.length > 0 && <b className="date-markers">{roles.length}</b>}</button>;
      })}</div>
      <div className="calendar-legend"><span><i className="availability-dot open" /> Good availability</span><span><i className="availability-dot limited" /> Limited</span><span><i className="availability-dot tight" /> High demand</span></div>
      <div className="setup-time-row"><div><Clock3 size={15} /><span>Setup access begins</span></div><input type="time" value={setupTime} onChange={event => onSetupTimeChange(event.target.value)} /></div>
    </section>
    <aside className="panel timeline-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR EVENT RUN OF SHOW</span><h3 className="serif-heading">A considered timeline.</h3><p className="muted-copy">Calendar preview in a scheduler-friendly data shape.</p></div><span className="quiet-badge"><Sparkles size={12} /> Live preview</span></div>
      <div className="date-summary-grid">{ROLES.map((role, index) => <button key={role.key} type="button" className={`date-summary ${activeRole === role.key ? 'focused' : ''}`} onClick={() => setActiveRole(role.key)}><span className="summary-step">0{index + 1}</span><span className="summary-title">{role.label}</span><strong>{dates[role.key] ? format(safeDate(dates[role.key]), 'dd MMM yyyy') : 'Not set'}</strong></button>)}</div>
      <div className="timeline-caption"><span>RUN OF SHOW</span><span>BRYNTUM-READY DATA</span></div>
      <div className="event-timeline">{timeline.map(item => <div className="timeline-row" key={item.id}><div className={`timeline-node node-${item.id}`}><span /></div><div className="timeline-row-copy"><div className="timeline-row-top"><strong>{item.name}</strong><span>{format(safeDate(item.startDate.slice(0, 10)), 'dd MMM')}</span></div><small>{item.vendor} · {item.startDate.slice(11, 16)}</small></div></div>)}</div>
      <div className="calendar-trust-note"><LockKeyhole size={13} /><span>Availability dots are illustrative demo signals. Live vendor inventory requires a connected availability API.</span></div>
    </aside>
  </div>;
}