-- PactAI customer event + enquiry persistence (migration 004)
-- Run after vendor_portal.sql and 003_rls_storage_setup.sql.

create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  city text not null,
  guest_count integer,
  event_date date,
  budget numeric,
  vision text default '',
  dates jsonb not null default '{}'::jsonb,
  selections jsonb not null default '[]'::jsonb,
  agreed_total numeric not null default 0,
  status text not null default 'requests_sent'
    check (status in ('requests_sent','cancelled','completed')),
  created_at timestamptz not null default now()
);

alter table public.enquiries
  add column if not exists customer_event_id uuid
  references public.customer_events(id) on delete set null;

create index if not exists customer_events_customer_idx
  on public.customer_events(customer_id, created_at desc);
create index if not exists enquiries_event_idx
  on public.enquiries(customer_event_id);

alter table public.customer_events enable row level security;

drop policy if exists "customers read own events" on public.customer_events;
create policy "customers read own events"
  on public.customer_events for select to authenticated
  using (auth.uid() = customer_id);

grant select on public.customer_events to authenticated;

-- Customers' profiles are created by a database trigger. This is reliable
-- even when email confirmation means signUp returns no authenticated session.
create or replace function public.create_customer_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'role','') = 'customer' then
    insert into public.customer_profiles (id, full_name, phone, city)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Customer'),
      nullif(new.raw_user_meta_data->>'phone',''),
      nullif(new.raw_user_meta_data->>'city','')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_customer_profile on auth.users;
create trigger on_auth_user_created_customer_profile
after insert on auth.users
for each row execute function public.create_customer_profile_for_new_auth_user();

-- One transactional operation: create the customer's event and vendor enquiries.
-- It validates every service against the live, approved marketplace before inserting.
create or replace function public.submit_customer_event(
  p_event jsonb,
  p_selections jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid := auth.uid();
  v_event_id uuid;
  v_item jsonb;
  v_service_id uuid;
  v_vendor_id uuid;
  v_event_date date;
  v_message text;
begin
  if v_customer_id is null then
    raise exception 'Sign in before sending vendor enquiries';
  end if;

  if p_event is null or jsonb_typeof(p_event) <> 'object' then
    raise exception 'Event details are missing';
  end if;

  if p_selections is null
     or jsonb_typeof(p_selections) <> 'array'
     or jsonb_array_length(p_selections) = 0 then
    raise exception 'Select at least one published service';
  end if;

  v_event_date := nullif(p_event->>'event_date','')::date;

  insert into public.customer_events (
    customer_id, event_type, city, guest_count, event_date,
    budget, vision, dates, selections, agreed_total, status
  )
  values (
    v_customer_id,
    coalesce(nullif(p_event->>'event_type',''), 'event'),
    coalesce(nullif(p_event->>'city',''), ''),
    nullif(p_event->>'guest_count','')::integer,
    v_event_date,
    nullif(p_event->>'budget','')::numeric,
    coalesce(p_event->>'vision',''),
    coalesce(p_event->'dates','{}'::jsonb),
    p_selections,
    coalesce(nullif(p_event->>'agreed_total','')::numeric, 0),
    'requests_sent'
  )
  returning id into v_event_id;

  for v_item in select value from jsonb_array_elements(p_selections)
  loop
    v_service_id := (v_item->>'service_id')::uuid;
    v_vendor_id := (v_item->>'vendor_id')::uuid;
    v_message := coalesce(nullif(v_item->>'message',''), 'Please contact me about this event.');

    if not exists (
      select 1
      from public.vendor_services s
      join public.vendor_profiles p on p.id = s.vendor_id
      where s.id = v_service_id
        and s.vendor_id = v_vendor_id
        and s.is_published = true
        and p.is_published = true
        and p.approval_status = 'approved'
    ) then
      raise exception 'A selected service is no longer available in the marketplace';
    end if;

    insert into public.enquiries (
      customer_id, vendor_id, service_id, customer_event_id,
      event_date, message, status
    )
    values (
      v_customer_id, v_vendor_id, v_service_id, v_event_id,
      v_event_date, v_message, 'new'
    );
  end loop;

  return v_event_id;
end;
$$;

revoke all on function public.submit_customer_event(jsonb, jsonb) from public;
grant execute on function public.submit_customer_event(jsonb, jsonb) to authenticated;
