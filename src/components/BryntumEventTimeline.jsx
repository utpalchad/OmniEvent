import React, { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { BryntumScheduler } from '@bryntum/scheduler-react-community';
import '@bryntum/scheduler-community/scheduler.css';
import '@bryntum/scheduler-community/stockholm-light.css';
import '@bryntum/core-community/fontawesome/css/fontawesome.css';
import '@bryntum/core-community/fontawesome/css/solid.css';

const DEMO_RESOURCES = [
  { id: 'plan', name: 'PactAI milestone plan' },
  { id: 'venue', name: 'The Grand Meridian · Venue' },
  { id: 'catering', name: 'Saffron & Sage · Catering' },
  { id: 'floral', name: 'Petal & Pine · Floral & Decor' },
  { id: 'photo', name: 'FrameStory Studios · Photo & Video' },
  { id: 'sound', name: 'Pulse AV · Sound & Lighting' },
  { id: 'live', name: 'Northstar Live Collective' },
  { id: 'security', name: 'Sentinel Event Security' },
  { id: 'rentals', name: 'Velvet & Vine · Luxury Rentals' }
];

const dateAt = (value, time) => `${value}T${time}:00`;
const dateOf = value => parseISO(`${value}T12:00:00`);
const minDate = values => values.map(dateOf).sort((a, b) => a - b)[0];
const maxDate = values => values.map(dateOf).sort((a, b) => b - a)[0];

export default function BryntumEventTimeline({ dates, setupTime = '09:00' }) {
  const schedulerProps = useMemo(() => {
    const eventDate = dates.eventDate;
    const milestones = [
      { id: 'milestone-deposit', resourceId: 'plan', name: 'Deposit · 30%', startDate: dateAt(dates.depositDate, '10:00'), endDate: dateAt(dates.depositDate, '13:00'), eventColor: 'green' },
      { id: 'milestone-audit', resourceId: 'plan', name: 'Midway audit · 40%', startDate: dateAt(dates.auditDate, '11:00'), endDate: dateAt(dates.auditDate, '14:00'), eventColor: 'blue' },
      { id: 'setup-venue', resourceId: 'venue', name: 'Venue access & setup', startDate: dateAt(dates.setupDate, setupTime), endDate: dateAt(dates.setupDate, '18:00'), eventColor: 'green' },
      { id: 'setup-floral', resourceId: 'floral', name: 'Floral installation', startDate: dateAt(dates.setupDate, '09:00'), endDate: dateAt(dates.setupDate, '17:00'), eventColor: 'purple' },
      { id: 'setup-av', resourceId: 'sound', name: 'Sound & lighting rig', startDate: dateAt(dates.setupDate, '08:00'), endDate: dateAt(dates.setupDate, '18:00'), eventColor: 'blue' },
      { id: 'setup-rentals', resourceId: 'rentals', name: 'Furniture & luxury rentals', startDate: dateAt(dates.setupDate, '10:00'), endDate: dateAt(dates.setupDate, '16:00'), eventColor: 'orange' },
      ...[
        ['venue', 'Venue handover'], ['catering', 'Catering service'], ['floral', 'Event styling'],
        ['photo', 'Photo & video coverage'], ['sound', 'Live production'], ['live', 'Live performances'],
        ['security', 'Guest & event security'], ['rentals', 'Rental operations']
      ].map(([resourceId, name]) => ({
        id: `event-${resourceId}`, resourceId, name,
        startDate: dateAt(eventDate, '10:00'), endDate: dateAt(eventDate, '23:00'),
        eventColor: 'indigo'
      })),
      { id: 'milestone-release', resourceId: 'plan', name: 'Final release · 30%', startDate: dateAt(dates.releaseDate, '10:00'), endDate: dateAt(dates.releaseDate, '13:00'), eventColor: 'green' }
    ];
    const axisStart = addDays(minDate(Object.values(dates)), -2);
    const axisEnd = addDays(maxDate(Object.values(dates)), 2);
    return {
      resources: DEMO_RESOURCES,
      events: milestones,
      columns: [{ type: 'resourceInfo', text: 'Vendor / milestone', field: 'name', width: 225, showEventCount: false }],
      startDate: axisStart,
      endDate: axisEnd,
      viewPreset: 'dayAndWeek',
      rowHeight: 42,
      barMargin: 5,
      eventStyle: 'border',
      readOnly: true,
      height: 390
    };
  }, [dates.depositDate, dates.auditDate, dates.setupDate, dates.eventDate, dates.releaseDate, setupTime]);

  return (
    <div className="pactai-bryntum-timeline" aria-label="Bryntum event schedule">
      <div className="pactai-bryntum-heading">
        <span>BRYNTUM SCHEDULER · 8 ASSIGNED VENDORS</span>
        <small>27 DEC 2026 · DEMO EVENT</small>
      </div>
      <BryntumScheduler {...schedulerProps} />
    </div>
  );
}
