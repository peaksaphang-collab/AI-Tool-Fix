"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REPORTER_CODE, REPORTER_COOKIE, type Reporter } from "@/lib/reporter";

export interface StartState {
  status: "idle" | "error";
  message?: string;
}

// อยู่ได้ครึ่งวัน เครื่องส่วนกลางจะได้ไม่ค้างชื่อคนก่อนหน้าไว้นาน
const SESSION_SECONDS = 60 * 60 * 12;

async function setReporter(reporter: Reporter) {
  const store = await cookies();
  store.set(REPORTER_COOKIE, JSON.stringify(reporter), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function signInInternal(
  _prev: StartState,
  formData: FormData
): Promise<StartState> {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");

  if (!REPORTER_CODE.test(code)) {
    return {
      status: "error",
      message: "รหัสผู้ใช้เป็นตัวเลขหรือตัวอักษร 3–20 ตัว เช่น รหัสนักศึกษา 10 หลัก",
    };
  }
  if (name.length < 2 || name.length > 100) {
    return { status: "error", message: "กรุณากรอกชื่อ-นามสกุล" };
  }

  await setReporter({ type: "internal", code, name });
  redirect("/report");
}

export async function continueAsGuest() {
  await setReporter({ type: "external" });
  redirect("/report");
}

export async function signOutReporter() {
  const store = await cookies();
  store.delete(REPORTER_COOKIE);
  redirect("/start");
}
