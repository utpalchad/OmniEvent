-- PactAI AI negotiator migration 005
-- Run after vendor_portal.sql, 003_rls_storage_setup.sql and 004_customer_event_enquiries.sql.
-- Vendor-defined minimum prices are private. The public marketplace view does not expose them.

alter table public.vendor_services
  add column if not exists minimum_price numeric;

-- Existing listings are not discountable until the vendor explicitly sets a minimum.
update public.vendor_services set minimum_price = price where minimum_price is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vendor_services_minimum_price_check'
      and conrelid = 'public.vendor_services'::regclass
  ) then
    alter table public.vendor_services
      add constraint vendor_services_minimum_price_check
      check (minimum_price is null or (minimum_price >= 0 and minimum_price <= price));
  end if;
end $$;

alter table public.enquiries add column if not exists proposed_price numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'enquiries_proposed_price_check'
      and conrelid = 'public.enquiries'::regclass
  ) then
    alter table public.enquiries
      add constraint enquiries_proposed_price_check
      check (proposed_price is null or proposed_price >= 0);
  end if;
end $$;

-- Server-side usage limiter. Only the Edge Function's service key can access this table.
create table if not exists public.ai_negotiation_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ai_negotiation_requests_customer_created_idx
  on public.ai_negotiation_requests(customer_id, created_at desc);
alter table public.ai_negotiation_requests enable row level security;
revoke all on public.ai_negotiation_requests from anon, authenticated;
grant all on public.ai_negotiation_requests to service_role;

create or replace function public.submit_customer_event(p_event jsonb, p_selections jsonb)
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
  v_proposed_price numeric;
begin
  if v_customer_id is null then raise exception 'Sign in before sending vendor enquiries'; end if;
  if not exists (select 1 from public.customer_profiles cp where cp.id = v_customer_id) then
    raise exception 'A customer account is required to send vendor enquiries';
  end if;
  if p_event is null or jsonb_typeof(p_event) <> 'object' then raise exception 'Event details are missing'; end if;
  if p_selections is null or jsonb_typeof(p_selections) <> 'array'
     or jsonb_array_length(p_selections) = 0 or jsonb_array_length(p_selections) > 12 then
    raise exception 'Select between one and twelve published services';
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
    v_proposed_price := nullif(v_item->>'proposed_price','')::numeric;

    if not exists (
      select 1 from public.vendor_services s
      join public.vendor_profiles p on p.id = s.vendor_id
      where s.id = v_service_id and s.vendor_id = v_vendor_id
        and s.is_published = true and p.is_published = true and p.approval_status = 'approved'
        and (v_proposed_price is null or v_proposed_price between coalesce(s.minimum_price, s.price) and s.price)
    ) then
      raise exception 'A selected service is unavailable or the proposed price is outside the vendor-approved range';
    end if;

    insert into public.enquiries (
      customer_id, vendor_id, service_id, customer_event_id,
      event_date, message, proposed_price, status
    )
    values (v_customer_id, v_vendor_id, v_service_id, v_event_id,
      v_event_date, v_message, v_proposed_price, 'new');
  end loop;
  return v_event_id;
end;
$$;

revoke all on function public.submit_customer_event(jsonb, jsonb) from public;
grant execute on function public.submit_customer_event(jsonb, jsonb) to authenticated;
