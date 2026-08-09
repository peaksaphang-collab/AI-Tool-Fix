"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/supabase/types";

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_by: status === "done" ? user.id : null })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function assignReport(reportId: string, staffId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("reports")
    .update({ assigned_to: staffId })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function getSignedPhotoUrl(photoPath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("report-photos")
    .createSignedUrl(photoPath, 60 * 60);

  if (error || !data) return null;
  return data.signedUrl;
}
