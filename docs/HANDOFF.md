# ขั้นตอนที่เหลือก่อนเปิดใช้งานจริง

> หมายเหตุ: repo นี้เป็นสาธารณะ — ห้าม commit คีย์ อีเมล หรือข้อมูลส่วนบุคคลลงไฟล์ใด ๆ
> ค่าลับทั้งหมดอยู่ใน `.env.local` ซึ่งถูก gitignore ไว้แล้ว

## 1. ตั้งค่า environment (ทำครั้งเดียว)

```bash
cp .env.local.example .env.local
```

เติมค่าใน `.env.local`:

| ตัวแปร | หาได้จาก |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ที่เดียวกัน → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ที่เดียวกัน → service_role (เก็บลับสุด ใช้ฝั่ง server เท่านั้น) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys (ใช้วิเคราะห์รูป) |

## 2. รัน migration ใน Supabase SQL Editor (ตามลำดับ)

1. `supabase/migrations/0001_init.sql` — ✅ รันแล้ว
2. `supabase/migrations/0002_storage.sql` — ✅ รันแล้ว
3. `supabase/migrations/0003_seed.sql` — อาคาร/ห้องตัวอย่าง (แก้ชื่อเป็นของจริงก่อนเปิดใช้)
4. `supabase/migrations/0004_status_cannot_proceed.sql` — สถานะ "ดำเนินการไม่ได้" (**รันแยก ห้ามรวมกับไฟล์อื่น**)
5. `supabase/migrations/0005_service_types_and_fields.sql` — ประเภทงาน 5 แบบ + ความเร่งด่วน + ผู้รับผิดชอบ

## 3. สร้างบัญชีเจ้าหน้าที่คนแรก

1. Supabase Dashboard → Authentication → Users → **Add user** (อีเมล + รหัสผ่าน)
2. copy UUID ของ user ที่สร้าง แล้วรันใน SQL Editor:

```sql
insert into staff (id, full_name) values ('<UUID>', 'ชื่อเจ้าหน้าที่');
```

## 4. ทดสอบระบบ

```bash
npm install
npm run dev
```

- `/report` — แจ้งซ่อม (ถ่ายรูป → เลือกอาคาร/ห้อง → ส่ง)
- `/login` → `/dashboard` — บอร์ดสถานะ (เปิด 2 จอเทสต์ realtime + toast แจ้งเตือน)
- `/dashboard/analytics` — KPI / Kanban / Timeline / Heatmap / ปฏิทิน / สรุปรายวัน-เดือน-ปี

## 5. Deploy (Vercel)

1. vercel.com → Import repo นี้
2. ใส่ env ทั้ง 4 ตัวจากข้อ 1 ใน Project Settings → Environment Variables
3. Deploy — เสร็จแล้วทดสอบซ้ำตามข้อ 4 บนโดเมนจริง

## สไลด์นำเสนอ

`docs/slides.html` — เปิดในเบราว์เซอร์ได้เลย (11 หน้า, กด ←/→)
ครอบคลุม Input→Process→Output, flow, AI logic, โครงสร้าง DB, เทคโนโลยีที่ใช้
