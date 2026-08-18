import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ดีฟอลต์ 1MB เล็กเกินไปสำหรับรูปจากกล้องมือถือ ฝั่งหน้าเว็บย่อรูปให้อยู่แล้ว
    // ค่านี้เป็นตาข่ายรองรับกรณีย่อไม่สำเร็จ (Vercel เพดานจริงราว 4.5MB)
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
