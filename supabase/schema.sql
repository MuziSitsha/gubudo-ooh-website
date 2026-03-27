create extension if not exists pgcrypto;

create table if not exists public.rider_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  full_name text not null,
  phone text not null,
  email text not null,
  id_number text not null,
  platform text not null,
  bike_type text not null,
  bike_age text not null,
  condition text not null,
  routes text,
  area text not null,
  activity_zone text not null default 'Other Gauteng',
  traffic_potential text not null default 'Low' check (traffic_potential in ('High', 'Medium', 'Low')),
  hours text not null,
  quality_score integer not null default 0,
  score_tag text not null default 'Standard review',
  minimum_standard_passed boolean not null default false,
  minimum_standard_reason text,
  bike_photo_name text,
  rider_photo_name text,
  bike_photo_path text,
  rider_photo_path text,
  bike_photo_url text,
  rider_photo_url text,
  verified_phone boolean not null default false,
  verified_at timestamptz,
  typeform_response_id text,
  source text not null default 'website',
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected'))
);

drop index if exists rider_applications_typeform_response_id_idx;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rider_applications_typeform_response_id_key'
      and conrelid = 'public.rider_applications'::regclass
  ) then
    alter table public.rider_applications
    add constraint rider_applications_typeform_response_id_key unique (typeform_response_id);
  end if;
end $$;

create table if not exists public.application_photo_uploads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  typeform_response_id text not null unique,
  bike_photo_name text,
  rider_photo_name text,
  bike_photo_path text,
  rider_photo_path text,
  bike_photo_url text,
  rider_photo_url text,
  status text not null default 'Pending' check (status in ('Pending', 'Linked'))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists rider_applications_set_updated_at on public.rider_applications;

create trigger rider_applications_set_updated_at
before update on public.rider_applications
for each row
execute function public.set_updated_at();

drop trigger if exists application_photo_uploads_set_updated_at on public.application_photo_uploads;

create trigger application_photo_uploads_set_updated_at
before update on public.application_photo_uploads
for each row
execute function public.set_updated_at();

alter table public.rider_applications enable row level security;
alter table public.application_photo_uploads enable row level security;

drop policy if exists "Public can insert rider applications" on public.rider_applications;
create policy "Public can insert rider applications"
on public.rider_applications
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated admins can view rider applications" on public.rider_applications;
create policy "Authenticated admins can view rider applications"
on public.rider_applications
for select
to authenticated
using (true);

drop policy if exists "Authenticated admins can update rider applications" on public.rider_applications;
create policy "Authenticated admins can update rider applications"
on public.rider_applications
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Public can insert photo uploads" on public.application_photo_uploads;
create policy "Public can insert photo uploads"
on public.application_photo_uploads
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can upsert photo uploads" on public.application_photo_uploads;
create policy "Public can update own photo uploads by response id"
on public.application_photo_uploads
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can view photo uploads" on public.application_photo_uploads;
create policy "Authenticated admins can view photo uploads"
on public.application_photo_uploads
for select
to authenticated
using (true);

drop policy if exists "Authenticated admins can update photo uploads" on public.application_photo_uploads;
create policy "Authenticated admins can update photo uploads"
on public.application_photo_uploads
for update
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('Rider Photos', 'Rider Photos', true)
on conflict (id) do nothing;

drop policy if exists "Public can view rider photos" on storage.objects;
create policy "Public can view rider photos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'Rider Photos');

drop policy if exists "Public can upload rider photos" on storage.objects;
create policy "Public can upload rider photos"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'Rider Photos');

drop policy if exists "Authenticated users can update rider photos" on storage.objects;
create policy "Authenticated users can update rider photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'Rider Photos')
with check (bucket_id = 'Rider Photos');

drop policy if exists "Authenticated users can delete rider photos" on storage.objects;
create policy "Authenticated users can delete rider photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'Rider Photos');