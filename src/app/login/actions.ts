"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "error";
  message?: string;
}

// Supabase answers several very different situations with the same 400, so a
// single "wrong password" message sends staff chasing a password that was never
// the problem. Split them out.
function messageForAuthError(code: string | undefined, status: number | undefined, raw: string) {
  const text = `${code ?? ""} ${raw}`.toLowerCase();

  if (text.includes("email_not_confirmed") || text.includes("email not confirmed")) {
    return "บัญชีนี้ยังไม่ได้ยืนยันอีเมล ให้ผู้ดูแลระบบกดยืนยันให้ก่อน";
  }
  if (status === 429 || text.includes("over_request_rate_limit") || text.includes("too many")) {
    return "ลองเข้าสู่ระบบบ่อยเกินไป รอสักครู่แล้วลองใหม่";
  }
  if (text.includes("invalid_credentials") || text.includes("invalid login")) {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่มีบัญชีนี้ในระบบ";
  }
  return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { status: "error", message: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message: messageForAuthError(error.code, error.status, error.message),
    };
  }

  // Signing in is not the same as being staff: a user with no row in `staff`
  // passes auth but every dashboard query returns nothing under RLS, which
  // looks like a broken page instead of a missing permission.
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!staffRow) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "บัญชีนี้ยังไม่ได้รับสิทธิ์เจ้าหน้าที่ ให้ผู้ดูแลเพิ่มบัญชีนี้ในตาราง staff ก่อน",
    };
  }

  redirect("/dashboard");
}
