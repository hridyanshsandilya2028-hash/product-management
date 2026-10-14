create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'vigilante' check (mode in ('vigilante', 'shadow')),
  risk_tolerance numeric not null default 0.7 check (risk_tolerance between 0.1 and 1),
  backup_contacts jsonb not null default '[]'::jsonb,
  custom_situations jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

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
