-- 0012: เก็บว่าใครเป็นผู้แจ้ง
--
-- ผู้แจ้งเลือกประเภทก่อนเข้าหน้าแจ้งซ่อม
--   internal = บุคลากรภายใน (นักศึกษา/บุคลากร) ระบุรหัสและชื่อ
--   external = บุคคลภายนอก/บุคคลทั่วไป ไม่ต้องมีบัญชี
-- ยังไม่เชื่อม PSU Passport รหัสผู้แจ้งจึงเป็นค่าที่ผู้แจ้งกรอกเอง ใช้ระบุตัวและค้นประวัติ
-- ไม่ใช่การยืนยันตัวตน

alter table reports
  add column if not exists reporter_type text
    check (reporter_type is null or reporter_type in ('internal', 'external')),
  add column if not exists reporter_code text
    check (reporter_code is null or reporter_code ~ '^[A-Za-z0-9-]{3,20}$');

create index if not exists reports_reporter_code_idx
  on reports (reporter_code) where reporter_code is not null;

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
    and (reporter_type is distinct from 'internal' or (reporter_code is not null and reporter_name is not null))
    and (reporter_type is distinct from 'external' or reporter_code is null)
    and (contact_phone is null or char_length(contact_phone) <= 30)
    and (location_detail is null or char_length(location_detail) <= 200)
    and (ai_description is null or char_length(ai_description) <= 2000)
    and (ai_equipment_type is null or char_length(ai_equipment_type) <= 100)
    and (ai_suggested_equipment is null or char_length(ai_suggested_equipment) <= 100)
    and char_length(photo_path) <= 300
  );

notify pgrst, 'reload schema';
