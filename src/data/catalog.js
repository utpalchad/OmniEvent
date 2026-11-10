export const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding / Marriage', detail: 'A day worth remembering', icon: '💍' },
  { id: 'birthday', label: 'Birthday / Milestone', detail: 'A personal celebration', icon: '🎂' },
  { id: 'memorial', label: 'Memorial / Funeral', detail: 'A thoughtful gathering', icon: '🕊️' },
  { id: 'corporate', label: 'Corporate / Gala', detail: 'People, purpose, occasion', icon: '🏢' },
];

export const SERVICE_META = {
  venue: { label: 'Venue', short: 'Spaces & hospitality', description: 'A setting that holds the occasion.' },
  catering: { label: 'Food & catering', short: 'Menus & service', description: 'A menu your guests will remember.' },
  transport: { label: 'Guest transport', short: 'Shuttles & arrivals', description: 'A smoother arrival for every guest.' },
  decor: { label: 'Floral & stage decor', short: 'Florals & atmosphere', description: 'The details that set the scene.' },
};

const allEvents = ['wedding', 'birthday', 'memorial', 'corporate'];

export const VENDOR_CATALOG = [
  { id: 'venue-amber-house', service: 'venue', name: 'The Amber House', city: 'New Delhi', capacity: 320, listedPrice: 9400, rating: 4.9, tag: 'Garden estate', blurb: 'A leafy courtyard, warm stone architecture and a candlelit indoor hall.', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'venue-ivory-courtyard', service: 'venue', name: 'Ivory Courtyard', city: 'New Delhi', capacity: 220, listedPrice: 7900, rating: 4.8, tag: 'Modern classic', blurb: 'An intimate architectural space with open-air dining and a private lawn.', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'memorial'] },
  { id: 'venue-heritage-room', service: 'venue', name: 'The Heritage Room', city: 'New Delhi', capacity: 500, listedPrice: 11800, rating: 4.9, tag: 'Heritage ballroom', blurb: 'A grand, accessible hall with discreet guest services and flexible layouts.', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85', events: allEvents },
  { id: 'food-saffron-table', service: 'catering', name: 'Saffron & Slate', city: 'New Delhi', capacity: 420, listedPrice: 6100, rating: 4.9, tag: 'Seasonal menus', blurb: 'Thoughtful plated menus, seasonal produce and attentive table service.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'food-garden-spoon', service: 'catering', name: 'The Garden Spoon', city: 'New Delhi', capacity: 260, listedPrice: 5200, rating: 4.8, tag: 'Garden-to-table', blurb: 'Fresh, generous menus with vegetarian and dietary-friendly choices.', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'memorial'] },
  { id: 'food-gather-and-grain', service: 'catering', name: 'Gather & Grain', city: 'New Delhi', capacity: 700, listedPrice: 7600, rating: 4.7, tag: 'Large-format service', blurb: 'Reliable buffet and reception catering for larger guest lists.', image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=85', events: allEvents },
  { id: 'transport-cityline', service: 'transport', name: 'Cityline Guest Fleet', city: 'New Delhi', capacity: 240, listedPrice: 1750, rating: 4.8, tag: 'Guest shuttles', blurb: 'Coordinated shuttle loops with event-day dispatch support.', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=85', events: allEvents },
  { id: 'transport-arrive-well', service: 'transport', name: 'Arrive Well', city: 'New Delhi', capacity: 180, listedPrice: 1450, rating: 4.9, tag: 'Premium arrivals', blurb: 'A considered mix of executive cars and guest transfer vehicles.', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'transport-ceremonial', service: 'transport', name: 'Ceremonial Coaches', city: 'New Delhi', capacity: 520, listedPrice: 2250, rating: 4.7, tag: 'Group movement', blurb: 'Comfortable group transport with clear pickup coordination.', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'memorial', 'corporate'] },
  { id: 'decor-bloom-atelier', service: 'decor', name: 'Bloom Atelier', city: 'New Delhi', capacity: 400, listedPrice: 3450, rating: 5.0, tag: 'Floral artistry', blurb: 'Layered seasonal florals, considered tablescapes and ceremony installations.', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'memorial'] },
  { id: 'decor-form-and-field', service: 'decor', name: 'Form & Field Studio', city: 'New Delhi', capacity: 650, listedPrice: 4200, rating: 4.8, tag: 'Spatial styling', blurb: 'A cohesive visual language for stages, lighting and guest environments.', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'decor-still-blooming', service: 'decor', name: 'Still Blooming Co.', city: 'New Delhi', capacity: 300, listedPrice: 2850, rating: 4.9, tag: 'Quietly elegant', blurb: 'Understated arrangements and sensitive styling for meaningful gatherings.', image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85', events: allEvents },
];

export function getLocalVendors(eventType = 'wedding', services = Object.keys(SERVICE_META), city = 'New Delhi') {
  const selectedServices = Array.isArray(services) ? services : [];
  const normalizedCity = String(city || 'New Delhi').trim() || 'New Delhi';
  return VENDOR_CATALOG
    .filter((vendor) => selectedServices.includes(vendor.service) && vendor.events.includes(eventType))
    .map((vendor) => ({ ...vendor, city: normalizedCity }));
}

export function formatMoney(value, currency = 'USD') {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}