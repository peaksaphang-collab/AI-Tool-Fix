-- Sample buildings and rooms so the report form has something to pick from.
-- Replace these with the real building/room list before going live.

insert into buildings (name) values
  ('อาคารเรียนรวม 1'),
  ('อาคารเรียนรวม 2'),
  ('อาคารสำนักงาน'),
  ('หอสมุด')
on conflict (name) do nothing;

insert into rooms (building_id, name, floor)
select b.id, r.name, r.floor
from buildings b
join (values
  ('อาคารเรียนรวม 1', 'ห้อง 101', '1'),
  ('อาคารเรียนรวม 1', 'ห้อง 102', '1'),
  ('อาคารเรียนรวม 1', 'ห้อง 201', '2'),
  ('อาคารเรียนรวม 1', 'ห้อง 202', '2'),
  ('อาคารเรียนรวม 2', 'ห้อง 301', '3'),
  ('อาคารเรียนรวม 2', 'ห้อง 302', '3'),
  ('อาคารเรียนรวม 2', 'ห้องปฏิบัติการคอมพิวเตอร์', '4'),
  ('อาคารสำนักงาน', 'ห้องธุรการ', '1'),
  ('อาคารสำนักงาน', 'ห้องประชุมใหญ่', '2'),
  ('หอสมุด', 'โซนอ่านหนังสือ ชั้น 1', '1'),
  ('หอสมุด', 'โซนคอมพิวเตอร์ ชั้น 2', '2')
) as r(building_name, name, floor) on r.building_name = b.name
on conflict (building_id, name) do nothing;
