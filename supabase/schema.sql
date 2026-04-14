-- Run this in your Supabase SQL Editor (or save as a migration)
-- Users are handled by Supabase Auth — this table extends them.

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hey_email text,
  default_timezone text not null default 'UTC',
  preferred_delivery text not null default 'hey_email'
    check (preferred_delivery in ('hey_email','download','gcal','apple')),
  plan text not null default 'free'
    check (plan in ('free','pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  notes text,
  delivery_mode text,
  created_at timestamptz not null default now()
);

create index if not exists event_history_user_created
  on event_history(user_id, created_at desc);

-- Row Level Security
alter table user_settings enable row level security;
alter table event_history enable row level security;

-- user_settings policies
create policy "users_select_own_settings" on user_settings
  for select using (auth.uid() = user_id);

create policy "users_insert_own_settings" on user_settings
  for insert with check (auth.uid() = user_id);

create policy "users_update_own_settings" on user_settings
  for update using (auth.uid() = user_id);

-- event_history policies
create policy "users_select_own_history" on event_history
  for select using (auth.uid() = user_id);

create policy "users_insert_own_history" on event_history
  for insert with check (auth.uid() = user_id);

-- Auto-update updated_at on user_settings
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_updated_at on user_settings;
create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
