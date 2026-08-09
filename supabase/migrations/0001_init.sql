-- Repair/maintenance report system (ระบบแจ้งซ่อม) — initial schema

create extension if not exists "pgcrypto";

create type report_status as enum ('pending', 'in_progress', 'done');

-- ── Reference data ──────────────────────────────────────────────

create table buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  name text not null,
  floor text,
  created_at timestamptz not null default now(),
  unique (building_id, name)
);

-- Staff accounts (linked to Supabase Auth users) who can see/manage the dashboard
create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- ── Reports ─────────────────────────────────────────────────────

create table reports (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id),
  room_id uuid not null references rooms(id),
  photo_path text not null, -- path inside the private "report-photos" storage bucket
  reporter_name text,
  ai_equipment_type text,   -- e.g. "แอร์", "หลอดไฟ" — filled in by vision analysis
  ai_description text,      -- what looks broken, per AI
  ai_confidence numeric(3,2),
  status report_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references staff(id)
);

create index reports_status_idx on reports(status);
create index reports_created_at_idx on reports(created_at desc);
create index reports_building_room_idx on reports(building_id, room_id);

-- Append-only trail for the Timeline view
create table report_status_history (
  id bigserial primary key,
  report_id uuid not null references reports(id) on delete cascade,
  status report_status not null,
  changed_by uuid references staff(id),
  changed_at timestamptz not null default now()
);

create index report_status_history_report_idx on report_status_history(report_id);

-- Keep updated_at fresh, stamp resolved_at, and log every status change
create function handle_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'done' then
      new.resolved_at := now();
    else
      new.resolved_at := null;
    end if;

    insert into report_status_history (report_id, status, changed_by)
    values (new.id, new.status, new.resolved_by);
  end if;

  return new;
end;
$$;

create trigger reports_before_update
  before update on reports
  for each row
  execute function handle_report_status_change();

create function log_initial_report_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into report_status_history (report_id, status)
  values (new.id, new.status);
  return new;
end;
$$;

create trigger reports_after_insert_history
  after insert on reports
  for each row
  execute function log_initial_report_status();

-- ── Row Level Security ──────────────────────────────────────────

alter table buildings enable row level security;
alter table rooms enable row level security;
alter table staff enable row level security;
alter table reports enable row level security;
alter table report_status_history enable row level security;

-- buildings / rooms: anyone can read (needed for the public report form's
-- building/room picker), only staff can manage the reference data.
create policy "buildings are publicly readable"
  on buildings for select
  using (true);

create policy "staff manage buildings"
  on buildings for all
  using (exists (select 1 from staff where id = auth.uid()))
  with check (exists (select 1 from staff where id = auth.uid()));

create policy "rooms are publicly readable"
  on rooms for select
  using (true);

create policy "staff manage rooms"
  on rooms for all
  using (exists (select 1 from staff where id = auth.uid()))
  with check (exists (select 1 from staff where id = auth.uid()));

-- staff: only staff can see the staff list; no public access at all.
create policy "staff can read staff list"
  on staff for select
  using (exists (select 1 from staff where id = auth.uid()));

-- reports: the public can only INSERT (submit a new report) — never read,
-- update, or delete. Staff can do everything, which is what the realtime
-- dashboard runs as.
create policy "anyone can submit a report"
  on reports for insert
  with check (true);

create policy "staff can read all reports"
  on reports for select
  using (exists (select 1 from staff where id = auth.uid()));

create policy "staff can update reports"
  on reports for update
  using (exists (select 1 from staff where id = auth.uid()))
  with check (exists (select 1 from staff where id = auth.uid()));

-- report_status_history: staff-only read; writes happen only via the trigger
-- (SECURITY DEFINER), so no insert/update/delete policy is needed for users.
create policy "staff can read report history"
  on report_status_history for select
  using (exists (select 1 from staff where id = auth.uid()));

-- ── Realtime ────────────────────────────────────────────────────

alter publication supabase_realtime add table reports;
