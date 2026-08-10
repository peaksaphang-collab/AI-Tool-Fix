-- 0007_security_hardening.sql
-- ปิดช่องโหว่ที่พบจากการตรวจ RLS/Storage รอบวันที่ 2026-08-10
-- รันได้ทันทีใน Supabase → SQL Editor (idempotent รันซ้ำได้)

-- ─────────────────────────────────────────────────────────────
-- 1) [HIGH] reports: insert สาธารณะเปิดกว้างเกินไป
--    เดิม: with check (true) → ผู้ไม่หวังดีเรียก REST ตรงๆ แล้วยิงแถวที่
--    ตั้ง status='done', ผูก resolved_by/assigned_to, หรือปลอมผล AI ได้
--    ใหม่: ให้ยิงได้เฉพาะใบแจ้งใหม่ที่ยังไม่ถูกดำเนินการ
-- ─────────────────────────────────────────────────────────────
drop policy if exists "anyone can submit a report" on reports;
create policy "anyone can submit a report"
  on reports for insert
  with check (
    status = 'pending'
    and resolved_at is null
    and resolved_by is null
    and assigned_to is null
    -- กันสแปมข้อความยาว/payload บวม
    and (reporter_name is null or char_length(reporter_name) <= 100)
    and (contact_phone is null or char_length(contact_phone) <= 30)
    and (ai_description is null or char_length(ai_description) <= 2000)
    and (ai_equipment_type is null or char_length(ai_equipment_type) <= 100)
    and char_length(photo_path) <= 300
  );

-- ─────────────────────────────────────────────────────────────
-- 2) [HIGH] storage: bucket report-photos รับอัปโหลดอะไรก็ได้ ขนาดเท่าไรก็ได้
--    publishable key อยู่ใน JS bundle อยู่แล้ว (ตามดีไซน์) ดังนั้นใครก็ยิง
--    storage API ตรงได้ โดยไม่ผ่านการตรวจชนิดไฟล์ใน server action
--    ใหม่: บังคับ limit ที่ระดับ bucket (Supabase บังคับใช้ฝั่งเซิร์ฟเวอร์เสมอ)
-- ─────────────────────────────────────────────────────────────
update storage.buckets
set
  file_size_limit = 10485760,  -- 10 MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'report-photos';

-- บังคับให้ path ต้องอยู่ใต้โฟลเดอร์อาคาร (uuid/uuid.ext) กัน dump ไฟล์มั่วที่ root
drop policy if exists "anyone can upload a report photo" on storage.objects;
create policy "anyone can upload a report photo"
  on storage.objects for insert
  with check (
    bucket_id = 'report-photos'
    and array_length(storage.foldername(name), 1) = 1
    and char_length(name) <= 300
  );

-- ─────────────────────────────────────────────────────────────
-- 3) [MED] ปิด update/delete บน object ของ bucket นี้ให้ชัดเจน
--    (ค่า default คือ deny อยู่แล้ว แต่ประกาศไว้กัน migration อนาคตเผลอเปิด)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "no one can modify report photos" on storage.objects;
create policy "no one can modify report photos"
  on storage.objects for update
  using (bucket_id = 'report-photos' and is_staff())
  with check (bucket_id = 'report-photos' and is_staff());

drop policy if exists "staff can delete report photos" on storage.objects;
create policy "staff can delete report photos"
  on storage.objects for delete
  using (bucket_id = 'report-photos' and is_staff());

-- ─────────────────────────────────────────────────────────────
-- 4) ตรวจผล
-- ─────────────────────────────────────────────────────────────
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'report-photos';
