-- 0008: รหัสติดตามสำหรับผู้แจ้ง + สถิติรวมแบบไม่ระบุตัวตน
-- ออกแบบให้ "ผู้แจ้งติดตามใบของตัวเองได้" โดยไม่เปิดข้อมูลส่วนบุคคลของคนอื่น

alter table reports add column if not exists tracking_code text;

create unique index if not exists reports_tracking_code_key
  on reports (tracking_code) where tracking_code is not null;

-- ─────────────────────────────────────────────────────────────
-- ค้นสถานะจากรหัสติดตาม
-- SECURITY DEFINER + คืนเฉพาะคอลัมน์ที่ปลอดภัย
-- ไม่คืน ชื่อผู้แจ้ง / เบอร์โทร / รูป / ผู้รับผิดชอบ
-- ต้องรู้รหัสเท่านั้นจึงจะเห็น (เดาไม่ได้ 32^6 ≈ 1 พันล้านชุด)
-- ─────────────────────────────────────────────────────────────
create or replace function public_report_status(code text)
returns table (
  tracking_code text,
  status report_status,
  urgency text,
  building_name text,
  room_name text,
  service_type_name text,
  equipment text,
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
    rm.name,
    st.name,
    r.ai_equipment_type,
    r.created_at,
    r.updated_at,
    r.resolved_at
  from reports r
  join buildings b on b.id = r.building_id
  join rooms rm on rm.id = r.room_id
  left join service_types st on st.id = r.service_type_id
  where r.tracking_code = upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1;
$$;

-- ─────────────────────────────────────────────────────────────
-- สถิติรวม 30 วัน — ตัวเลขล้วน ไม่มีข้อมูลใคร ใช้สร้างความเชื่อมั่นหน้าแรก
-- ─────────────────────────────────────────────────────────────
create or replace function public_repair_stats()
returns table (
  done_30d bigint,
  open_now bigint,
  avg_hours numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    count(*) filter (
      where status = 'done' and resolved_at > now() - interval '30 days'
    ) as done_30d,
    count(*) filter (
      where status in ('pending', 'in_progress')
    ) as open_now,
    round(avg(
      extract(epoch from (resolved_at - created_at)) / 3600
    ) filter (
      where status = 'done' and resolved_at > now() - interval '30 days'
    )::numeric, 1) as avg_hours
  from reports;
$$;

-- ─────────────────────────────────────────────────────────────
-- นับใบที่ยังค้างในห้องหนึ่ง — ใช้เตือน "ห้องนี้มีคนแจ้งไว้แล้ว" กันแจ้งซ้ำ
-- ─────────────────────────────────────────────────────────────
create or replace function public_open_count_for_room(room uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int
  from reports
  where room_id = room
    and status in ('pending', 'in_progress');
$$;

revoke all on function public_report_status(text) from public;
revoke all on function public_repair_stats() from public;
revoke all on function public_open_count_for_room(uuid) from public;

grant execute on function public_report_status(text) to anon, authenticated;
grant execute on function public_repair_stats() to anon, authenticated;
grant execute on function public_open_count_for_room(uuid) to anon, authenticated;

-- อนุญาตให้ใบแจ้งใหม่พก tracking_code มาด้วยได้ (ยังคงล็อกฟิลด์อื่นเหมือนเดิม)
drop policy if exists "anyone can submit a report" on reports;
create policy "anyone can submit a report"
  on reports for insert
  with check (
    status = 'pending'
    and resolved_at is null
    and resolved_by is null
    and assigned_to is null
    and (tracking_code is null or tracking_code ~ '^[A-Z0-9]{6}$')
    and (reporter_name is null or char_length(reporter_name) <= 100)
    and (contact_phone is null or char_length(contact_phone) <= 30)
    and (ai_description is null or char_length(ai_description) <= 2000)
    and (ai_equipment_type is null or char_length(ai_equipment_type) <= 100)
    and char_length(photo_path) <= 300
  );
