"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AttendanceState =
  | { error?: string; success?: boolean; count?: number }
  | undefined;

const STATUSES = ["present", "absent", "late", "excused"] as const;

export async function saveAttendance(
  _prev: AttendanceState,
  formData: FormData
): Promise<AttendanceState> {
  const profile = await requireRole("teacher");

  const classId = String(formData.get("class_id") ?? "");
  const date = String(formData.get("date") ?? "");

  if (!/^[0-9a-f-]{36}$/i.test(classId)) return { error: "Invalid class." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { error: "Invalid date." };
  }

  const supabase = await createClient();

  // RLS only returns students from classes this teacher is assigned to.
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("class_id", classId);

  const rows = [];
  for (const s of students ?? []) {
    const status = String(formData.get(`status_${s.id}`) ?? "");
    if ((STATUSES as readonly string[]).includes(status)) {
      rows.push({
        student_id: s.id,
        class_id: classId,
        date,
        status,
        marked_by: profile.id,
      });
    }
  }

  if (rows.length === 0) {
    return { error: "Mark at least one student before saving." };
  }

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "student_id,date" });
  if (error) return { error: "Could not save attendance. Please try again." };

  revalidatePath(`/teacher/classes/${classId}/attendance`);
  return { success: true, count: rows.length };
}
