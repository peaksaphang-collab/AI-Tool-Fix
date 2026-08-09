import { SiteHeader } from "@/components/site-header";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <SiteHeader backHref="/" />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบเจ้าหน้าที่</h1>
        <LoginForm />
      </main>
    </>
  );
}
