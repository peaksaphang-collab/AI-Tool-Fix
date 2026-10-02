-- 0011: ผู้แจ้งพิมพ์ห้อง/จุดเอง + ตารางแจ้งซ่อมสาธารณะ + เลือกผู้รับผิดชอบงานตอนแจ้ง
--
-- 1) ห้องเปลี่ยนจากเลือกในรายการเป็นพิมพ์เอง (location_detail)
--    room_id ไม่บังคับแล้ว แต่ใบแจ้งต้องมีอย่างใดอย่างหนึ่งเสมอ
-- 2) public_report_board: ตารางรายการแจ้งซ่อมล่าสุดแบบระบบเดิมของวิทยาเขต
--    คืนเฉพาะคอลัมน์ที่เปิดเผยได้ ไม่มีชื่อผู้แจ้ง เบอร์โทร รูป หรือรหัสติดตาม
-- 3) public_staff_names: รายชื่อเจ้าหน้าที่ให้ผู้แจ้งเลือกผู้รับผิดชอบงาน
-- 4) public_report_status: เพิ่มจุดที่แจ้งและผู้รับผิดชอบงาน
-- 5) อาคารครบตามแผนที่หน่วยงานวิทยาเขต (psu.ac.th/surat/mappsu)

-- ── 1) ห้อง/จุดที่ผู้แจ้งพิมพ์เอง ──
alter table reports
  add column if not exists location_detail text
    check (location_detail is null or char_length(location_detail) <= 200);

alter table reports alter column room_id drop not null;

alter table reports drop constraint if exists reports_location_present;
alter table reports add constraint reports_location_present
  check (room_id is not null or nullif(trim(location_detail), '') is not null);

-- ── 5) อาคารตามแผนที่หน่วยงาน ──
-- เปลี่ยนชื่อให้ตรงกับแผนที่ (id เดิม ใบแจ้งเก่าไม่กระทบ)
update buildings set name = 'งานทะเบียน'
  where name = 'งานทะเบียน สำนักงานวิทยาเขตสุราษฎร์ธานี'
    and not exists (select 1 from buildings where name = 'งานทะเบียน');
update buildings set name = 'หอประชุม'
  where name = 'อาคารหอประชุม'
    and not exists (select 1 from buildings where name = 'หอประชุม');
update buildings set name = 'หอชายนางยวนและหอชายเชี่ยวหลาน'
  where name = 'หอพักชายนางยวนและเชี่ยวหลาน'
    and not exists (select 1 from buildings where name = 'หอชายนางยวนและหอชายเชี่ยวหลาน');

insert into buildings (name) values
  ('สำนักงานวิทยาเขตสุราษฎร์ธานี'),
  ('คณะศิลปศาสตร์และวิทยาการจัดการ'),
  ('คณะวิทยาศาสตร์และเทคโนโลยีอุตสาหกรรม'),
  ('คณะนวัตกรรมการเกษตร ประมง และอาหาร'),
  ('ศูนย์สนเทศและการเรียนรู้'),
  ('ศูนย์ปฏิบัติการวิทยาศาสตร์และเครื่องมือกลาง'),
  ('สนามกีฬากลาง'),
  ('โรงอาหารหอใน'),
  ('อื่น ๆ (ระบุในช่องห้อง/จุดที่เสีย)')
on conflict (name) do nothing;

-- ── 2) ตารางแจ้งซ่อมสาธารณะ ──
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
    s.full_name,
    r.resolved_at
  from reports r
  join buildings b on b.id = r.building_id
  left join rooms rm on rm.id = r.room_id
  left join service_types st on st.id = r.service_type_id
  left join staff s on s.id = r.assigned_to
  order by r.created_at desc
  limit least(greatest(coalesce(max_rows, 50), 1), 200);
$$;

-- ── 3) รายชื่อเจ้าหน้าที่ (ชื่ออย่างเดียว) ──
create or replace function public_staff_names()
returns table (id uuid, full_name text)
language sql
security definer
stable
set search_path = public
as $$
  select id, full_name from staff order by full_name;
$$;

-- ── 4) ติดตามสถานะ: เพิ่มจุดที่แจ้ง + ผู้รับผิดชอบงาน ──
-- เปลี่ยนคอลัมน์ที่คืนค่า ต้อง drop ก่อน create ใหม่
drop function if exists public_report_status(text);
create function public_report_status(code text)
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
    s.full_name,
    r.created_at,
    r.updated_at,
    r.resolved_at
  from reports r
  join buildings b on b.id = r.building_id
  left join rooms rm on rm.id = r.room_id
  left join service_types st on st.id = r.service_type_id
  left join staff s on s.id = r.assigned_to
  where r.tracking_code = upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1;
$$;

revoke all on function public_report_board(integer) from public;
revoke all on function public_staff_names() from public;
revoke all on function public_report_status(text) from public;
grant execute on function public_report_board(integer) to anon, authenticated;
grant execute on function public_staff_names() to anon, authenticated;
grant execute on function public_report_status(text) to anon, authenticated;

-- ── ให้ใบใหม่พกจุดที่พิมพ์และผู้รับผิดชอบที่ผู้แจ้งเลือกมาได้ ──
-- assigned_to ต้องเป็นเจ้าหน้าที่จริง (FK) เจ้าหน้าที่เปลี่ยนภายหลังได้ในแดชบอร์ด
drop policy if exists "anyone can submit a report" on reports;
create policy "anyone can submit a report"
  on reports for insert
  with check (
    status = 'pending'
    and resolved_at is null
    and resolved_by is null
    and satisfaction_rating is null
    and rated_at is null
    and corrected_at is null
    and corrected_by is null
    and satisfaction_comment is null
    and (ai_suggested_urgency is null or ai_suggested_urgency in ('critical','high','medium','low'))
    and (ai_suggested_service_type_id is null or ai_suggested_service_type_id between 1 and 5)
    and (submit_seconds is null or submit_seconds between 0 and 7200)
    and (tracking_code is null or tracking_code ~ '^[A-Z0-9]{6}$')
    and (reporter_name is null or char_length(reporter_name) <= 100)
    and (contact_phone is null or char_length(contact_phone) <= 30)
    and (location_detail is null or char_length(location_detail) <= 200)
    and (ai_description is null or char_length(ai_description) <= 2000)
    and (ai_equipment_type is null or char_length(ai_equipment_type) <= 100)
    and (ai_suggested_equipment is null or char_length(ai_suggested_equipment) <= 100)
    and char_length(photo_path) <= 300
  );

notify pgrst, 'reload schema';
