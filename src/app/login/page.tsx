import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">เข้าสู่ระบบเจ้าหน้าที่</h1>
      <LoginForm />
    </main>
  );
}
