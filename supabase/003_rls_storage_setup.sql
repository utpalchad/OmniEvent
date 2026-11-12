-- PactAI / OmniEvent: vendor RLS and Storage policies
-- Run AFTER supabase/vendor_portal.sql in Supabase SQL Editor.
-- Safe to run again: policies and triggers are dropped/recreated by name.
-- Expected buckets: vendor-assets (public), service-images (public), vendor-private (private).

create extension if not exists pgcrypto;

-- Prevent a vendor from changing their own role, approval status, or profile identity.
-- An administrator using the Supabase dashboard / service role can still approve a vendor.
create or replace function public.prevent_vendor_privilege_changes()
returns trigger
language plpgsql
security invoker
as $$
begin
  if auth.uid() is not null then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.approval_status is distinct from old.approval_status then
      raise exception 'Vendor identity, role, and approval status cannot be changed by the vendor';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_vendor_privilege_changes on public.vendor_profiles;
create trigger prevent_vendor_privilege_changes
before update on public.vendor_profiles
for each row execute function public.prevent_vendor_privilege_changes();

-- Turn on row-level security for all application tables.
alter table public.vendor_profiles enable row level security;
alter table public.vendor_services enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.vendor_media enable row level security;
alter table public.enquiries enable row level security;
alter table public.bookings enable row level security;
alter table public.negotiation_messages enable row level security;
alter table public.earnings enable row level security;

-- Vendor profile access.
drop policy if exists "vendor profiles readable by owner or marketplace" on public.vendor_profiles;
drop policy if exists "vendors create own profile" on public.vendor_profiles;
drop policy if exists "vendors update own profile" on public.vendor_profiles;

create policy "vendor profiles readable by owner or marketplace"
on public.vendor_profiles for select to anon, authenticated
using (
  auth.uid() = id
  or (is_published = true and approval_status = 'approved')
);

create policy "vendors create own profile"
on public.vendor_profiles for insert to authenticated
with check (
  auth.uid() = id
  and role = 'vendor'::public.app_role
  and approval_status = 'pending'
);

create policy "vendors update own profile"
on public.vendor_profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Vendor services: owners manage their own rows; the public sees only
-- services belonging to an approved and published shop.
drop policy if exists "services readable by owner or marketplace" on public.vendor_services;
drop policy if exists "vendors insert own services" on public.vendor_services;
drop policy if exists "vendors update own services" on public.vendor_services;
drop policy if exists "vendors delete own services" on public.vendor_services;

create policy "services readable by owner or marketplace"
on public.vendor_services for select to anon, authenticated
using (
  auth.uid() = vendor_id
  or (
    is_published = true
    and exists (
      select 1 from public.vendor_profiles p
      where p.id = vendor_services.vendor_id
        and p.is_published = true
        and p.approval_status = 'approved'
    )
  )
);

create policy "vendors insert own services"
on public.vendor_services for insert to authenticated
with check (
  auth.uid() = vendor_id
  and exists (select 1 from public.vendor_profiles p where p.id = vendor_services.vendor_id)
);

create policy "vendors update own services"
on public.vendor_services for update to authenticated
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

create policy "vendors delete own services"
on public.vendor_services for delete to authenticated
using (auth.uid() = vendor_id);

-- Customer profiles.
drop policy if exists "customers manage own profile" on public.customer_profiles;
create policy "customers manage own profile"
on public.customer_profiles for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Vendor media metadata.
drop policy if exists "vendors manage own media" on public.vendor_media;
create policy "vendors manage own media"
on public.vendor_media for all to authenticated
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

-- Enquiries: a customer can contact an approved, published vendor/service.
drop policy if exists "customers create enquiries" on public.enquiries;
drop policy if exists "customers read own enquiries" on public.enquiries;
drop policy if exists "vendors read assigned enquiries" on public.enquiries;
drop policy if exists "vendors update assigned enquiries" on public.enquiries;

create policy "customers create enquiries"
on public.enquiries for insert to authenticated
with check (
  auth.uid() = customer_id
  and exists (
    select 1 from public.vendor_profiles p
    where p.id = enquiries.vendor_id
      and p.is_published = true
      and p.approval_status = 'approved'
  )
  and (
    service_id is null
    or exists (
      select 1 from public.vendor_services s
      where s.id = enquiries.service_id
        and s.vendor_id = enquiries.vendor_id
        and s.is_published = true
    )
  )
);

create policy "customers read own enquiries"
on public.enquiries for select to authenticated
using (auth.uid() = customer_id);

create policy "vendors read assigned enquiries"
on public.enquiries for select to authenticated
using (auth.uid() = vendor_id);

create policy "vendors update assigned enquiries"
on public.enquiries for update to authenticated
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

-- Bookings: only the customer who owns the enquiry can create a linked booking.
drop policy if exists "participants read bookings" on public.bookings;
drop policy if exists "customers create bookings" on public.bookings;
drop policy if exists "participants update bookings" on public.bookings;

create policy "participants read bookings"
on public.bookings for select to authenticated
using (auth.uid() = customer_id or auth.uid() = vendor_id);

create policy "customers create bookings"
on public.bookings for insert to authenticated
with check (
  auth.uid() = customer_id
  and exists (
    select 1 from public.enquiries e
    where e.id = bookings.enquiry_id
      and e.customer_id = auth.uid()
      and e.vendor_id = bookings.vendor_id
  )
);

create policy "participants update bookings"
on public.bookings for update to authenticated
using (auth.uid() = customer_id or auth.uid() = vendor_id)
with check (auth.uid() = customer_id or auth.uid() = vendor_id);

-- Negotiation messages: only the customer/vendor on the enquiry may read or write.
drop policy if exists "enquiry participants read messages" on public.negotiation_messages;
drop policy if exists "enquiry participants write messages" on public.negotiation_messages;

create policy "enquiry participants read messages"
on public.negotiation_messages for select to authenticated
using (
  exists (
    select 1 from public.enquiries e
    where e.id = negotiation_messages.enquiry_id
      and (e.customer_id = auth.uid() or e.vendor_id = auth.uid())
  )
);

create policy "enquiry participants write messages"
on public.negotiation_messages for insert to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1 from public.enquiries e
    where e.id = negotiation_messages.enquiry_id
      and (e.customer_id = auth.uid() or e.vendor_id = auth.uid())
  )
);

-- Earnings are read-only to the vendor who owns them.
drop policy if exists "vendors read own earnings" on public.earnings;
create policy "vendors read own earnings"
on public.earnings for select to authenticated
using (auth.uid() = vendor_id);

-- Remove the stale policy from the earlier script (it referred to a non-existent bucket).
drop policy if exists "vendors manage their media" on storage.objects;

-- Public images can be viewed by everyone. Upload/update/delete are limited
-- to objects whose first folder is the authenticated user's UUID.
drop policy if exists "public read vendor assets" on storage.objects;
drop policy if exists "owners insert vendor assets" on storage.objects;
drop policy if exists "owners update vendor assets" on storage.objects;
drop policy if exists "owners delete vendor assets" on storage.objects;
create policy "public read vendor assets" on storage.objects
for select to anon, authenticated using (bucket_id = 'vendor-assets');
create policy "owners insert vendor assets" on storage.objects
for insert to authenticated with check (
  bucket_id = 'vendor-assets' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners update vendor assets" on storage.objects
for update to authenticated using (
  bucket_id = 'vendor-assets' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'vendor-assets' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners delete vendor assets" on storage.objects
for delete to authenticated using (
  bucket_id = 'vendor-assets' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "public read service images" on storage.objects;
drop policy if exists "owners insert service images" on storage.objects;
drop policy if exists "owners update service images" on storage.objects;
drop policy if exists "owners delete service images" on storage.objects;
create policy "public read service images" on storage.objects
for select to anon, authenticated using (bucket_id = 'service-images');
create policy "owners insert service images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'service-images' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners update service images" on storage.objects
for update to authenticated using (
  bucket_id = 'service-images' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'service-images' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners delete service images" on storage.objects
for delete to authenticated using (
  bucket_id = 'service-images' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owners read private vendor documents" on storage.objects;
drop policy if exists "owners insert private vendor documents" on storage.objects;
drop policy if exists "owners update private vendor documents" on storage.objects;
drop policy if exists "owners delete private vendor documents" on storage.objects;
create policy "owners read private vendor documents" on storage.objects
for select to authenticated using (
  bucket_id = 'vendor-private' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners insert private vendor documents" on storage.objects
for insert to authenticated with check (
  bucket_id = 'vendor-private' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners update private vendor documents" on storage.objects
for update to authenticated using (
  bucket_id = 'vendor-private' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'vendor-private' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners delete private vendor documents" on storage.objects
for delete to authenticated using (
  bucket_id = 'vendor-private' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow the application roles to access the tables through the Supabase API.
grant select on public.vendor_profiles, public.vendor_services to anon, authenticated;
grant insert, update on public.vendor_profiles to authenticated;
grant insert, update, delete on public.vendor_services to authenticated;
grant select, insert, update, delete on public.customer_profiles, public.vendor_media to authenticated;
grant select, insert, update on public.enquiries, public.bookings to authenticated;
grant select, insert on public.negotiation_messages to authenticated;
grant select on public.earnings to authenticated;


-- Create the vendor profile automatically when a vendor signs up.
-- This is required when email confirmation is enabled and signup has no active session.
create or replace function public.create_vendor_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'role','') = 'vendor' then
    insert into public.vendor_profiles (
      id, full_name, business_name, phone, category, city, role, approval_status
    )
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Vendor'),
      coalesce(nullif(new.raw_user_meta_data->>'business_name',''), 'My Business'),
      coalesce(nullif(new.raw_user_meta_data->>'phone',''), ''),
      coalesce(nullif(new.raw_user_meta_data->>'category',''), 'Other'),
      coalesce(nullif(new.raw_user_meta_data->>'city',''), ''),
      'vendor'::public.app_role,
      'pending'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_vendor_profile on auth.users;
create trigger on_auth_user_created_vendor_profile
after insert on auth.users
for each row execute function public.create_vendor_profile_for_new_auth_user();
