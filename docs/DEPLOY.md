# Deploy ขึ้น Vercel — เหลือ 3 คลิก

> สถานะ: โค้ด + ฐานข้อมูล + ทดสอบ E2E ผ่านครบแล้ว (ดู HANDOFF.md)
> เหลือแค่กด Deploy ในบัญชี Vercel ของเจ้าของโปรเจกต์

## ขั้นตอน (ทำในบราวเซอร์ที่ล็อกอิน Vercel อยู่)

1. เปิด [vercel.com/new](https://vercel.com/new) → Import repo `peaksaphang-collab/AI-Tool-Fix`
   (หน้า import ตั้งค่าอัตโนมัติถูกแล้ว: Next.js preset, root `./`)
2. กดขยาย **Environment Variables** แล้วใส่ 2 ค่านี้:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://zlultiyagkyzirenaokq.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_0wkhAKcsZjtugzzTJrhF0w_7TTUb6Yx` |

   (สองค่านี้เป็น public key ออกแบบมาให้อยู่ฝั่ง browser ได้ ปลอดภัย)

   ถ้ามี `ANTHROPIC_API_KEY` แล้วใส่เพิ่มได้เลย — ไม่มีก็ deploy ได้ ระบบยังรับแจ้งซ่อมปกติ
   (ช่องวิเคราะห์ AI จะว่างไว้ให้เจ้าหน้าที่กรอกเอง)

3. กด **Deploy** — เสร็จแล้วจะได้ URL `https://ai-tool-fix.vercel.app` (หรือใกล้เคียง)

## หลัง deploy ครั้งแรก

- ทุกครั้งที่ push ขึ้น branch `main` Vercel จะ deploy ใหม่อัตโนมัติ
- ทดสอบตาม checklist ใน HANDOFF.md ข้อ 4 บนโดเมนจริง
- อย่าลืมสร้างบัญชีเจ้าหน้าที่ (HANDOFF.md ข้อ 3) ก่อน demo หน้า dashboard
