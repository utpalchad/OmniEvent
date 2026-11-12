-- PactAI demo seed schema (migration 006)
-- Safe additions for the judge-ready demo. Existing user-owned rows are never
-- converted into demo rows. Supabase Edge Function service role performs seeding.

-- Extend existing profile/service records with demo presentation metadata.
alter table public.vendor_profiles
  add column if not exists rating numeric(2,1),
  add column if not exists paypal_merchant_email text,
  add column if not exists is_demo boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vendor_profiles_rating_check'
      and conrelid = 'public.vendor_profiles'::regclass
  ) then
    alter table public.vendor_profiles
      add constraint vendor_profiles_rating_check
      check (rating is null or rating between 0 and 5);
  end if;
end $$;

alter table public.vendor_services
  add column if not exists price_minor bigint,
  add column if not exists currency_code text not null default 'INR',
  add column if not exists available_from date,
  add column if not exists available_until date,
  add column if not exists availability_dates date[] not null default '{}'::date[],
  add column if not exists is_demo boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vendor_services_price_minor_check'
      and conrelid = 'public.vendor_services'::regclass
  ) then
    alter table public.vendor_services
      add constraint vendor_services_price_minor_check
      check (price_minor is null or price_minor >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'vendor_services_availability_range_check'
      and conrelid = 'public.vendor_services'::regclass
  ) then
    alter table public.vendor_services
      add constraint vendor_services_availability_range_check
      check (available_until is null or available_from is null or available_until >= available_from);
  end if;
end $$;

-- Mark demo-only records so the reset operation can target them precisely.
alter table public.customer_profiles
  add column if not exists is_demo boolean not null default false;
alter table public.customer_events
  add column if not exists is_demo boolean not null default false;
alter table public.enquiries
  add column if not exists is_demo boolean not null default false;
alter table public.bookings
  add column if not exists is_demo boolean not null default false;
alter table public.earnings
  add column if not exists is_demo boolean not null default false;

-- The customer event schema previously allowed only requests_sent/cancelled/completed.
alter table public.customer_events
  drop constraint if exists customer_events_status_check;
alter table public.customer_events
  add constraint customer_events_status_check
  check (status in ('requests_sent', 'active', 'cancelled', 'completed'));

-- Add rating/price/availability to the public marketplace projection. Do not expose
-- paypal_merchant_email or vendors' private minimum prices in this view.
drop view if exists public.marketplace_services;
create view public.marketplace_services as
select
  s.id, s.vendor_id, s.name, s.category, s.description, s.price,
  s.price_minor, s.currency_code, s.available_from, s.available_until,
  s.availability_dates, s.created_at,
  p.business_name, p.city, p.logo_url, p.cover_url, p.rating
from public.vendor_services s
join public.vendor_profiles p on p.id = s.vendor_id
where s.is_published = true
  and p.is_published = true
  and p.approval_status = 'approved';

grant select on public.marketplace_services to anon, authenticated;

-- Timeline rows used by the Bryntum Scheduler demo.
create table if not exists public.demo_event_milestones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.customer_events(id) on delete cascade,
  milestone_key text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  assigned_vendor_ids uuid[] not null default '{}'::uuid[],
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, milestone_key),
  check (ends_at >= starts_at)
);

create index if not exists demo_event_milestones_event_start_idx
  on public.demo_event_milestones(event_id, starts_at);

alter table public.demo_event_milestones enable row level security;
drop policy if exists "public can read demo event milestones" on public.demo_event_milestones;
create policy "public can read demo event milestones"
  on public.demo_event_milestones for select to anon, authenticated
  using (is_demo = true);
grant select on public.demo_event_milestones to anon, authenticated;
revoke insert, update, delete on public.demo_event_milestones from anon, authenticated;
grant all on public.demo_event_milestones to service_role;

-- Clearly labelled demo ledger. Provider IDs stay NULL until PayPal actually
-- creates an order or payout batch. demo_reference is NOT a PayPal reference.
create table if not exists public.demo_payment_ledger (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.customer_events(id) on delete cascade,
  milestone_id uuid references public.demo_event_milestones(id) on delete set null,
  vendor_id uuid references public.vendor_profiles(id) on delete set null,
  transaction_kind text not null check (transaction_kind in ('ORDER', 'PAYOUT')),
  milestone_key text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency_code text not null default 'INR',
  status text not null check (status in ('COMPLETED', 'PENDING')),
  escrow_state text not null check (escrow_state in ('SIMULATED_HOLD', 'SIMULATED_RELEASED', 'NOT_ESCROW')),
  demo_reference text not null unique,
  provider_order_id text,
  provider_batch_id text,
  notes text not null default '',
  is_simulated boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists demo_payment_ledger_event_created_idx
  on public.demo_payment_ledger(event_id, created_at desc);

alter table public.demo_payment_ledger enable row level security;
drop policy if exists "public can read simulated demo transactions" on public.demo_payment_ledger;
create policy "public can read simulated demo transactions"
  on public.demo_payment_ledger for select to anon, authenticated
  using (is_simulated = true);
grant select on public.demo_payment_ledger to anon, authenticated;
revoke insert, update, delete on public.demo_payment_ledger from anon, authenticated;
grant all on public.demo_payment_ledger to service_role;

create index if not exists vendor_profiles_demo_idx on public.vendor_profiles(is_demo);
create index if not exists vendor_services_demo_idx on public.vendor_services(is_demo);
create index if not exists customer_events_demo_idx on public.customer_events(is_demo);
