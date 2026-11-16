"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | undefined;

const schema = z.object({
  name: z.string().trim().min(1, "Subject name is required.").max(60),
});

export async function createSubject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const parsed = schema.safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert(parsed.data);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A subject with that name already exists."
          : "Could not create the subject.",
    };
  }

  revalidatePath("/admin/subjects");
  return { success: true };
}

export async function updateSubject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({ name: formData.get("name") ?? "" });
  if (!id) return { error: "Missing subject id." };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").update(parsed.data).eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A subject with that name already exists."
          : "Could not update the subject.",
    };
  }

  revalidatePath("/admin/subjects");
  return { success: true };
}

export async function deleteSubject(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) {
    throw new Error("Could not delete the subject. It may still be used by an exam.");
  }

  revalidatePath("/admin/subjects");
}
