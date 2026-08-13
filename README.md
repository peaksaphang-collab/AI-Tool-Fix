# AI-Tool-Fix — ระบบแจ้งซ่อม

ระบบแจ้งซ่อมอุปกรณ์ที่ให้ผู้แจ้งถ่ายรูป เลือกอาคาร/ห้อง แล้วให้ AI วิเคราะห์ว่าอุปกรณ์อะไรเสียโดยอัตโนมัติ พร้อมแดชบอร์ดสำหรับเจ้าหน้าที่ติดตามสถานะแบบเรียลไทม์และดูสรุปข้อมูล

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpeaksaphang-collab%2FAI-Tool-Fix&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,ANTHROPIC_API_KEY&envDescription=URL%20และ%20anon%20key%20จาก%20Supabase%20(ANTHROPIC_API_KEY%20ใส่ทีหลังได้)&project-name=ai-tool-fix&repository-name=ai-tool-fix)

กดปุ่มด้านบนในบราวเซอร์ที่ล็อกอิน Vercel อยู่ — หน้า import จะถามค่า env ให้ครบเอง
ค่าที่ต้องกรอกอยู่ใน [`docs/DEPLOY.md`](docs/DEPLOY.md) (copy วางได้เลย)

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions)
- [Supabase](https://supabase.com) — Postgres + Auth + Storage + Realtime
- [Claude Vision API](https://docs.claude.com) — วิเคราะห์รูปภาพที่แจ้งซ่อม
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) (Base UI)
- Recharts, dnd-kit สำหรับ Kanban board

## Getting started

```bash
npm install
cp .env.local.example .env.local   # แล้วกรอกค่าตาม Supabase project + Anthropic API key
```

รัน migration ใน Supabase SQL Editor ตามลำดับ:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_storage.sql`

จากนั้นสร้าง staff account: สมัคร user ผ่าน Supabase Auth แล้ว insert แถวใน `staff` table ด้วย `id` เดียวกับ `auth.users.id`

```bash
npm run dev
```

## Routes

- `/` — หน้าแรก
- `/report` — ฟอร์มแจ้งซ่อม (สาธารณะ ไม่ต้อง login)
- `/login` — เข้าสู่ระบบเจ้าหน้าที่
- `/dashboard` — บอร์ดสถานะแบบเรียลไทม์ (เสร็จแล้ว / ยังไม่เสร็จ)
- `/dashboard/analytics` — KPI, Kanban, Timeline, Heatmap, ปฏิทิน
