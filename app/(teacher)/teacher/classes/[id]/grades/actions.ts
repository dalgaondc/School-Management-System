"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | undefined;
export type GradesState =
  | { error?: string; success?: boolean; saved?: number }
  | undefined;

const uuidRe = /^[0-9a-f-]{36}$/i;

const createSchema = z.object({
  name: z.string().trim().min(1, "Exam name is required.").max(100),
  class_id: z.string().trim().regex(uuidRe, "Invalid class."),
  subject_id: z.string().trim().regex(uuidRe, "Select a subject."),
});

// A teacher may manage an exam only if they are assigned to that class AND subject.
async function teachesSubject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  classId: string,
  subjectId: string | null
) {
  if (!subjectId) return false;
  const { data } = await supabase
    .from("teacher_assignments")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .maybeSingle();
  return !!data;
}

export async function createExam(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireRole("teacher");

  const parsed = createSchema.safeParse({
    name: formData.get("name") ?? "",
    class_id: formData.get("class_id") ?? "",
    subject_id: formData.get("subject_id") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const max = Number(String(formData.get("max_marks") ?? "").trim());
  if (!Number.isFinite(max) || max <= 0 || max > 10000) {
    return { error: "Maximum marks must be a number greater than 0." };
  }

  const supabase = await createClient();
  const { class_id, subject_id, name } = parsed.data;
  if (!(await teachesSubject(supabase, profile.id, class_id, subject_id))) {
    return { error: "You are not assigned to that subject in this class." };
  }

  const { error } = await supabase
    .from("exams")
    .insert({ name, class_id, subject_id, max_marks: max });
  if (error) return { error: "Could not create the exam." };

  revalidatePath(`/teacher/classes/${class_id}/grades`);
  return { success: true };
}

export async function deleteExam(formData: FormData): Promise<void> {
  const profile = await requireRole("teacher");
  const id = String(formData.get("id") ?? "");
  if (!uuidRe.test(id)) return;

  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("id, class_id, subject_id")
    .eq("id", id)
    .maybeSingle();
  if (!exam || !(await teachesSubject(supabase, profile.id, exam.class_id, exam.subject_id))) {
    throw new Error("You cannot delete this exam.");
  }

  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw new Error("Could not delete the exam.");

  revalidatePath(`/teacher/classes/${exam.class_id}/grades`);
}

export async function saveGrades(
  _prev: GradesState,
  formData: FormData
): Promise<GradesState> {
  const profile = await requireRole("teacher");
  const examId = String(formData.get("exam_id") ?? "");
  if (!uuidRe.test(examId)) return { error: "Invalid exam." };

  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("id, class_id, subject_id, max_marks")
    .eq("id", examId)
    .maybeSingle();
  if (!exam || !(await teachesSubject(supabase, profile.id, exam.class_id, exam.subject_id))) {
    return { error: "You cannot enter marks for this exam." };
  }

  const max = Number(exam.max_marks);
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("class_id", exam.class_id);

  const rows: { exam_id: string; student_id: string; marks: number }[] = [];
  const toClear: string[] = [];

  for (const s of students ?? []) {
    const raw = String(formData.get(`marks_${s.id}`) ?? "").trim();
    if (raw === "") {
      toClear.push(s.id); // blank means "no marks": remove any earlier entry
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > max) {
      return { error: `Marks for ${s.full_name} must be between 0 and ${max}.` };
    }
    rows.push({ exam_id: examId, student_id: s.id, marks: n });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("grades")
      .upsert(rows, { onConflict: "exam_id,student_id" });
    if (error) return { error: "Could not save marks. Please try again." };
  }
  if (toClear.length > 0) {
    const { error } = await supabase
      .from("grades")
      .delete()
      .eq("exam_id", examId)
      .in("student_id", toClear);
    if (error) return { error: "Could not clear blank marks." };
  }

  revalidatePath(`/teacher/classes/${exam.class_id}/grades`);
  revalidatePath(`/teacher/classes/${exam.class_id}/grades/${examId}`);
  return { success: true, saved: rows.length };
}
