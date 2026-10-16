create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Ready when you are',
  age_group text not null default 'prefer-not-to-say',
  day_description text not null default '',
  day_priorities jsonb not null default '[]'::jsonb,
  day_events jsonb not null default '[]'::jsonb,
  mode text not null default 'vigilante' check (mode in ('vigilante', 'shadow')),
  risk_tolerance numeric not null default 0.7 check (risk_tolerance between 0.1 and 1),
  backup_contacts jsonb not null default '[]'::jsonb,
  custom_situations jsonb not null default '[]'::jsonb,
  whatsapp_phone text not null default '',
  whatsapp_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text not null default 'Ready when you are';
alter table public.profiles add column if not exists age_group text not null default 'prefer-not-to-say';
alter table public.profiles add column if not exists day_description text not null default '';
alter table public.profiles add column if not exists day_priorities jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists day_events jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists whatsapp_phone text not null default '';
alter table public.profiles add column if not exists whatsapp_opt_in boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

grant select, insert, update, delete on public.profiles to authenticated;
