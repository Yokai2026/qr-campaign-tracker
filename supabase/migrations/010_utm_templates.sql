-- UTM Templates: reusable UTM parameter presets
create table if not exists utm_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table utm_templates enable row level security;

create policy "Users can view own utm templates"
  on utm_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert own utm templates"
  on utm_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own utm templates"
  on utm_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete own utm templates"
  on utm_templates for delete
  using (auth.uid() = user_id);
