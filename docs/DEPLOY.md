# Deploy — ขึ้นใช้งานจริงแล้ว

**URL ใช้งานจริง: https://ai-tool-fix-two.vercel.app**

| หน้า | ลิงก์ |
|---|---|
| แจ้งซ่อม (สาธารณะ) | https://ai-tool-fix-two.vercel.app/report |
| ติดตามสถานะ | https://ai-tool-fix-two.vercel.app/track |
| เจ้าหน้าที่ | https://ai-tool-fix-two.vercel.app/login |

Vercel project: `suphanats-projects/ai-tool-fix` — env ตั้งครบทั้ง production/preview/development แล้ว

## deploy รอบถัดไป

```bash
npx vercel deploy --prod --yes
```

## ที่ยังเหลือ

1. **รัน `supabase/migrations/0009_research_metrics.sql`** ใน SQL Editor
   — ระบบทำงานได้ปกติแม้ยังไม่รัน แต่ยังไม่เก็บข้อมูลตัวชี้วัดงานวิจัย
   และแผงตัวชี้วัดในหน้าสรุปจะขึ้นข้อความบอกให้ไปรัน
2. **สร้างบัญชีเจ้าหน้าที่** — Supabase > Authentication > Users > Add user
   แล้ว `insert into staff (id, full_name) values ('<UUID>', 'ชื่อ');`
3. **ANTHROPIC_API_KEY** (ไม่บังคับ) — ใส่แล้ว AI จะวิเคราะห์รูปให้อัตโนมัติ
   ```bash
   npx vercel env add ANTHROPIC_API_KEY production
   ```
