-- 0013: เปลี่ยน "อาคาร" เป็น "หน่วยงาน" และเพิ่มรายชื่อผู้รับผิดชอบงานซ่อม
--
-- 1) ใช้ตาราง buildings เดิมเก็บหน่วยงาน (ใบแจ้งเก่ายังอ้างอิงได้)
--    เพิ่ม active สำหรับซ่อนรายการที่เลิกใช้แต่มีใบแจ้งเดิมอ้างอิงอยู่ ซึ่งลบไม่ได้
-- 2) technicians = รายชื่อผู้รับผิดชอบงานซ่อม ไม่ต้องมีบัญชีเข้าระบบ
--    รายชื่อจริงเพิ่มผ่าน SQL Editor หรือหน้าจัดการในแดชบอร์ด ไม่เก็บไว้ใน repo
--    เพราะ repo นี้เป็นสาธารณะ
-- 3) ใบแจ้งอ้างผู้รับผิดชอบด้วย technician_id แทน assigned_to (บัญชีเจ้าหน้าที่)

alter table buildings add column if not exists active boolean not null default true;

update buildings set name = 'งานทะเบียนและประมวลผล'
  where name = 'งานทะเบียน'
    and not exists (select 1 from buildings where name = 'งานทะเบียนและประมวลผล');
update buildings set name = 'ศูนย์ปฏิบัติการทางวิทยาศาสตร์และเครื่องมือกลาง'
  where name = 'ศูนย์ปฏิบัติการวิทยาศาสตร์และเครื่องมือกลาง'
    and not exists (select 1 from buildings where name = 'ศูนย์ปฏิบัติการทางวิทยาศาสตร์และเครื่องมือกลาง');

insert into buildings (name) values
  ('งานยุทธศาสตร์และการพัฒนาองค์กร'),
  ('งานบริหารและพัฒนาทรัพยากรมนุษย์'),
  ('งานคลัง'),
  ('งานบริหารทรัพย์สิน'),
  ('งานสนับสนุนวิชาการ'),
  ('งานพัฒนานักศึกษาและศิษย์เก่าสัมพันธ์'),
  ('งานทะเบียนและประมวลผล'),
  ('ศูนย์สนเทศและการเรียนรู้'),
  ('ศูนย์ปฏิบัติการทางวิทยาศาสตร์และเครื่องมือกลาง'),
  ('คณะวิทยาศาสตร์และเทคโนโลยีอุตสาหกรรม'),
  ('คณะศิลปศาสตร์และวิทยาการจัดการ'),
  ('ศูนย์บริการวิชาการ'),
  ('ศูนย์การจัดการโรงแรม ที่พัก และหอพัก'),
  ('ศูนย์กีฬาและสุขภาพ'),
  ('งานพัสดุ'),
  ('งานโครงสร้างกายภาพและวิศวกรรม'),
  ('งานวิจัย บัณฑิตศึกษา และวิเทศสัมพันธ์'),
  ('สำนักงานวิทยาเขตสุราษฎร์ธานี'),
  ('คณะนวัตกรรมการเกษตร ประมง และอาหาร')
on conflict (name) do nothing;

-- รายการที่ไม่อยู่ในรายชื่อหน่วยงานถูกซ่อนจากหน้าแจ้งซ่อม ใบแจ้งเดิมยังอ้างอิงได้
update buildings set active = name in (
  ('งานยุทธศาสตร์และการพัฒนาองค์กร'),
  ('งานบริหารและพัฒนาทรัพยากรมนุษย์'),
  ('งานคลัง'),
  ('งานบริหารทรัพย์สิน'),
  ('งานสนับสนุนวิชาการ'),
  ('งานพัฒนานักศึกษาและศิษย์เก่าสัมพันธ์'),
  ('งานทะเบียนและประมวลผล'),
  ('ศูนย์สนเทศและการเรียนรู้'),
  ('ศูนย์ปฏิบัติการทางวิทยาศาสตร์และเครื่องมือกลาง'),
  ('คณะวิทยาศาสตร์และเทคโนโลยีอุตสาหกรรม'),
  ('คณะศิลปศาสตร์และวิทยาการจัดการ'),
  ('ศูนย์บริการวิชาการ'),
  ('ศูนย์การจัดการโรงแรม ที่พัก และหอพัก'),
  ('ศูนย์กีฬาและสุขภาพ'),
  ('งานพัสดุ'),
  ('งานโครงสร้างกายภาพและวิศวกรรม'),
  ('งานวิจัย บัณฑิตศึกษา และวิเทศสัมพันธ์'),
  ('สำนักงานวิทยาเขตสุราษฎร์ธานี'),
  ('คณะนวัตกรรมการเกษตร ประมง และอาหาร')
);

create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table technicians enable row level security;
drop policy if exists "anyone can read technicians" on technicians;
create policy "anyone can read technicians" on technicians for select using (true);
drop policy if exists "staff manage technicians" on technicians;
create policy "staff manage technicians" on technicians for all
  using (is_staff()) with check (is_staff());

alter table reports
  add column if not exists technician_id uuid references technicians(id) on delete set null;

-- ตารางสาธารณะและหน้าติดตาม: ผู้รับผิดชอบมาจากรายชื่อใหม่ก่อน แล้วค่อยบัญชีเจ้าหน้าที่
create or replace function public_report_board(max_rows integer default 50)
returns table (
  created_at timestamptz,
  building_name text,
  location text,
  service_type_name text,
  equipment text,
  urgency text,
  status report_status,
  assignee_name text,
  resolved_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    r.created_at,
    b.name,
    coalesce(nullif(trim(r.location_detail), ''), rm.name),
    st.name,
    r.ai_equipment_type,
    r.urgency,
    r.status,
    coalesce(t.name, s.full_name),
    r.resolved_at
  from reports r
  join buildings b on b.id = r.building_id
  left join rooms rm on rm.id = r.room_id
  left join service_types st on st.id = r.service_type_id
  left join technicians t on t.id = r.technician_id
  left join staff s on s.id = r.assigned_to
  order by r.created_at desc
  limit least(greatest(coalesce(max_rows, 50), 1), 200);
$$;

create or replace function public_report_status(code text)
returns table (
  tracking_code text,
  status report_status,
  urgency text,
  building_name text,
  room_name text,
  service_type_name text,
  equipment text,
  assignee_name text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    r.tracking_code,
    r.status,
    r.urgency,
    b.name,
    coalesce(nullif(trim(r.location_detail), ''), rm.name),
    st.name,
    r.ai_equipment_type,
    coalesce(t.name, s.full_name),
    r.created_at,
    r.updated_at,
    r.resolved_at
  from reports r
  join buildings b on b.id = r.building_id
  left join rooms rm on rm.id = r.room_id
  left join service_types st on st.id = r.service_type_id
  left join technicians t on t.id = r.technician_id
  left join staff s on s.id = r.assigned_to
  where r.tracking_code = upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1;
$$;

notify pgrst, 'reload schema';
