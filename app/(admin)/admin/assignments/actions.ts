"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | undefined;

const uuid = (msg: string) =>
  z.string().trim().regex(/^[0-9a-f-]{36}$/i, msg);

const schema = z.object({
  teacher_id: uuid("Select a teacher."),
  class_id: uuid("Select a class."),
  subject_id: uuid("Select a subject."),
});

export async function createAssignment(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const parsed = schema.safeParse({
    teacher_id: formData.get("teacher_id") ?? "",
    class_id: formData.get("class_id") ?? "",
    subject_id: formData.get("subject_id") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_assignments").insert(parsed.data);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That teacher is already assigned to this class and subject."
          : "Could not create the assignment.",
    };
  }

  revalidatePath("/admin/assignments");
  return { success: true };
}

export async function deleteAssignment(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
  if (error) throw new Error("Could not remove the assignment.");

  revalidatePath("/admin/assignments");
}
