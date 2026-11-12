export const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding', detail: 'The celebration of a lifetime', icon: '💍', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=88' },
  { id: 'haldi', label: 'Haldi function', detail: 'Colour, rituals & sunshine', icon: '🌼', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1000&q=88' },
  { id: 'mehendi', label: 'Mehendi function', detail: 'Henna, music & happy hands', icon: '🌿', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=88' },
  { id: 'sangeet', label: 'Sangeet ceremony', detail: 'Dance floors & family performances', icon: '🎶', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=88' },
  { id: 'cocktail', label: 'Cocktail party', detail: 'An evening to dress up for', icon: '🥂', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=88' },
  { id: 'ring-ceremony', label: 'Ring ceremony', detail: 'A beautiful beginning', icon: '💎', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=88' },
  { id: 'reception', label: 'Wedding reception', detail: 'A grand gathering, thoughtfully planned', icon: '✨', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=88' },
  { id: 'destination-wedding', label: 'Destination wedding', detail: 'A celebration away from home', icon: '🏝️', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=88' },
  { id: 'pre-wedding-shoot', label: 'Pre-wedding shoot', detail: 'Stories before the big day', icon: '📸', group: 'Wedding & ceremonies', photo: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=88' },
  { id: 'birthday', label: 'Birthday celebration', detail: 'A personal celebration', icon: '🎂', group: 'Family & social' },
  { id: 'baby-shower', label: 'Baby shower', detail: 'A little gathering for a big arrival', icon: '🧸', group: 'Family & social' },
  { id: 'get-together', label: 'Family get-together', detail: 'Good food and familiar faces', icon: '🫶', group: 'Family & social' },
  { id: 'kitty-party', label: 'Kitty party', detail: 'A fun afternoon with friends', icon: '🌷', group: 'Family & social' },
  { id: 'memorial', label: 'Memorial gathering', detail: 'A thoughtful gathering', icon: '🕊️', group: 'Family & social' },
  { id: 'corporate', label: 'Corporate event', detail: 'People, purpose, occasion', icon: '🏢', group: 'Corporate & professional' },
  { id: 'conference', label: 'Conference', detail: 'Ideas, speakers & seamless logistics', icon: '🎤', group: 'Corporate & professional' },
  { id: 'seminar', label: 'Seminar or workshop', detail: 'A space to learn and exchange ideas', icon: '📚', group: 'Corporate & professional' },
  { id: 'award-ceremony', label: 'Award ceremony', detail: 'Recognising people and milestones', icon: '🏆', group: 'Corporate & professional' },
  { id: 'product-launch', label: 'Product launch', detail: 'Make the first impression count', icon: '🚀', group: 'Corporate & professional' },
  { id: 'team-outing', label: 'Team outing', detail: 'Bring the whole team together', icon: '🌳', group: 'Corporate & professional' },
  { id: 'networking', label: 'Networking event', detail: 'New connections, well hosted', icon: '🤝', group: 'Corporate & professional' },
  { id: 'corporate-retreat', label: 'Corporate retreat', detail: 'A change of scene for fresh thinking', icon: '🏞️', group: 'Corporate & professional' },
];

export const SERVICE_META = {
  venue: { label: 'Venues & stays', short: 'Banquets, resorts, lawns & rooftops', description: 'A setting that holds the occasion.' },
  catering: { label: 'Catering & menus', short: 'Buffets, plated menus & live counters', description: 'A menu your guests will remember.' },
  decor: { label: 'Decor & florals', short: 'Stage, mandap, floral & theme decor', description: 'The details that set the scene.' },
  photography: { label: 'Photography & films', short: 'Photographers, cinematography & drone', description: 'The moments worth keeping.' },
  makeup: { label: 'Makeup & styling', short: 'Bridal, groom & occasion makeup', description: 'A look that feels like you.' },
  mehendi: { label: 'Mehendi artists', short: 'Bridal henna & guest mehendi artists', description: 'Intricate details for the celebration.' },
  entertainment: { label: 'DJs & live entertainment', short: 'DJs, live bands, anchors & performers', description: 'Set the rhythm for the room.' },
  transport: { label: 'Guest transport', short: 'Shuttles, cars & guest arrivals', description: 'A smoother arrival for every guest.' },
  cake: { label: 'Cakes & desserts', short: 'Wedding cakes, dessert tables & treats', description: 'A sweet finish to the occasion.' },
  planner: { label: 'Planners & coordination', short: 'Wedding planners & event managers', description: 'One calm point of coordination.' },
  fashion: { label: 'Bridal & groom fashion', short: 'Wedding wear, jewellery & styling', description: 'The finishing touches, beautifully found.' },
};

const allEvents = ['wedding', 'birthday', 'memorial', 'corporate'];
const eventFamily = {
  haldi: 'wedding', mehendi: 'wedding', sangeet: 'wedding', cocktail: 'wedding',
  'ring-ceremony': 'wedding', reception: 'wedding', 'destination-wedding': 'wedding',
  'pre-wedding-shoot': 'wedding',
  'baby-shower': 'birthday', 'get-together': 'birthday', 'kitty-party': 'birthday',
  conference: 'corporate', seminar: 'corporate', 'award-ceremony': 'corporate',
  'product-launch': 'corporate', 'team-outing': 'corporate', networking: 'corporate',
  'corporate-retreat': 'corporate',
};

export const VENDOR_CATALOG = [
  { id: 'venue-amber-house', service: 'venue', name: 'The Amber House', city: 'New Delhi', capacity: 320, listedPrice: 9400, rating: 4.9, tag: 'Garden estate', blurb: 'A leafy courtyard, warm stone architecture and a candlelit indoor hall.', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'venue-ivory-courtyard', service: 'venue', name: 'Ivory Courtyard', city: 'New Delhi', capacity: 220, listedPrice: 7900, rating: 4.8, tag: 'Modern classic', blurb: 'An intimate architectural space with open-air dining and a private lawn.', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'memorial'] },
  { id: 'venue-heritage-room', service: 'venue', name: 'The Heritage Room', city: 'New Delhi', capacity: 500, listedPrice: 11800, rating: 4.9, tag: 'Heritage ballroom', blurb: 'A grand, accessible hall with discreet guest services and flexible layouts.', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85', events: allEvents },
  { id: 'food-saffron-table', service: 'catering', name: 'Saffron & Slate', city: 'New Delhi', capacity: 420, listedPrice: 6100, rating: 4.9, tag: 'Seasonal menus', blurb: 'Thoughtful plated menus, seasonal produce and attentive table service.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'food-garden-spoon', service: 'catering', name: 'The Garden Spoon', city: 'New Delhi', capacity: 260, listedPrice: 5200, rating: 4.8, tag: 'Garden-to-table', blurb: 'Fresh, generous menus with vegetarian and dietary-friendly choices.', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'memorial'] },
  { id: 'food-gather-and-grain', service: 'catering', name: 'Gather & Grain', city: 'New Delhi', capacity: 700, listedPrice: 7600, rating: 4.7, tag: 'Large-format service', blurb: 'Reliable buffet and reception catering for larger guest lists.', image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=85', events: allEvents },
  { id: 'decor-bloom-atelier', service: 'decor', name: 'Bloom Atelier', city: 'New Delhi', capacity: 400, listedPrice: 3450, rating: 5.0, tag: 'Floral artistry', blurb: 'Layered seasonal florals, considered tablescapes and ceremony installations.', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'memorial'] },
  { id: 'decor-form-and-field', service: 'decor', name: 'Form & Field Studio', city: 'New Delhi', capacity: 650, listedPrice: 4200, rating: 4.8, tag: 'Spatial styling', blurb: 'A cohesive visual language for stages, lighting and guest environments.', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'decor-still-blooming', service: 'decor', name: 'Still Blooming Co.', city: 'New Delhi', capacity: 300, listedPrice: 2850, rating: 4.9, tag: 'Quietly elegant', blurb: 'Understated arrangements and sensitive styling for meaningful gatherings.', image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85', events: allEvents },
  { id: 'transport-cityline', service: 'transport', name: 'Cityline Guest Fleet', city: 'New Delhi', capacity: 240, listedPrice: 1750, rating: 4.8, tag: 'Guest shuttles', blurb: 'Coordinated shuttle loops with event-day dispatch support.', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=85', events: allEvents },
  { id: 'transport-arrive-well', service: 'transport', name: 'Arrive Well', city: 'New Delhi', capacity: 180, listedPrice: 1450, rating: 4.9, tag: 'Premium arrivals', blurb: 'A considered mix of executive cars and guest transfer vehicles.', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'transport-ceremonial', service: 'transport', name: 'Ceremonial Coaches', city: 'New Delhi', capacity: 520, listedPrice: 2250, rating: 4.7, tag: 'Group movement', blurb: 'Comfortable group transport with clear pickup coordination.', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'memorial', 'corporate'] },

  { id: 'photo-lens-and-light', service: 'photography', name: 'Lens & Light Stories', city: 'New Delhi', capacity: 1200, listedPrice: 2850, rating: 4.9, tag: 'Photo + film', blurb: 'Documentary-style wedding photography, cinematic films and candid guest portraits.', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'photo-the-frame-house', service: 'photography', name: 'The Frame House', city: 'New Delhi', capacity: 800, listedPrice: 2250, rating: 4.8, tag: 'Cinematography', blurb: 'Story-led coverage with highlight films, drone footage and edited galleries.', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },

  { id: 'makeup-glow-and-grace', service: 'makeup', name: 'Glow & Grace Studio', city: 'New Delhi', capacity: 18, listedPrice: 1250, rating: 4.9, tag: 'Bridal makeup', blurb: 'Bridal, groom and family makeup with trial sessions and on-location styling.', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday'] },
  { id: 'makeup-the-beauty-room', service: 'makeup', name: 'The Beauty Room', city: 'New Delhi', capacity: 12, listedPrice: 950, rating: 4.8, tag: 'Makeup + hair', blurb: 'Soft glam, occasion makeup and hairstyling for the wedding party.', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday'] },

  { id: 'mehendi-rangreet', service: 'mehendi', name: 'Rangreet Mehendi Art', city: 'New Delhi', capacity: 80, listedPrice: 720, rating: 5.0, tag: 'Bridal henna', blurb: 'Intricate bridal mehendi, family designs and guest-friendly mehendi stations.', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday'] },
  { id: 'mehendi-henna-house', service: 'mehendi', name: 'The Henna House', city: 'New Delhi', capacity: 120, listedPrice: 560, rating: 4.9, tag: 'Mehendi lounge', blurb: 'Traditional and contemporary henna designs with a dedicated mehendi setup.', image: 'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday'] },

  { id: 'entertainment-dj-soundcraft', service: 'entertainment', name: 'DJ Soundcraft', city: 'New Delhi', capacity: 1800, listedPrice: 1850, rating: 4.9, tag: 'DJ + sound & lights', blurb: 'Wedding DJs, curated playlists, professional sound and dance-floor lighting.', image: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b6a5?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'entertainment-beat-and-brass', service: 'entertainment', name: 'Beat & Brass Collective', city: 'New Delhi', capacity: 900, listedPrice: 2450, rating: 4.8, tag: 'Live band + anchor', blurb: 'Live musicians, event anchors and high-energy performances for special evenings.', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },

  { id: 'cake-sugar-and-silk', service: 'cake', name: 'Sugar & Silk', city: 'New Delhi', capacity: 600, listedPrice: 480, rating: 4.9, tag: 'Celebration cakes', blurb: 'Custom wedding cakes, tiered designs and dessert-table styling.', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday'] },
  { id: 'cake-whisk-studio', service: 'cake', name: 'Whisk Studio', city: 'New Delhi', capacity: 450, listedPrice: 390, rating: 4.8, tag: 'Dessert bar', blurb: 'Modern cakes, mini desserts and sweet tables for guests of every age.', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday'] },

  { id: 'planner-saffron-occasions', service: 'planner', name: 'Saffron Occasions', city: 'New Delhi', capacity: 1500, listedPrice: 3200, rating: 4.9, tag: 'Full-service planning', blurb: 'Planning, vendor coordination, run-of-show and guest experience management.', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },
  { id: 'planner-gathered-studio', service: 'planner', name: 'Gathered Studio', city: 'New Delhi', capacity: 900, listedPrice: 2450, rating: 4.8, tag: 'Day-of coordination', blurb: 'A calm event team for timelines, vendor check-ins and seamless execution.', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85', events: ['wedding', 'birthday', 'corporate'] },

  { id: 'fashion-ivory-atelier', service: 'fashion', name: 'Ivory Atelier', city: 'New Delhi', capacity: 16, listedPrice: 2100, rating: 4.9, tag: 'Bridal couture', blurb: 'Bridal and occasion-wear consultations with made-to-measure styling.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85', events: ['wedding'] },
  { id: 'fashion-sherwani-house', service: 'fashion', name: 'The Sherwani House', city: 'New Delhi', capacity: 20, listedPrice: 1450, rating: 4.8, tag: 'Groom & family wear', blurb: 'Sherwanis, occasion wear and accessories for the groom and wedding party.', image: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=900&q=85', events: ['wedding'] },
];

export function getLocalVendors(eventType = 'wedding', services = Object.keys(SERVICE_META), city = 'New Delhi') {
  const selectedServices = Array.isArray(services) ? services : [];
  const normalizedCity = String(city || 'New Delhi').trim() || 'New Delhi';
  const family = eventFamily[eventType] || eventType;
  return VENDOR_CATALOG
    .filter((vendor) => selectedServices.includes(vendor.service) && vendor.events.includes(family))
    .map((vendor) => ({ ...vendor, city: normalizedCity }));
}

export function formatMoney(value, currency = 'USD') {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}
