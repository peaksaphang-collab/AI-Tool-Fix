-- 0009: ชั้นข้อมูลสำหรับวัดผลตามวัตถุประสงค์งานวิจัย
--
-- ปัญหาที่แก้: เดิมเมื่อเจ้าหน้าที่แก้ประเภท/ความด่วน/ชื่ออุปกรณ์
-- ค่าจะทับของที่ AI เดาไว้ ทำให้ย้อนกลับไปวัด "AI ทายถูกกี่%" ไม่ได้อีกเลย
-- ทั้งที่เป็น KPI หลักของงานวิจัย (ความแม่นยำ ≥ 85%)
--
-- วิธีแก้: เก็บคำทายของ AI ไว้แยกถาวร (ai_suggested_*) ส่วนคอลัมน์เดิม
-- กลายเป็น "ค่าที่ยืนยันแล้ว" ที่เจ้าหน้าที่แก้ได้ตามปกติ

-- ── คำทายดั้งเดิมของ AI (เขียนครั้งเดียวตอนสร้างใบ ห้ามแก้) ──
alter table reports
  add column if not exists ai_suggested_service_type_id smallint,
  add column if not exists ai_suggested_urgency text,
  add column if not exists ai_suggested_equipment text,
  add column if not exists corrected_at timestamptz,
  add column if not exists corrected_by uuid references staff(id);

-- ใบเก่าที่ยังไม่เคยถูกแก้: ค่าปัจจุบันคือคำทายของ AI
update reports
set
  ai_suggested_service_type_id = coalesce(ai_suggested_service_type_id, service_type_id),
  ai_suggested_urgency = coalesce(ai_suggested_urgency, urgency),
  ai_suggested_equipment = coalesce(ai_suggested_equipment, ai_equipment_type)
where ai_confidence is not null;

-- ── เวลาที่ผู้ใช้ใช้กรอกฟอร์ม (วัด "ลดเวลาแจ้ง 80%") ──
alter table reports
  add column if not exists submit_seconds integer
    check (submit_seconds is null or (submit_seconds >= 0 and submit_seconds <= 7200));

-- ── ความพึงพอใจ (วัด "≥ 4.0/5.0") ──
alter table reports
  add column if not exists satisfaction_rating smallint
    check (satisfaction_rating is null or satisfaction_rating between 1 and 5),
  add column if not exists satisfaction_comment text
    check (satisfaction_comment is null or char_length(satisfaction_comment) <= 500),
  add column if not exists rated_at timestamptz;

-- ── ให้ผู้แจ้งให้คะแนนได้ด้วยรหัสติดตาม โดยไม่ต้องล็อกอิน ──
-- ให้คะแนนได้เฉพาะใบที่ปิดงานแล้ว และให้ได้ครั้งเดียว
create or replace function rate_report(code text, rating smallint, comment text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target reports%rowtype;
begin
  if rating is null or rating < 1 or rating > 5 then
    return 'invalid_rating';
  end if;

  select * into target
  from reports
  where tracking_code = upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1;

  if not found then
    return 'not_found';
  end if;
  if target.status not in ('done', 'cannot_proceed') then
    return 'not_closed';
  end if;
  if target.rated_at is not null then
    return 'already_rated';
  end if;

  update reports
  set satisfaction_rating = rating,
      satisfaction_comment = nullif(left(trim(coalesce(comment, '')), 500), ''),
      rated_at = now()
  where id = target.id;

  return 'ok';
end;
$$;

revoke all on function rate_report(text, smallint, text) from public;
grant execute on function rate_report(text, smallint, text) to anon, authenticated;

-- ── สรุปตัวชี้วัดงานวิจัยในที่เดียว (เจ้าหน้าที่เท่านั้น) ──
create or replace function research_metrics()
returns table (
  ai_analyzed bigint,
  ai_type_correct bigint,
  ai_type_accuracy numeric,
  ai_urgency_correct bigint,
  ai_urgency_accuracy numeric,
  avg_submit_seconds numeric,
  rated_count bigint,
  avg_satisfaction numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    count(*) filter (where ai_suggested_service_type_id is not null) as ai_analyzed,
    count(*) filter (
      where ai_suggested_service_type_id is not null
        and ai_suggested_service_type_id = service_type_id
    ) as ai_type_correct,
    round(
      100.0 * count(*) filter (
        where ai_suggested_service_type_id is not null
          and ai_suggested_service_type_id = service_type_id
      ) / nullif(count(*) filter (where ai_suggested_service_type_id is not null), 0),
      1
    ) as ai_type_accuracy,
    count(*) filter (
      where ai_suggested_urgency is not null and ai_suggested_urgency = urgency
    ) as ai_urgency_correct,
    round(
      100.0 * count(*) filter (
        where ai_suggested_urgency is not null and ai_suggested_urgency = urgency
      ) / nullif(count(*) filter (where ai_suggested_urgency is not null), 0),
      1
    ) as ai_urgency_accuracy,
    round(avg(submit_seconds) filter (where submit_seconds is not null), 1)
      as avg_submit_seconds,
    count(*) filter (where satisfaction_rating is not null) as rated_count,
    round(avg(satisfaction_rating) filter (where satisfaction_rating is not null), 2)
      as avg_satisfaction
  from reports;
$$;

revoke all on function research_metrics() from public;
grant execute on function research_metrics() to authenticated;

-- ── เปิดให้ใบใหม่พกคำทาย AI + เวลากรอกฟอร์มมาด้วยได้ ──
-- (ยังล็อกไม่ให้ตั้งสถานะ/ผู้รับผิดชอบ/คะแนนเองเหมือนเดิม)
drop policy if exists "anyone can submit a report" on reports;
create policy "anyone can submit a report"
  on reports for insert
  with check (
    status = 'pending'
    and resolved_at is null
    and resolved_by is null
    and assigned_to is null
    and satisfaction_rating is null
    and rated_at is null
    and corrected_at is null
    and (tracking_code is null or tracking_code ~ '^[A-Z0-9]{6}$')
    and (reporter_name is null or char_length(reporter_name) <= 100)
    and (contact_phone is null or char_length(contact_phone) <= 30)
    and (ai_description is null or char_length(ai_description) <= 2000)
    and (ai_equipment_type is null or char_length(ai_equipment_type) <= 100)
    and (ai_suggested_equipment is null or char_length(ai_suggested_equipment) <= 100)
    and char_length(photo_path) <= 300
  );
