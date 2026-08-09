-- Structure carried over from the legacy PHP system:
-- 5 service categories, assigned technician, and reporter contact phone.

create table service_types (
  id smallint primary key,
  name text not null unique
);

-- IDs match the legacy <select> values so old reports can be migrated 1:1.
insert into service_types (id, name) values
  (1, 'งานซ่อมแซมครุภัณฑ์สุขาภิบาล'),
  (2, 'งานซ่อมแซมครุภัณฑ์ไฟฟ้า'),
  (3, 'งานซ่อมแซมเครื่องปรับอากาศ'),
  (4, 'งานซ่อมแซมอาคาร'),
  (5, 'งานซ่อมแซมครุภัณฑ์สำนักงาน')
on conflict (id) do nothing;

alter table service_types enable row level security;

-- The public report form needs the list for its picker.
create policy "service types are publicly readable"
  on service_types for select
  using (true);

create policy "staff manage service types"
  on service_types for all
  using (exists (select 1 from staff where id = auth.uid()))
  with check (exists (select 1 from staff where id = auth.uid()));

alter table reports
  add column if not exists service_type_id smallint references service_types(id),
  add column if not exists contact_phone text,
  add column if not exists assigned_to uuid references staff(id),
  -- AI-assessed urgency per the research scope (Critical/High/Medium/Low)
  add column if not exists urgency text
    check (urgency in ('critical', 'high', 'medium', 'low'));

create index if not exists reports_service_type_idx on reports(service_type_id);
create index if not exists reports_assigned_to_idx on reports(assigned_to);
