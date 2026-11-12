import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-demo-reset-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const DEMO_EVENT_ID = "d0000000-0000-4000-8000-000000000001";
const DEMO_CUSTOMER_EMAIL = "pactai-demo-customer-2026@example.com";

const vendors = [
  {
    key: "venue", serviceId: "d1000000-0000-4000-8000-000000000001",
    email: "pactai-demo-venue-2026@example.com", category: "Venue",
    name: "The Grand Meridian Convention Resort", contact: "Aarav Mehta",
    phone: "+91 98765 40001", city: "New Delhi",
    address: "Aerocity, New Delhi, India", price: 120000,
    rating: 5.0, years: "12 years",
    description: "A polished luxury convention venue with a grand ballroom, landscaped arrival court, dedicated event operations team and flexible staging for premium corporate galas.",
    serviceName: "Grand Ballroom & Gala Venue",
    serviceDescription: "Exclusive ballroom access, pre-function foyer, stage-ready floor plan, guest arrival management and venue operations for up to 500 guests.",
    availableFrom: "2026-11-15", availableUntil: "2026-12-31",
    availabilityDates: ["2026-11-21","2026-11-28","2026-12-06","2026-12-13","2026-12-20","2026-12-26","2026-12-27"]
  },
  {
    key: "catering", serviceId: "d1000000-0000-4000-8000-000000000002",
    email: "pactai-demo-catering-2026@example.com", category: "Catering",
    name: "Saffron & Sage Catering Co.", contact: "Mira Khanna",
    phone: "+91 98765 40002", city: "New Delhi",
    address: "Vasant Kunj, New Delhi, India", price: 55000,
    rating: 4.9, years: "9 years",
    description: "A modern catering studio known for thoughtful Indian and global menus, elegant buffet styling, dietary-aware service and calm front-of-house coordination.",
    serviceName: "Signature Gala Dining Experience",
    serviceDescription: "Curated multi-cuisine buffet, welcome beverages, live counter, vegetarian and vegan options, trained service team for 300 guests.",
    availableFrom: "2026-11-18", availableUntil: "2026-12-30",
    availabilityDates: ["2026-11-20","2026-11-29","2026-12-05","2026-12-13","2026-12-19","2026-12-26","2026-12-27"]
  },
  {
    key: "floral", serviceId: "d1000000-0000-4000-8000-000000000003",
    email: "pactai-demo-floral-2026@example.com", category: "Floral & Decor",
    name: "Petal & Pine Event Atelier", contact: "Ishita Rao",
    phone: "+91 98765 40003", city: "New Delhi",
    address: "Mehrauli, New Delhi, India", price: 40000,
    rating: 4.9, years: "8 years",
    description: "A floral and event-styling atelier creating contemporary stage compositions, immersive entrances, table florals and sustainable installations.",
    serviceName: "Botanical Gala Styling",
    serviceDescription: "Stage backdrop, entry installation, premium table florals, centrepieces, ambient styling and on-site decor supervision.",
    availableFrom: "2026-11-14", availableUntil: "2026-12-31",
    availabilityDates: ["2026-11-22","2026-11-30","2026-12-07","2026-12-13","2026-12-20","2026-12-26","2026-12-27"]
  },
  {
    key: "photo", serviceId: "d1000000-0000-4000-8000-000000000004",
    email: "pactai-demo-photo-2026@example.com", category: "Photography & Video",
    name: "FrameStory Studios", contact: "Kabir Sethi",
    phone: "+91 98765 40004", city: "New Delhi",
    address: "Lajpat Nagar, New Delhi, India", price: 35000,
    rating: 4.8, years: "7 years",
    description: "A boutique event film and photography team combining editorial portraits, documentary coverage, highlight films and discreet multi-camera production.",
    serviceName: "Gala Photography & Highlight Film",
    serviceDescription: "Two photographers, two cinematographers, event highlight film, edited photo gallery and a same-night highlights selection.",
    availableFrom: "2026-11-16", availableUntil: "2026-12-31",
    availabilityDates: ["2026-11-21","2026-11-27","2026-12-04","2026-12-13","2026-12-18","2026-12-26","2026-12-27"]
  },
  {
    key: "sound", serviceId: "d1000000-0000-4000-8000-000000000005",
    email: "pactai-demo-sound-2026@example.com", category: "Sound & Lighting",
    name: "Pulse AV Production", contact: "Rohan Bedi",
    phone: "+91 98765 40005", city: "New Delhi",
    address: "Okhla Phase II, New Delhi, India", price: 30000,
    rating: 4.8, years: "10 years",
    description: "An event technology team delivering concert-grade audio, intelligent lighting, LED walls, show-calling and technical rehearsal support.",
    serviceName: "Premium Audio, Lighting & LED Package",
    serviceDescription: "Line-array audio, wireless microphones, lighting rig, LED screen, control desk, operators and full technical rehearsal.",
    availableFrom: "2026-11-19", availableUntil: "2026-12-31",
    availabilityDates: ["2026-11-20","2026-11-28","2026-12-06","2026-12-13","2026-12-20","2026-12-26","2026-12-27"]
  },
  {
    key: "live", serviceId: "d1000000-0000-4000-8000-000000000006",
    email: "pactai-demo-live-2026@example.com", category: "Live Entertainment",
    name: "Northstar Live Collective", contact: "Ananya Sen",
    phone: "+91 98765 40006", city: "New Delhi",
    address: "Hauz Khas, New Delhi, India", price: 25000,
    rating: 4.9, years: "11 years",
    description: "A versatile live-performance collective offering polished acoustic sets, high-energy stage acts, emceeing and bespoke corporate show direction.",
    serviceName: "Live Gala Performance Set",
    serviceDescription: "A five-piece live ensemble, professional emcee, two performance sets and coordination with the event show caller.",
    availableFrom: "2026-11-20", availableUntil: "2026-12-31",
    availabilityDates: ["2026-11-22","2026-11-29","2026-12-05","2026-12-13","2026-12-21","2026-12-26","2026-12-27"]
  },
  {
    key: "security", serviceId: "d1000000-0000-4000-8000-000000000007",
    email: "pactai-demo-security-2026@example.com", category: "Event Security",
    name: "Sentinel Event Safety Services", contact: "Vikram Arora",
    phone: "+91 98765 40007", city: "New Delhi",
    address: "Connaught Place, New Delhi, India", price: 18000,
    rating: 4.7, years: "13 years",
    description: "A professional event-safety provider offering trained guest-flow stewards, access control, VIP movement coordination and incident-response planning.",
    serviceName: "Gala Event Safety & Access Control",
    serviceDescription: "Trained security supervisors, guest screening team, access-control desk, VIP movement coordination and event safety briefing.",
    availableFrom: "2026-11-15", availableUntil: "2026-12-31",
    availabilityDates: ["2026-11-21","2026-11-29","2026-12-06","2026-12-13","2026-12-19","2026-12-26","2026-12-27"]
  },
  {
    key: "rentals", serviceId: "d1000000-0000-4000-8000-000000000008",
    email: "pactai-demo-rentals-2026@example.com", category: "Luxury Rentals",
    name: "Velvet & Vine Luxury Rentals", contact: "Tara Malhotra",
    phone: "+91 98765 40008", city: "New Delhi",
    address: "MG Road, Sultanpur, New Delhi, India", price: 30000,
    rating: 4.8, years: "6 years",
    description: "A curated rental house for premium lounge furniture, statement dining, stage furniture, decorative objects and refined event table settings.",
    serviceName: "Signature Lounge & Furniture Collection",
    serviceDescription: "Premium lounge clusters, statement chairs, cocktail tables, stage furniture, delivery, installation and strike.",
    availableFrom: "2026-11-17", availableUntil: "2026-12-31",
    availabilityDates: ["2026-11-20","2026-11-27","2026-12-04","2026-12-13","2026-12-20","2026-12-26","2026-12-27"]
  }
] as const;

function resultOrThrow<T>(result: { data: T; error: { message: string } | null }, label: string): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function validEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function parseSellerEmails(): Record<string, string> {
  try {
    const parsed = JSON.parse(Deno.env.get("DEMO_PAYPAL_SELLERS") ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function getOrCreateDemoUser(admin: ReturnType<typeof createClient>, email: string, metadata: Record<string, unknown>) {
  const listed = resultOrThrow(
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    "List Supabase Auth users"
  );
  const existing = listed.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    if (existing.user_metadata?.pactai_demo_seed !== true) {
      throw new Error(`Refusing to reuse existing non-demo Auth user: ${email}`);
    }
    return existing;
  }

  const created = await admin.auth.admin.createUser({
    email,
    password: `${crypto.randomUUID()}-PactAI-Demo-2026!`,
    email_confirm: true,
    user_metadata: { ...metadata, pactai_demo_seed: true }
  });

  if (created.error || !created.data.user) {
    throw new Error(`Create demo Auth user ${email}: ${created.error?.message ?? "No user returned"}`);
  }
  return created.data.user;
}

async function countRows(admin: ReturnType<typeof createClient>, table: string, demoOnly = false) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  if (demoOnly) query = query.eq(table === "demo_payment_ledger" ? "is_simulated" : "is_demo", true);
  const response = await query;
  if (response.error) throw new Error(`Count ${table}: ${response.error.message}`);
  return response.count ?? 0;
}

// This function is intentionally safe to call on every app boot:
// it fills only empty tables, and re-upserts only the records it owns.
export async function seedDatabase(admin: ReturnType<typeof createClient>) {
  const summary: Record<string, unknown> = { vendors: 0, event: false, milestones: 0, ledgerRows: 0, skipped: [] as string[] };

  // Treat every application/demo table as an all-or-nothing seed boundary.
  // If real records already exist, leave every table untouched. If a previous
  // seed was interrupted, demo-only rows may be safely completed with upserts.
  const managedTables = [
    "vendor_profiles", "vendor_services", "customer_profiles", "customer_events",
    "enquiries", "bookings", "earnings", "demo_event_milestones", "demo_payment_ledger"
  ];
  for (const table of managedTables) {
    const totalRows = await countRows(admin, table);
    const demoRows = await countRows(admin, table, true);
    if (totalRows > demoRows) {
      (summary.skipped as string[]).push(
        `Seed skipped: ${table} already contains non-demo records. No existing records were changed.`
      );
      return summary;
    }
  }
  const profileCount = await countRows(admin, "vendor_profiles");
  const demoProfileCount = await countRows(admin, "vendor_profiles", true);
  const maySeedVendors = profileCount === 0 || demoProfileCount > 0;
  const sellerEmails = parseSellerEmails();
  const seededVendors: Array<{ source: typeof vendors[number]; userId: string }> = [];

  if (maySeedVendors) {
    for (const vendor of vendors) {
      const user = await getOrCreateDemoUser(admin, vendor.email, {
        role: "vendor",
        full_name: vendor.contact,
        business_name: vendor.name,
        category: vendor.category,
        city: vendor.city
      });

      const profile = {
        id: user.id,
        full_name: vendor.contact,
        business_name: vendor.name,
        phone: vendor.phone,
        category: vendor.category,
        city: vendor.city,
        description: vendor.description,
        address: vendor.address,
        service_locations: "New Delhi NCR",
        years_experience: vendor.years,
        is_published: true,
        approval_status: "approved",
        onboarding_complete: true,
        role: "vendor",
        rating: vendor.rating,
        paypal_merchant_email: validEmail(sellerEmails[vendor.category]),
        is_demo: true,
        updated_at: new Date().toISOString()
      };
      resultOrThrow(
        await admin.from("vendor_profiles").upsert(profile, { onConflict: "id" }).select("id").single(),
        `Save demo vendor profile ${vendor.name}`
      );

      const service = {
        id: vendor.serviceId,
        vendor_id: user.id,
        name: vendor.serviceName,
        category: vendor.category,
        description: vendor.serviceDescription,
        price: vendor.price,
        price_minor: vendor.price * 100,
        currency_code: "INR",
        minimum_price: Math.round(vendor.price * 0.9),
        available_from: vendor.availableFrom,
        available_until: vendor.availableUntil,
        availability_dates: [...vendor.availabilityDates],
        is_published: true,
        is_demo: true,
        updated_at: new Date().toISOString()
      };
      resultOrThrow(
        await admin.from("vendor_services").upsert(service, { onConflict: "id" }).select("id").single(),
        `Save demo service ${vendor.serviceName}`
      );
      seededVendors.push({ source: vendor, userId: user.id });
      summary.vendors = Number(summary.vendors) + 1;
    }
  } else {
    (summary.skipped as string[]).push("Vendor tables contain non-demo records; no demo vendors were inserted.");
    const { data, error } = await admin.from("vendor_profiles")
      .select("id,business_name,category")
      .eq("is_demo", true);
    if (error) throw new Error(`Read existing demo vendors: ${error.message}`);
    for (const profile of data ?? []) {
      const matched = vendors.find((vendor) => vendor.name === profile.business_name);
      if (matched) seededVendors.push({ source: matched, userId: profile.id });
    }
  }

  if (seededVendors.length !== vendors.length) {
    (summary.skipped as string[]).push("The complete eight-vendor demo event needs an empty vendor table or the existing PactAI demo vendors.");
    return summary;
  }

  const customerEventCount = await countRows(admin, "customer_events");
  const demoEventCount = await countRows(admin, "customer_events", true);
  if (customerEventCount !== 0 && demoEventCount === 0) {
    (summary.skipped as string[]).push("Customer events already exist and are not demo rows; the sample event was not inserted.");
    return summary;
  }

  const customer = await getOrCreateDemoUser(admin, DEMO_CUSTOMER_EMAIL, {
    role: "customer",
    full_name: "PactAI Demo Customer",
    city: "New Delhi"
  });
  resultOrThrow(
    await admin.from("customer_profiles").upsert({
      id: customer.id,
      full_name: "PactAI Demo Customer",
      phone: "+91 98765 40000",
      city: "New Delhi",
      is_demo: true
    }, { onConflict: "id" }).select("id").single(),
    "Save demo customer profile"
  );

  const totalMinor = vendors.reduce((total, vendor) => total + vendor.price * 100, 0);
  const depositMinor = Math.round(totalMinor * 0.3);
  const auditMinor = Math.round(totalMinor * 0.4);
  const finalMinor = totalMinor - depositMinor - auditMinor;
  const vendorByKey = new Map(seededVendors.map(({ source, userId }) => [source.key, { ...source, userId }]));
  const selections = vendors.map((vendor) => ({
    service_id: vendor.serviceId,
    vendor_id: vendorByKey.get(vendor.key)!.userId,
    proposed_price: vendor.price,
    message: "PactAI judge demo booking. This is seeded sample activity, not a vendor-accepted commercial contract."
  }));

  resultOrThrow(
    await admin.from("customer_events").upsert({
      id: DEMO_EVENT_ID,
      customer_id: customer.id,
      event_type: "corporate",
      city: "New Delhi",
      guest_count: 300,
      event_date: "2026-12-27",
      budget: totalMinor / 100,
      vision: "Annual Tech Gala 2026 — a premium year-end technology celebration for 300 guests, including keynote moments, dinner, live entertainment and a polished awards programme.",
      dates: {
        depositDate: "2026-12-13",
        auditDate: "2026-12-20",
        setupDate: "2026-12-26",
        eventDate: "2026-12-27",
        releaseDate: "2026-12-28"
      },
      selections,
      agreed_total: totalMinor / 100,
      status: "active",
      is_demo: true
    }, { onConflict: "id" }).select("id").single(),
    "Save Annual Tech Gala 2026"
  );
  summary.event = true;

  const milestoneRows = [
    { id: "d2000000-0000-4000-8000-000000000001", milestone_key: "deposit", title: "Deposit · 30%", starts_at: "2026-12-13T10:00:00+05:30", ends_at: "2026-12-13T13:00:00+05:30", status: "completed", amount_minor: depositMinor, assigned_vendor_ids: [] },
    { id: "d2000000-0000-4000-8000-000000000002", milestone_key: "midway_audit", title: "Midway audit · 40%", starts_at: "2026-12-20T11:00:00+05:30", ends_at: "2026-12-20T14:00:00+05:30", status: "scheduled", amount_minor: auditMinor, assigned_vendor_ids: seededVendors.map((item) => item.userId) },
    { id: "d2000000-0000-4000-8000-000000000003", milestone_key: "setup_window", title: "Vendor setup window", starts_at: "2026-12-26T08:00:00+05:30", ends_at: "2026-12-26T20:00:00+05:30", status: "scheduled", amount_minor: 0, assigned_vendor_ids: ["venue", "floral", "sound", "rentals"].map((key) => vendorByKey.get(key)!.userId) },
    { id: "d2000000-0000-4000-8000-000000000004", milestone_key: "event_day", title: "Annual Tech Gala 2026", starts_at: "2026-12-27T09:00:00+05:30", ends_at: "2026-12-27T23:00:00+05:30", status: "scheduled", amount_minor: totalMinor, assigned_vendor_ids: seededVendors.map((item) => item.userId) },
    { id: "d2000000-0000-4000-8000-000000000005", milestone_key: "final_release", title: "Final release · 30%", starts_at: "2026-12-28T10:00:00+05:30", ends_at: "2026-12-28T13:00:00+05:30", status: "pending", amount_minor: finalMinor, assigned_vendor_ids: [] }
  ].map((row) => ({ ...row, event_id: DEMO_EVENT_ID, is_demo: true }));

  resultOrThrow(
    await admin.from("demo_event_milestones").upsert(milestoneRows, { onConflict: "id" }),
    "Save demo event milestones"
  );
  summary.milestones = milestoneRows.length;

  const demoEnquiries = await countRows(admin, "enquiries", true);
  if (await countRows(admin, "enquiries") === 0 || demoEnquiries > 0) {
    const enquiryRows = vendors.map((vendor, index) => ({
      id: `d3000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      customer_id: customer.id,
      vendor_id: vendorByKey.get(vendor.key)!.userId,
      service_id: vendor.serviceId,
      customer_event_id: DEMO_EVENT_ID,
      event_date: "2026-12-27",
      message: `Annual Tech Gala 2026 · ${vendor.serviceName}. Demo enquiry for 300 guests. Please review the saved event schedule.`,
      proposed_price: vendor.price,
      status: "accepted",
      is_demo: true
    }));
    resultOrThrow(await admin.from("enquiries").upsert(enquiryRows, { onConflict: "id" }), "Save demo enquiries");
  } else {
    (summary.skipped as string[]).push("Enquiry table already contains non-demo records; demo enquiries were not inserted.");
  }

  const demoBookings = await countRows(admin, "bookings", true);
  if (await countRows(admin, "bookings") === 0 || demoBookings > 0) {
    const bookingRows = vendors.map((vendor, index) => ({
      id: `d4000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      enquiry_id: `d3000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      customer_id: customer.id,
      vendor_id: vendorByKey.get(vendor.key)!.userId,
      service_id: vendor.serviceId,
      event_date: "2026-12-27",
      scope: `Annual Tech Gala 2026 · ${vendor.serviceName}`,
      agreed_price: vendor.price,
      status: "confirmed",
      is_demo: true
    }));
    resultOrThrow(await admin.from("bookings").upsert(bookingRows, { onConflict: "id" }), "Save demo bookings");
    const earningRows = bookingRows.map((booking, index) => ({
      id: `d5000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      booking_id: booking.id,
      vendor_id: booking.vendor_id,
      gross_amount: booking.agreed_price,
      platform_fee: Math.round(booking.agreed_price * 0.05 * 100) / 100,
      status: "pending",
      is_demo: true
    }));
    resultOrThrow(await admin.from("earnings").upsert(earningRows, { onConflict: "id" }), "Save demo earnings");
  } else {
    (summary.skipped as string[]).push("Booking table already contains non-demo records; demo bookings and earnings were not inserted.");
  }

  const demoLedgerCount = await countRows(admin, "demo_payment_ledger", true);
  if (await countRows(admin, "demo_payment_ledger") === 0 || demoLedgerCount > 0) {
    const ledgerRows = [
      {
        id: "d6000000-0000-4000-8000-000000000001",
        milestone_id: milestoneRows[0].id,
        transaction_kind: "ORDER",
        milestone_key: "deposit",
        amount_minor: depositMinor,
        status: "COMPLETED",
        escrow_state: "SIMULATED_RELEASED",
        demo_reference: "DEMO-ORDER-PAC-2026-1201",
        notes: "Simulated Sandbox-style deposit entry. No PayPal order was created and no money moved."
      },
      {
        id: "d6000000-0000-4000-8000-000000000002",
        milestone_id: milestoneRows[1].id,
        transaction_kind: "ORDER",
        milestone_key: "midway_audit",
        amount_minor: auditMinor,
        status: "PENDING",
        escrow_state: "SIMULATED_HOLD",
        demo_reference: "DEMO-ORDER-PAC-2026-1202",
        notes: "Simulated midway milestone. The demo hold is not PayPal escrow and no funds are held."
      },
      {
        id: "d6000000-0000-4000-8000-000000000003",
        milestone_id: milestoneRows[4].id,
        transaction_kind: "ORDER",
        milestone_key: "final_release",
        amount_minor: finalMinor,
        status: "PENDING",
        escrow_state: "SIMULATED_HOLD",
        demo_reference: "DEMO-ORDER-PAC-2026-1203",
        notes: "Simulated final-release milestone. No PayPal order exists."
      },
      {
        id: "d6000000-0000-4000-8000-000000000004",
        milestone_id: milestoneRows[1].id,
        transaction_kind: "PAYOUT",
        milestone_key: "vendor_distribution",
        amount_minor: depositMinor,
        status: "PENDING",
        escrow_state: "NOT_ESCROW",
        demo_reference: "DEMO-BATCH-PAC-2026-1204",
        notes: "Simulated payout batch row for the dashboard. No PayPal Payouts batch was submitted."
      }
    ].map((row) => ({
      ...row,
      event_id: DEMO_EVENT_ID,
      vendor_id: null,
      currency_code: "INR",
      provider_order_id: null,
      provider_batch_id: null,
      is_simulated: true
    }));
    resultOrThrow(
      await admin.from("demo_payment_ledger").upsert(ledgerRows, { onConflict: "id" }),
      "Save simulated demo payment ledger"
    );
    summary.ledgerRows = ledgerRows.length;
  } else {
    (summary.skipped as string[]).push("Payment ledger already contains non-demo records; simulated rows were not inserted.");
  }

  return summary;
}

async function resetDemoDatabase(admin: ReturnType<typeof createClient>) {
  const demoUsersResponse = resultOrThrow(
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    "List Auth users before demo reset"
  );
  const demoUsers = demoUsersResponse.users.filter((user) => user.user_metadata?.pactai_demo_seed === true);

  for (const table of [
    "demo_payment_ledger",
    "demo_event_milestones",
    "earnings",
    "bookings",
    "enquiries",
    "customer_events",
    "customer_profiles",
    "vendor_services",
    "vendor_profiles"
  ]) {
    const column = table === "demo_payment_ledger" ? "is_simulated" : "is_demo";
    const { error } = await admin.from(table).delete().eq(column, true);
    if (error) throw new Error(`Reset ${table}: ${error.message}`);
  }

  for (const user of demoUsers) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`Delete demo Auth user ${user.email}: ${error.message}`);
  }

  return { deletedDemoUsers: demoUsers.length };
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Use POST." }), { status: 405, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEYS");
    if (!url || !secretKey) throw new Error("Supabase server credentials are missing from Edge Function secrets.");

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const body = await request.json().catch(() => ({}));
    const action = body?.action ?? "seed";

    if (action === "reset") {
      const expectedToken = Deno.env.get("DEMO_SEED_RESET_TOKEN");
      const providedToken = request.headers.get("x-demo-reset-token") ?? "";
      if (!expectedToken || !safeEqual(providedToken, expectedToken)) {
        return new Response(JSON.stringify({ error: "Reset token is missing or invalid." }), { status: 403, headers: corsHeaders });
      }
      const reset = await resetDemoDatabase(admin);
      const seeded = await seedDatabase(admin);
      return new Response(JSON.stringify({ ok: true, reset, seeded }), { status: 200, headers: corsHeaders });
    }

    if (action !== "seed") {
      return new Response(JSON.stringify({ error: "action must be 'seed' or 'reset'." }), { status: 400, headers: corsHeaders });
    }

    const seeded = await seedDatabase(admin);
    return new Response(JSON.stringify({ ok: true, seeded }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("PactAI demo seed failed:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown demo seed error." }), { status: 500, headers: corsHeaders });
  }
});
