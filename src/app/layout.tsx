import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-tool-fix.vercel.app"),
  title: "ระบบแจ้งซ่อม | Repair Notify System",
  description: "แจ้งซ่อมอุปกรณ์ด้วยรูปถ่าย ให้ AI วิเคราะห์ และติดตามสถานะแบบเรียลไทม์",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  openGraph: {
    title: "ระบบแจ้งซ่อม | Repair Notify System",
    description: "แจ้งซ่อมอุปกรณ์ด้วยรูปถ่าย ให้ AI วิเคราะห์ และติดตามสถานะแบบเรียลไทม์",
    images: [{ url: "/logo.png", width: 667, height: 593 }],
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${plexSansThai.variable} h-full antialiased`}
      style={{ fontFamily: "var(--font-plex-sans-thai), sans-serif" }}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
