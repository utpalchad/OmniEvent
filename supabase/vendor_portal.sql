-- PactAI Supabase migration 002: production vendor marketplace backend.
-- Run in Supabase SQL Editor or with Supabase CLI migrations.
create extension if not exists pgcrypto;

create table if not exists public.vendor_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, business_name text not null, phone text not null,
  category text not null, city text not null, description text default '',
  address text default '', service_locations text default '', years_experience text default '',
  instagram_url text default '', website_url text default '', is_published boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.vendor_services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles(id) on delete cascade,
  name text not null, category text not null, description text default '',
  price numeric not null check(price >= 0), is_published boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

do $$ begin
  create type public.app_role as enum ('customer','vendor','admin');
exception when duplicate_object then null; end $$;

alter table public.vendor_profiles add column if not exists role public.app_role default 'vendor';
alter table public.vendor_profiles add column if not exists onboarding_complete boolean default false;
alter table public.vendor_profiles add column if not exists approval_status text default 'pending' check (approval_status in ('pending','approved','rejected'));
alter table public.vendor_profiles add column if not exists logo_url text;
alter table public.vendor_profiles add column if not exists cover_url text;

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, city text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.vendor_media (
  id uuid primary key default gen_random_uuid(), vendor_id uuid not null references public.vendor_profiles(id) on delete cascade,
  storage_path text not null, media_type text not null check(media_type in ('logo','cover','portfolio','service')),
  service_id uuid references public.vendor_services(id) on delete cascade, created_at timestamptz not null default now()
);
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles(id) on delete cascade, service_id uuid references public.vendor_services(id) on delete set null,
  event_date date, message text not null, status text not null default 'new' check(status in ('new','responded','accepted','declined','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(), enquiry_id uuid unique references public.enquiries(id) on delete set null,
  customer_id uuid not null references auth.users(id) on delete cascade, vendor_id uuid not null references public.vendor_profiles(id) on delete cascade,
  service_id uuid references public.vendor_services(id) on delete set null, event_date date not null, scope text default '',
  agreed_price numeric not null check(agreed_price >= 0), status text not null default 'requested' check(status in ('requested','confirmed','completed','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.negotiation_messages (
  id uuid primary key default gen_random_uuid(), enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade, message text not null, offered_price numeric check(offered_price is null or offered_price >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(), booking_id uuid unique not null references public.bookings(id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles(id) on delete cascade, gross_amount numeric not null check(gross_amount >= 0),
  platform_fee numeric not null default 0 check(platform_fee >= 0), status text not null default 'pending' check(status in ('pending','earned','paid')),
  created_at timestamptz not null default now()
);

drop policy if exists "customers read published shops" on public.vendor_profiles;
drop policy if exists "customers read published services" on public.vendor_services;
drop policy if exists "vendors manage own profile" on public.vendor_profiles;
drop policy if exists "vendors manage own services" on public.vendor_services;

create or replace view public.marketplace_services as
select s.id, s.vendor_id, s.name, s.category, s.description, s.price, s.created_at,
       p.business_name, p.city, p.logo_url, p.cover_url
from public.vendor_services s join public.vendor_profiles p on p.id=s.vendor_id
where s.is_published and p.is_published and p.approval_status='approved';

create index if not exists enquiries_vendor_idx on public.enquiries(vendor_id,status);
create index if not exists enquiries_customer_idx on public.enquiries(customer_id,created_at desc);
create index if not exists bookings_vendor_idx on public.bookings(vendor_id,status);
create index if not exists bookings_customer_idx on public.bookings(customer_id,status);
create index if not exists services_marketplace_idx on public.vendor_services(category,is_published);

create or replace function public.touch_updated_at() returns trigger language plpgsql security invoker as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists customer_profiles_touch on public.customer_profiles;
create trigger customer_profiles_touch before update on public.customer_profiles for each row execute function public.touch_updated_at();
drop trigger if exists enquiries_touch on public.enquiries;
create trigger enquiries_touch before update on public.enquiries for each row execute function public.touch_updated_at();
drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();

alter table public.customer_profiles enable row level security;
alter table public.vendor_media enable row level security;
alter table public.enquiries enable row level security;
alter table public.bookings enable row level security;
alter table public.negotiation_messages enable row level security;
alter table public.earnings enable row level security;

do $$ declare t text; begin
  foreach t in array array['customer_profiles','vendor_media','enquiries','bookings','negotiation_messages','earnings'] loop
    execute format('drop policy if exists "self access" on public.%I',t);
  end loop;
end $$;
create policy "customers manage own profile" on public.customer_profiles for all using(auth.uid()=id) with check(auth.uid()=id);
create policy "vendors manage own media" on public.vendor_media for all using(auth.uid()=vendor_id) with check(auth.uid()=vendor_id);
create policy "customers create enquiries" on public.enquiries for insert with check(auth.uid()=customer_id);
create policy "customers read own enquiries" on public.enquiries for select using(auth.uid()=customer_id);
create policy "vendors read and update assigned enquiries" on public.enquiries for select using(auth.uid()=vendor_id);
create policy "vendors update assigned enquiries" on public.enquiries for update using(auth.uid()=vendor_id) with check(auth.uid()=vendor_id);
create policy "participants read bookings" on public.bookings for select using(auth.uid()=customer_id or auth.uid()=vendor_id);
create policy "customers create bookings" on public.bookings for insert with check(auth.uid()=customer_id);
create policy "participants update bookings" on public.bookings for update using(auth.uid()=customer_id or auth.uid()=vendor_id);
create policy "enquiry participants read messages" on public.negotiation_messages for select using(exists(select 1 from public.enquiries e where e.id=enquiry_id and (e.customer_id=auth.uid() or e.vendor_id=auth.uid())));
create policy "enquiry participants write messages" on public.negotiation_messages for insert with check(auth.uid()=author_id and exists(select 1 from public.enquiries e where e.id=enquiry_id and (e.customer_id=auth.uid() or e.vendor_id=auth.uid())));
create policy "vendors read own earnings" on public.earnings for select using(auth.uid()=vendor_id);
grant select on public.marketplace_services to anon, authenticated;
grant select,insert,update,delete on public.vendor_profiles,public.vendor_services to authenticated;
grant select,insert,update,delete on public.customer_profiles,public.vendor_media,public.enquiries,public.bookings,public.negotiation_messages,public.earnings to authenticated;

-- Storage bucket and policies: create the bucket in Dashboard first, then run these.
drop policy if exists "vendors manage their media" on storage.objects;
create policy "vendors manage their media" on storage.objects for all using(bucket_id='vendor-media' and auth.uid()::text=(storage.foldername(name))[1]) with check(bucket_id='vendor-media' and auth.uid()::text=(storage.foldername(name))[1]);
