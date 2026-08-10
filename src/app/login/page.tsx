import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <SiteHeader backHref="/" />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-50 to-white px-4 py-16">
        <Image
          src="/logo.png"
          alt="ระบบแจ้งซ่อม"
          width={667}
          height={593}
          priority
          className="h-auto w-40 max-w-full"
        />
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบเจ้าหน้าที่</h1>
        <LoginForm />
      </main>
    </>
  );
}
